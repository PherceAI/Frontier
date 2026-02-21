import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, isErrorResponse } from '@/lib/auth/guards';

export async function GET(request: NextRequest) {
    const auth = await requireSession(request);
    if (isErrorResponse(auth)) return auth;

    const tasks = await prisma.task.findMany({
        where: { assigned_to: auth.employee.id, company_id: auth.employee.company_id },
        include: {
            assignee: { select: { id: true, full_name: true, employee_code: true } },
            area: { select: { id: true, name: true, type: true } },
            checklistItems: true,
        },
        orderBy: [{ priority: 'asc' }, { due_date: 'asc' }], take: 50,
    });

    const statusPriority: Record<string, number> = { OVERDUE: 1, IN_PROGRESS: 2, PENDING: 3, COMPLETED: 4, CANCELLED: 5 };
    tasks.sort((a, b) => (statusPriority[a.status] ?? 6) - (statusPriority[b.status] ?? 6));

    return NextResponse.json({ success: true, data: tasks });
}
