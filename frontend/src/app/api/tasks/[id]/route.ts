import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, isErrorResponse } from '@/lib/auth/guards';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
    const user = await requireAdmin(request);
    if (isErrorResponse(user)) return user;
    const { id } = await params;

    const existing = await prisma.task.findFirstOrThrow({ where: { id, company_id: user.company_id } });
    const body = await request.json();
    const updateData: Record<string, unknown> = { ...body };

    if (body.status === 'IN_PROGRESS' && !existing.started_at) updateData.started_at = new Date();
    if (body.status === 'COMPLETED') updateData.completed_at = new Date();

    const data = await prisma.task.update({
        where: { id }, data: updateData,
        include: {
            assignee: { select: { id: true, full_name: true, employee_code: true } },
            area: { select: { id: true, name: true, type: true } },
            checklistItems: true,
        },
    });

    return NextResponse.json({ success: true, data });
}

export async function DELETE(request: NextRequest, { params }: Params) {
    const user = await requireAdmin(request);
    if (isErrorResponse(user)) return user;
    const { id } = await params;

    await prisma.task.update({ where: { id }, data: { status: 'CANCELLED' } });
    return NextResponse.json({ success: true, data: { message: 'Tarea cancelada' } });
}
