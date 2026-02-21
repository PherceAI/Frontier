import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, isErrorResponse } from '@/lib/auth/guards';

type Params = { params: Promise<{ taskId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
    const auth = await requireSession(request);
    if (isErrorResponse(auth)) return auth;
    const { taskId } = await params;

    const body = await request.json();
    const existing = await prisma.task.findFirstOrThrow({ where: { id: taskId } });
    const updateData: Record<string, unknown> = { ...body };

    if (body.status === 'IN_PROGRESS' && !existing.started_at) updateData.started_at = new Date();
    if (body.status === 'COMPLETED') updateData.completed_at = new Date();

    const data = await prisma.task.update({
        where: { id: taskId }, data: updateData,
        include: {
            assignee: { select: { id: true, full_name: true, employee_code: true } },
            area: { select: { id: true, name: true, type: true } },
            checklistItems: true,
        },
    });

    return NextResponse.json({ success: true, data });
}
