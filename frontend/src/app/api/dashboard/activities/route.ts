import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, isErrorResponse } from '@/lib/auth/guards';

export async function GET(request: NextRequest) {
    const user = await requireAdmin(request);
    if (isErrorResponse(user)) return user;

    const { searchParams } = request.nextUrl;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);

    const where: Record<string, unknown> = { company_id: user.company_id };
    const areaId = searchParams.get('areaId');
    const eventType = searchParams.get('eventType');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (areaId) where.area_id = areaId;
    if (eventType && ['COLLECTION', 'WASH_CYCLE', 'CORRECTION', 'LIMPIEZA', 'CLEANING', 'IN_PROGRESS', 'COMPLETED', 'ROOM_CLEANING'].includes(eventType)) {
        where.event_type = eventType;
    }
    if (from || to) {
        where.timestamp = {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to + 'T23:59:59') } : {}),
        };
    }

    const events = await prisma.operationalEvent.findMany({
        where,
        include: {
            employee: { select: { id: true, full_name: true } },
            area: { select: { id: true, name: true } },
            details: { include: { item: { select: { id: true, name: true } } } },
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
    });

    const data = events.map((e) => ({
        id: e.id,
        timestamp: e.timestamp.toISOString(),
        employee: e.employee?.full_name ?? 'Unknown',
        area: e.area?.name ?? 'Unknown',
        eventType: e.event_type,
        notes: e.notes,
        totalItems: e.details.reduce((s, d) => s + d.quantity, 0),
        items: e.details.map((d) => ({ name: d.item?.name, quantity: d.quantity })),
    }));

    return NextResponse.json({ success: true, data });
}
