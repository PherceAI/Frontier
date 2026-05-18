import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, isErrorResponse } from '@/lib/auth/guards';

type Params = { params: Promise<{ taskId: string; itemId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
    try {
        const auth = await requireSession(request);
        if (isErrorResponse(auth)) return auth;
        const { taskId, itemId } = await params;

        const body = await request.json();
        const parsedItemId = parseInt(itemId);

        // Security Validation (IDOR): Verify ownership and tenant isolation
        await prisma.taskChecklistItem.findFirstOrThrow({
            where: {
                id: parsedItemId,
                task_id: taskId,
                task: {
                    company_id: auth.employee.company_id,
                    assigned_to: auth.employee.id
                }
            }
        });

        const data = await prisma.taskChecklistItem.update({
            where: { id: parsedItemId },
            data: { is_completed: body.is_completed, completed_at: body.is_completed ? new Date() : null },
        });

        return NextResponse.json({ success: true, data });
    } catch (error: unknown) {
        console.error('[TASK ITEM UPDATE ERROR]', error);
        return NextResponse.json(
            { success: false, error: 'No se pudo actualizar el item. Verifique los permisos o si el item existe.' },
            { status: 400 }
        );
    }
}
