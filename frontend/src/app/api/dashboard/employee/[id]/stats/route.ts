import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, isErrorResponse } from '@/lib/auth/guards';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
    const user = await requireAdmin(request);
    if (isErrorResponse(user)) return user;
    const { id: employeeId } = await params;

    const { searchParams } = request.nextUrl;
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const fromDate = from ? new Date(from) : new Date(Date.now() - 7 * 86400000);
    const toDate = to ? new Date(to + 'T23:59:59') : new Date();

    const stats = await prisma.$queryRaw<{ total_events: bigint; total_items: bigint }[]>`
    SELECT
      COUNT(DISTINCT oe.id) as total_events,
      COALESCE(SUM(ed.quantity), 0) as total_items
    FROM operational_events oe
    JOIN event_details ed ON ed.event_id = oe.id
    WHERE oe.employee_id = ${employeeId}::uuid
      AND oe.company_id = ${user.company_id}::uuid
      AND oe.timestamp >= ${fromDate}
      AND oe.timestamp <= ${toDate}
  `;

    const s = stats[0];
    const totalEvents = Number(s?.total_events ?? 0);
    const totalItems = Number(s?.total_items ?? 0);

    return NextResponse.json({
        success: true,
        data: {
            employeeId,
            period: { from: fromDate.toISOString().split('T')[0], to: toDate.toISOString().split('T')[0] },
            stats: {
                totalEvents, totalItems,
                avgItemsPerEvent: totalEvents > 0 ? Math.round((totalItems / totalEvents) * 10) / 10 : 0,
            },
        },
    });
}
