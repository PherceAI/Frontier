import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, isErrorResponse } from '@/lib/auth/guards';

export async function GET(request: NextRequest) {
    const user = await requireAdmin(request);
    if (isErrorResponse(user)) return user;

    const { searchParams } = request.nextUrl;
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const fromDate = from ? new Date(from) : new Date(Date.now() - 7 * 86400000);
    const toDate = to ? new Date(to) : new Date();

    const tasks = await prisma.task.findMany({
        where: { company_id: user.company_id, due_date: { gte: fromDate, lte: toDate } },
        select: { status: true },
    });

    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
    const overdue = tasks.filter((t) => t.status === 'OVERDUE').length;
    const pending = tasks.filter((t) => t.status === 'PENDING').length;
    const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;

    return NextResponse.json({
        success: true,
        data: {
            period: { from: fromDate.toISOString().split('T')[0], to: toDate.toISOString().split('T')[0] },
            total, completed, overdue, pending, in_progress: inProgress,
            compliance_rate: total > 0 ? Math.round((completed / total) * 1000) / 10 : 0,
        },
    });
}
