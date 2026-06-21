import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, isErrorResponse } from '@/lib/auth/guards';

type Params = { params: Promise<{ taskId: string; itemId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
    const auth = await requireSession(request);
    if (isErrorResponse(auth)) return auth;
    const { taskId, itemId } = await params;

    // 🛡️ Sentinel: Enforce parent-child relationship and tenant isolation
    const itemAuth = await prisma.taskChecklistItem.findFirst({
        where: {
            id: parseInt(itemId),
            task_id: taskId,
            task: { company_id: auth.employee.company_id }
        }
    });

    if (!itemAuth) {
        return NextResponse.json(
            { success: false, error: { code: 'NOT_FOUND', message: 'Item no encontrado' } },
            { status: 404 }
        );
    }

    const body = await request.json();

    const data = await prisma.taskChecklistItem.update({
        where: { id: parseInt(itemId) },
        data: { is_completed: body.is_completed, completed_at: body.is_completed ? new Date() : null },
    });

    return NextResponse.json({ success: true, data });
}
