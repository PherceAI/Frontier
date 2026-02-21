import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, isErrorResponse } from '@/lib/auth/guards';

export async function GET(request: NextRequest) {
    const user = await requireAdmin(request);
    if (isErrorResponse(user)) return user;

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    const yesterday = new Date(todayStart);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    // All-time totals
    const totals = await prisma.$queryRaw<{ total_demand: bigint; total_supply: bigint }[]>`
    SELECT
      COALESCE(SUM(CASE WHEN oe.event_type IN ('DEMAND', 'COLLECTION') THEN ed.quantity ELSE 0 END), 0) as total_demand,
      COALESCE(SUM(CASE WHEN oe.event_type IN ('SUPPLY', 'WASH_CYCLE') THEN ed.quantity ELSE 0 END), 0) as total_supply
    FROM operational_events oe
    JOIN event_details ed ON ed.event_id = oe.id
    WHERE oe.company_id = ${user.company_id}::uuid
  `;

    const totalDemand = Number(totals[0]?.total_demand ?? 0);
    const totalSupply = Number(totals[0]?.total_supply ?? 0);
    const pending = totalDemand - totalSupply;
    const pendingRatio = totalDemand > 0 ? Math.round((pending / totalDemand) * 100) / 100 : 0;
    const status = pendingRatio > 0.5 ? 'CRITICAL' : pendingRatio > 0.2 ? 'WARNING' : 'OK';

    // Trends: today vs yesterday
    const trends = await prisma.$queryRaw<Record<string, bigint>[]>`
    SELECT
      COALESCE(SUM(CASE WHEN oe.timestamp BETWEEN ${todayStart} AND ${todayEnd} AND oe.event_type IN ('DEMAND','COLLECTION') THEN ed.quantity ELSE 0 END), 0) as demand_today,
      COALESCE(SUM(CASE WHEN oe.timestamp BETWEEN ${todayStart} AND ${todayEnd} AND oe.event_type IN ('SUPPLY','WASH_CYCLE') THEN ed.quantity ELSE 0 END), 0) as supply_today,
      COALESCE(SUM(CASE WHEN oe.timestamp BETWEEN ${yesterday} AND ${yesterdayEnd} AND oe.event_type IN ('DEMAND','COLLECTION') THEN ed.quantity ELSE 0 END), 0) as demand_yesterday,
      COALESCE(SUM(CASE WHEN oe.timestamp BETWEEN ${yesterday} AND ${yesterdayEnd} AND oe.event_type IN ('SUPPLY','WASH_CYCLE') THEN ed.quantity ELSE 0 END), 0) as supply_yesterday
    FROM operational_events oe
    JOIN event_details ed ON ed.event_id = oe.id
    WHERE oe.company_id = ${user.company_id}::uuid
  `;

    const t = trends[0] ?? {};
    const trend = (cur: number, prev: number) =>
        prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 1000) / 10;

    // Per-area breakdown
    const byArea = await prisma.$queryRaw<Record<string, unknown>[]>`
    SELECT
      oa.id as area_id, oa.name as area_name, oa.type as area_type,
      COALESCE(SUM(CASE WHEN oe.event_type IN ('DEMAND','COLLECTION') THEN ed.quantity ELSE 0 END), 0) as demand,
      COALESCE(SUM(CASE WHEN oe.event_type IN ('SUPPLY','WASH_CYCLE') THEN ed.quantity ELSE 0 END), 0) as supply
    FROM operational_areas oa
    LEFT JOIN operational_events oe ON oe.area_id = oa.id
    LEFT JOIN event_details ed ON ed.event_id = oe.id
    WHERE oa.company_id = ${user.company_id}::uuid AND oa.is_active = true
    GROUP BY oa.id, oa.name, oa.type
    ORDER BY oa.name
  `;

    const areasData = byArea.map((a) => {
        const d = Number(a.demand);
        const s = Number(a.supply);
        const areaP = d - s;
        const areaRatio = d > 0 ? areaP / d : 0;
        return {
            areaId: a.area_id,
            areaName: a.area_name,
            type: a.area_type,
            demand: d,
            supply: s,
            pending: Math.max(0, areaP),
            status: areaRatio > 0.5 ? 'CRITICAL' : areaRatio > 0.2 ? 'WARNING' : 'OK',
        };
    });

    const alerts = areasData
        .filter((a) => a.status !== 'OK')
        .map((a) => ({ area: a.areaName, level: a.status, message: `${a.pending} items sin procesar` }));

    return NextResponse.json({
        success: true,
        data: {
            summary: {
                totalDemand, totalSupply, pendingRatio, status,
                trends: {
                    demand: trend(Number(t.demand_today ?? 0), Number(t.demand_yesterday ?? 0)),
                    supply: trend(Number(t.supply_today ?? 0), Number(t.supply_yesterday ?? 0)),
                    pending: trend(
                        Number(t.demand_today ?? 0) - Number(t.supply_today ?? 0),
                        Number(t.demand_yesterday ?? 0) - Number(t.supply_yesterday ?? 0),
                    ),
                },
            },
            byArea: areasData,
            alerts,
        },
    });
}
