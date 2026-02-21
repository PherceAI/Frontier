import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, isErrorResponse } from '@/lib/auth/guards';
import { randomUUID } from 'crypto';

// ─── Helper ─────────────────────────────────────────
async function getAreaByName(employeeId: string, type: string, namePattern: string) {
    const ea = await prisma.employeeArea.findFirst({
        where: { employee_id: employeeId, area: { type: type as 'SOURCE' | 'PROCESSOR', is_active: true, name: { contains: namePattern, mode: 'insensitive' } } },
        include: { area: true },
    });
    return ea?.area ?? null;
}

async function storeLog(employee: { id: string; company_id: string }, sessionId: string, areaId: string, eventType: string, body: { items?: { item_id?: string; quantity?: number; metadata?: any }[]; notes?: string }) {
    const event = await prisma.operationalEvent.create({
        data: {
            id: randomUUID(), company_id: employee.company_id, employee_id: employee.id,
            area_id: areaId, session_id: sessionId, event_type: eventType,
            notes: body.notes ?? null,
            details: {
                create: (body.items ?? []).map((item) => ({
                    item_id: item.item_id ?? null, quantity: item.quantity ?? 0, metadata: item.metadata ? item.metadata as any : null,
                })),
            },
        },
    });
    return event;
}

async function getTodayHistory(employeeId: string, eventType: string, areaNameFilter?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const where: Record<string, unknown> = { employee_id: employeeId, event_type: eventType, timestamp: { gte: today } };
    if (areaNameFilter) where.area = { name: { contains: areaNameFilter, mode: 'insensitive' } };

    const events = await prisma.operationalEvent.findMany({
        where, include: { details: { include: { item: true } } }, orderBy: { timestamp: 'desc' },
    });

    return events.map((e: typeof events[0]) => ({
        id: e.id, timestamp: e.timestamp, notes: e.notes,
        items: e.details.map((d: typeof e.details[0]) => ({ name: d.item?.name ?? 'Item', quantity: d.quantity })),
        total: e.details.reduce((s: number, d: typeof e.details[0]) => s + d.quantity, 0),
    }));
}

// ─── Lavandería ─────────────────────────────────────
export async function GET(request: NextRequest) {
    const auth = await requireSession(request);
    if (isErrorResponse(auth)) return auth;

    const { searchParams } = request.nextUrl;
    const action = searchParams.get('action');

    // Pending
    if (action === 'pending') {
        const area = await getAreaByName(auth.employee.id, 'PROCESSOR', 'Lavander');
        if (!area) return NextResponse.json({ success: false, error: { code: 'LAV_NO_AREA', message: 'Sin área de Lavandería' } }, { status: 400 });

        const collected = await prisma.eventDetail.aggregate({ where: { event: { area: { type: 'SOURCE' }, company_id: auth.employee.company_id, event_type: { in: ['DEMAND', 'COLLECTION'] } } }, _sum: { quantity: true } });
        const processed = await prisma.eventDetail.aggregate({ where: { event: { area_id: area.id, event_type: { in: ['SUPPLY', 'WASH_CYCLE'] } } }, _sum: { quantity: true } });
        return NextResponse.json({ success: true, data: { pending: Math.max(0, (collected._sum.quantity ?? 0) - (processed._sum.quantity ?? 0)) } });
    }

    // Status (default)
    const area = await getAreaByName(auth.employee.id, 'PROCESSOR', 'Lavander');
    if (!area) return NextResponse.json({ success: false, error: { code: 'LAV_NO_AREA', message: 'Sin área de Lavandería' } }, { status: 400 });

    const [sourceTotal, processedTotal] = await Promise.all([
        prisma.eventDetail.aggregate({ where: { event: { area: { type: 'SOURCE' }, company_id: auth.employee.company_id, event_type: { in: ['DEMAND', 'COLLECTION'] } } }, _sum: { quantity: true } }),
        prisma.eventDetail.aggregate({ where: { event: { area_id: area.id, event_type: { in: ['SUPPLY', 'WASH_CYCLE'] } } }, _sum: { quantity: true } }),
    ]);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayEvents = await prisma.operationalEvent.findMany({ where: { employee_id: auth.employee.id, event_type: 'SUPPLY', timestamp: { gte: today } }, include: { details: { include: { item: true } } }, orderBy: { timestamp: 'desc' } });
    const history = todayEvents.map((e: typeof todayEvents[0]) => ({ id: e.id, timestamp: e.timestamp.toTimeString().slice(0, 5), cycle_number: e.notes, items: e.details.map((d: typeof e.details[0]) => ({ name: d.item?.name ?? 'Item', quantity: d.quantity })) }));

    return NextResponse.json({ success: true, data: { pending: Math.max(0, (sourceTotal._sum.quantity ?? 0) - (processedTotal._sum.quantity ?? 0)), totalCollected: sourceTotal._sum.quantity ?? 0, totalProcessed: processedTotal._sum.quantity ?? 0, history } });
}

export async function POST(request: NextRequest) {
    const auth = await requireSession(request);
    if (isErrorResponse(auth)) return auth;

    const area = await getAreaByName(auth.employee.id, 'PROCESSOR', 'Lavander');
    if (!area) return NextResponse.json({ success: false, error: { code: 'LAV_NO_AREA', message: 'Sin área de Lavandería' } }, { status: 400 });

    const body = await request.json();
    const event = await storeLog(auth.employee, auth.session.id, area.id, body.event_type ?? 'WASH_CYCLE', body);
    return NextResponse.json({ success: true, data: { eventId: event.id, message: 'Ciclo de lavado registrado' } });
}
