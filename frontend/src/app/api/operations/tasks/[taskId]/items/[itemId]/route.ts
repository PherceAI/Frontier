import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, isErrorResponse } from '@/lib/auth/guards';

type Params = { params: Promise<{ taskId: string; itemId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
    const auth = await requireSession(request);
    if (isErrorResponse(auth)) return auth;
    const { taskId, itemId } = await params;

    const body = await request.json();

    // Verify task ownership
    const task = await prisma.task.findFirstOrThrow({
        where: {
            id: taskId,
            company_id: auth.employee.company_id
        }
    });

    const existingItem = await prisma.taskChecklistItem.findFirstOrThrow({
        where: {
            id: parseInt(itemId),
            task_id: task.id
        }
    });

    const data = await prisma.taskChecklistItem.update({
        where: { id: existingItem.id },
        data: { is_completed: body.is_completed, completed_at: body.is_completed ? new Date() : null },
    });

    return NextResponse.json({ success: true, data });
}
