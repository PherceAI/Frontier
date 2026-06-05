import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, isErrorResponse } from '@/lib/auth/guards';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
    const auth = await requireSession(request);
    if (isErrorResponse(auth)) return auth;
    const { id } = await params;

    const task = await prisma.task.findFirst({
        where: {
            id,
            company_id: auth.employee.company_id,
            assigned_to: auth.employee.id,
        },
    });

    if (!task) {
        return NextResponse.json(
            { success: false, error: { code: 'NOT_FOUND', message: 'Tarea no encontrada' } },
            { status: 404 }
        );
    }

    const body = await request.json().catch(() => ({}));

    const data = await prisma.task.update({
        where: { id },
        data: { status: 'COMPLETED', completed_at: new Date(), completion_notes: body.completion_notes ?? body.notes ?? null },
    });

    return NextResponse.json({ success: true, data });
}
