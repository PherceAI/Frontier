import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, isErrorResponse } from '@/lib/auth/guards';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
    const auth = await requireSession(request);
    if (isErrorResponse(auth)) return auth;

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const events = await prisma.operationalEvent.findMany({
        where: { employee_id: auth.employee.id, event_type: 'COLLECTION', timestamp: { gte: today }, area: { name: { contains: 'Limpieza', mode: 'insensitive' } } },
        include: { details: { include: { item: true } } }, orderBy: { timestamp: 'desc' },
    });

    const data = events.map((e) => ({
        id: e.id, timestamp: e.timestamp, notes: e.notes,
        items: e.details.map((d) => ({ name: d.item?.name ?? 'Item', quantity: d.quantity })),
        total: e.details.reduce((s, d) => s + d.quantity, 0),
    }));

    return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
    const auth = await requireSession(request);
    if (isErrorResponse(auth)) return auth;

    const ea = await prisma.employeeArea.findFirst({
        where: { employee_id: auth.employee.id, area: { type: 'SOURCE', is_active: true, name: { contains: 'Limpieza', mode: 'insensitive' } } },
        include: { area: true },
    });
    if (!ea) return NextResponse.json({ success: false, error: { code: 'LIM_NO_AREA', message: 'Sin área de Limpieza' } }, { status: 400 });

    const body = await request.json();
    const { items = [], notes } = body;

    const event = await prisma.operationalEvent.create({
        data: {
            id: randomUUID(), company_id: auth.employee.company_id, employee_id: auth.employee.id,
            area_id: ea.area.id, session_id: auth.session.id, event_type: 'LIMPIEZA', notes: notes ?? null,
            details: { create: items.map((item: { item_id?: string; quantity?: number; metadata?: unknown }) => ({ item_id: item.item_id ?? null, quantity: item.quantity ?? 0, metadata: item.metadata ?? null })) },
        },
    });

    return NextResponse.json({ success: true, data: { eventId: event.id, message: 'Registro de limpieza guardado' } });
}
