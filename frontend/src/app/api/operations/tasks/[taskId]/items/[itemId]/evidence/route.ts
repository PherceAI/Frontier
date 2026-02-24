import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, isErrorResponse } from '@/lib/auth/guards';

type Params = {
    params: Promise<{
        taskId: string;
        itemId: string;
    }>;
};

export async function POST(request: NextRequest, { params }: Params) {
    try {
        const authData = await requireSession(request);
        if (isErrorResponse(authData)) return authData;

        const { taskId, itemId } = await params;
        const itemIdNum = parseInt(itemId, 10);

        if (isNaN(itemIdNum)) return NextResponse.json({ success: false, error: 'ID de ítem inválido' }, { status: 400 });

        const formData = await request.formData();
        const file = formData.get('file') as File;
        if (!file) return NextResponse.json({ success: false, error: 'No se envió archivo' }, { status: 400 });

        const buffer = Buffer.from(await file.arrayBuffer());

        const checklistItem = await prisma.taskChecklistItem.findFirst({
            where: { id: itemIdNum, task_id: taskId },
            include: { task: true }
        });

        if (!checklistItem) return NextResponse.json({ success: false, error: 'Ítem no encontrado' }, { status: 404 });

        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
        const empName = authData.employee.full_name.replace(/[^a-zA-Z0-9]/g, '');
        const labelSafe = checklistItem.label.replace(/[^a-zA-Z0-9]/g, '');
        const fileName = `${dateStr}_${timeStr}_${empName}_${labelSafe}.jpg`;

        // n8n Webhook
        const webhookUrl = process.env.N8N_AI_ANALYSIS_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;

        if (!webhookUrl) throw new Error("n8n Webhook URL is missing in environment");

        const n8nFormData = new FormData();
        const fileBlob = new Blob([buffer], { type: file.type || 'image/jpeg' });
        n8nFormData.append('file', fileBlob, fileName);
        n8nFormData.append('taskId', taskId);
        n8nFormData.append('itemId', itemId);
        n8nFormData.append('employee', authData.employee.full_name);

        console.log('[ITEM EVIDENCE] Sending to n8n:', webhookUrl);
        const response = await fetch(webhookUrl, {
            method: 'POST',
            body: n8nFormData,
            signal: AbortSignal.timeout(60000),
        });

        const rawBody = await response.text();
        console.log('[ITEM EVIDENCE] n8n response status:', response.status, 'body length:', rawBody.length);

        if (!response.ok) {
            console.error('[ITEM EVIDENCE] n8n error response:', rawBody.substring(0, 500));
            throw new Error(`n8n Webhook failed (HTTP ${response.status}): ${rawBody.substring(0, 200)}`);
        }

        if (!rawBody || rawBody.trim().length === 0) {
            console.error('[ITEM EVIDENCE] n8n returned empty body');
            throw new Error('n8n devolvió una respuesta vacía. Verifica el nodo "Respond to Webhook" en n8n.');
        }

        let n8nData: any;
        try {
            n8nData = JSON.parse(rawBody);
        } catch (parseErr) {
            console.error('[ITEM EVIDENCE] n8n response is not JSON:', rawBody.substring(0, 500));
            throw new Error(`n8n no devolvió JSON válido. Respuesta: ${rawBody.substring(0, 100)}`);
        }

        const webViewLink = n8nData.url;

        if (!webViewLink) {
            console.error('[ITEM EVIDENCE] n8n response missing "url" field. Got:', JSON.stringify(n8nData).substring(0, 300));
            throw new Error(`n8n no devolvió URL de imagen. Keys: ${Object.keys(n8nData).join(', ')}`);
        }

        await prisma.taskChecklistItem.update({
            where: { id: itemIdNum },
            data: { evidence_url: webViewLink },
        });

        return NextResponse.json({ success: true, url: webViewLink });
    } catch (error: any) {
        console.error('[EVIDENCE UPLOAD ERROR]', error);
        return NextResponse.json({ success: false, error: error?.message || 'Error conectando a n8n u OAuth' }, { status: 500 });
    }
}
