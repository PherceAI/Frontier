import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, isErrorResponse } from '@/lib/auth/guards';

type Params = { params: Promise<{ id: string; itemId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
    const auth = await requireSession(request);
    if (isErrorResponse(auth)) return auth;
    const { id, itemId } = await params;

    // Verify task belongs to employee and their company to prevent IDOR
    await prisma.task.findFirstOrThrow({
        where: { id, assigned_to: auth.employee.id, company_id: auth.employee.company_id }
    });

    // Verify item belongs to the task to prevent nested IDOR
    const item = await prisma.taskChecklistItem.findFirstOrThrow({
        where: { id: parseInt(itemId), task_id: id }
    });

    const data = await prisma.taskChecklistItem.update({
        where: { id: parseInt(itemId) },
        data: { is_completed: !item.is_completed, completed_at: !item.is_completed ? new Date() : null },
    });

    return NextResponse.json({ success: true, data });
}
