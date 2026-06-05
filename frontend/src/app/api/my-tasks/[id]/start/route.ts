import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, isErrorResponse } from '@/lib/auth/guards';

type Params = { params: Promise<{ id: string }> };

// Start task
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

    const data = await prisma.task.update({
        where: { id },
        data: { status: 'IN_PROGRESS', started_at: task.started_at ?? new Date() },
    });

    return NextResponse.json({ success: true, data });
}
