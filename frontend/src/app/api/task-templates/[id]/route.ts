import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, isErrorResponse } from '@/lib/auth/guards';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
    const user = await requireAdmin(request);
    if (isErrorResponse(user)) return user;
    const { id } = await params;

    const body = await request.json();
    const data = await prisma.taskTemplate.update({
        where: { id }, data: body,
        include: { area: { select: { id: true, name: true, type: true } } },
    });
    return NextResponse.json({ success: true, data });
}

export async function DELETE(request: NextRequest, { params }: Params) {
    const user = await requireAdmin(request);
    if (isErrorResponse(user)) return user;
    const { id } = await params;

    await prisma.taskTemplate.update({ where: { id }, data: { is_active: false } });
    return NextResponse.json({ success: true, data: { message: 'Plantilla desactivada' } });
}
