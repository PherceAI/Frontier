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

        // n8n Webhook Hook
        // Since you've mentioned n8n is "easy", the most systemic and standard way to connect a modern Next.js app 
        // to your personalized n8n (where you do the Google Drive upload) is to POST the image to your n8n workflow.
        const webhookUrl = process.env.N8N_WEBHOOK_URL;

        if (!webhookUrl) throw new Error("n8n Webhook URL is missing in environment");

        const n8nFormData = new FormData();
        const fileBlob = new Blob([buffer], { type: file.type || 'image/jpeg' });
        n8nFormData.append('file', fileBlob, fileName);
        n8nFormData.append('taskId', taskId);
        n8nFormData.append('itemId', itemId);
        n8nFormData.append('employee', authData.employee.full_name);

        const response = await fetch(webhookUrl, {
            method: 'POST',
            body: n8nFormData
        });

        if (!response.ok) throw new Error("n8n Webhook Upload Failed");

        const n8nData = await response.json();

        // Ensure your n8n workflow returns JSON: { "url": "https://drive.google.com/open?id=..." }
        const webViewLink = n8nData.url;

        if (!webViewLink) throw new Error("n8n did not return an image URL");

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
