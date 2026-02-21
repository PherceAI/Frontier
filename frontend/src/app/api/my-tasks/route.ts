import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, isErrorResponse } from '@/lib/auth/guards';

export async function GET(request: NextRequest) {
    const auth = await requireSession(request);
    if (isErrorResponse(auth)) return auth;

    const data = await prisma.task.findMany({
        where: { assigned_to: auth.employee.id, status: { in: ['PENDING', 'IN_PROGRESS', 'OVERDUE'] } },
        include: {
            area: { select: { id: true, name: true, type: true } },
            checklistItems: { orderBy: { sort_order: 'asc' } },
        },
        orderBy: [{ priority: 'asc' }, { due_date: 'asc' }],
    });

    return NextResponse.json({ success: true, data });
}
