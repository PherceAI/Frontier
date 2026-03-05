import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, isErrorResponse } from '@/lib/auth/guards';

type Params = {
    params: Promise<{
        taskId: string;
    }>;
};

/**
 * POST /api/operations/tasks/:taskId/evidence
 * 
 * Receives a photo from the employee, marks the task as "ANALYZING",
 * returns immediately, and processes the n8n AI analysis in the background
 * using fire-and-forget (no await on the n8n call).
 */
export async function POST(request: NextRequest, { params }: Params) {
    try {
        const authData = await requireSession(request);
        if (isErrorResponse(authData)) return authData;

        const { taskId } = await params;

        const formData = await request.formData();
        const file = formData.get('file') as File;
        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No se envió archivo' },
                { status: 400 }
            );
        }

        // Read file into memory BEFORE responding (ensure data is captured)
        const buffer = Buffer.from(await file.arrayBuffer());
        const mimeType = file.type || 'image/jpeg';

        const task = await prisma.task.findUnique({ where: { id: taskId } });
        if (!task) {
            return NextResponse.json(
                { success: false, error: 'Tarea no encontrada' },
                { status: 404 }
            );
        }

        // Build filename
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
        const empName = authData.employee.full_name.replace(/[^a-zA-Z0-9]/g, '');
        const titleSafe = task.title.replace(/[^a-zA-Z0-9]/g, '');
        const fileName = `${dateStr}_${timeStr}_${empName}_${titleSafe}.jpg`;

        const webhookUrl = process.env.N8N_AI_ANALYSIS_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;
        if (!webhookUrl) {
            throw new Error('n8n Webhook URL is missing in environment');
        }

        // Mark task as "ANALYZING" immediately
        await prisma.task.update({
            where: { id: taskId },
            data: { ai_status: 'ANALYZING' },
        });

        // Fire-and-forget: launch the n8n call without awaiting it.
        // The captured buffer/fileName/webhookUrl are all in the closure scope.
        processN8nInBackground(taskId, buffer, mimeType, fileName, webhookUrl, authData.employee.full_name);

        // Return immediately — employee doesn't wait for AI
        return NextResponse.json({
            success: true,
            analyzing: true,
            message: 'Foto recibida. El análisis de IA se está procesando en segundo plano.',
        });
    } catch (error: any) {
        console.error('[TASK EVIDENCE UPLOAD ERROR]', error);
        return NextResponse.json(
            { success: false, error: error?.message || 'Error procesando evidencia' },
            { status: 500 }
        );
    }
}

/**
 * Sends the photo to n8n for AI analysis in the background.
 * This function is NOT awaited — it runs as a detached promise.
 * All data (buffer, fileName, etc.) is captured by closure before the response is sent.
 */
function processN8nInBackground(
    taskId: string,
    buffer: Buffer,
    mimeType: string,
    fileName: string,
    webhookUrl: string,
    employeeName: string
): void {
    const run = async () => {
        console.log('[EVIDENCE BG] Starting background n8n upload for task:', taskId);

        const n8nFormData = new FormData();
        const fileBlob = new Blob([new Uint8Array(buffer)], { type: mimeType });
        n8nFormData.append('file', fileBlob, fileName);
        n8nFormData.append('taskId', taskId);
        n8nFormData.append('employee', employeeName);

        const response = await fetch(webhookUrl, {
            method: 'POST',
            body: n8nFormData,
            signal: AbortSignal.timeout(120_000), // 2 min for AI processing
        });

        const rawBody = await response.text();
        console.log('[EVIDENCE BG] n8n response:', response.status, 'body length:', rawBody.length);

        if (!response.ok) {
            console.error('[EVIDENCE BG] n8n error:', rawBody.substring(0, 500));
            await prisma.task.update({
                where: { id: taskId },
                data: {
                    ai_status: 'ERROR',
                    ai_analysis: `Error de n8n (HTTP ${response.status})`,
                },
            });
            return;
        }

        if (!rawBody || rawBody.trim().length === 0) {
            console.error('[EVIDENCE BG] n8n returned empty body');
            await prisma.task.update({
                where: { id: taskId },
                data: {
                    ai_status: 'ERROR',
                    ai_analysis: 'n8n devolvió respuesta vacía',
                },
            });
            return;
        }

        let n8nData: any;
        try {
            n8nData = JSON.parse(rawBody);
        } catch {
            console.error('[EVIDENCE BG] n8n non-JSON response:', rawBody.substring(0, 200));
            await prisma.task.update({
                where: { id: taskId },
                data: {
                    ai_status: 'ERROR',
                    ai_analysis: 'n8n no devolvió JSON válido',
                },
            });
            return;
        }

        const webViewLink = n8nData.url;
        const analysis = n8nData.analysis || null;
        const aiStatus = n8nData.status || 'UNKNOWN';

        if (!webViewLink) {
            await prisma.task.update({
                where: { id: taskId },
                data: {
                    ai_status: 'ERROR',
                    ai_analysis: `n8n no devolvió URL. Keys: ${Object.keys(n8nData).join(', ')}`,
                },
            });
            return;
        }

        // ✅ Success — update with full AI results
        await prisma.task.update({
            where: { id: taskId },
            data: {
                evidence_url: webViewLink,
                ai_analysis: analysis,
                ai_status: aiStatus,
            },
        });

        console.log('[EVIDENCE BG] ✅ AI analysis complete for task:', taskId, '→', aiStatus);
    };

    // Fire-and-forget: catch errors to prevent unhandled rejection
    run().catch(async (err) => {
        console.error('[EVIDENCE BG] Background processing failed:', err?.message);
        try {
            await prisma.task.update({
                where: { id: taskId },
                data: {
                    ai_status: 'ERROR',
                    ai_analysis: `Error: ${err?.message || 'Fallo inesperado'}`,
                },
            });
        } catch {
            // DB update also failed, log and move on
            console.error('[EVIDENCE BG] Failed to update error status in DB');
        }
    });
}
