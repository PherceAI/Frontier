import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, isErrorResponse } from '@/lib/auth/guards';
import { randomUUID } from 'crypto';

async function getAreaByName(employeeId: string, type: string, namePattern: string) {
    const ea = await prisma.employeeArea.findFirst({
        where: { employee_id: employeeId, area: { type: type as 'SOURCE' | 'PROCESSOR', is_active: true, name: { contains: namePattern, mode: 'insensitive' } } },
        include: { area: true },
    });
    return ea?.area ?? null;
}

export async function GET(request: NextRequest) {
    const auth = await requireSession(request);
    if (isErrorResponse(auth)) return auth;

    const { searchParams } = request.nextUrl;

    // Catalog
    if (searchParams.get('action') === 'catalog') {
        const catalog = await prisma.catalogItem.findMany({ where: { company_id: auth.employee.company_id, category: 'LINEN', is_active: true }, orderBy: { name: 'asc' } });
        return NextResponse.json({ success: true, data: catalog });
    }

    // History (default)
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const events = await prisma.operationalEvent.findMany({
        where: { employee_id: auth.employee.id, event_type: 'COLLECTION', timestamp: { gte: today } },
        include: { details: { include: { item: true } } }, orderBy: { timestamp: 'desc' },
    });

    const data = events.map((e) => ({
        id: e.id, timestamp: e.timestamp,
        items: e.details.map((d) => ({ name: d.item?.name ?? 'Item', quantity: d.quantity })),
        total: e.details.reduce((s, d) => s + d.quantity, 0),
    }));

    return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
    const auth = await requireSession(request);
    if (isErrorResponse(auth)) return auth;

    const area = await getAreaByName(auth.employee.id, 'SOURCE', 'Camarera');
    if (!area) return NextResponse.json({ success: false, error: { code: 'CAM_NO_AREA', message: 'Sin área de Camareras' } }, { status: 400 });

    const body = await request.json();
    const { items = [], notes } = body;

    const event = await prisma.operationalEvent.create({
        data: {
            id: randomUUID(), company_id: auth.employee.company_id, employee_id: auth.employee.id,
            area_id: area.id, session_id: auth.session.id, event_type: 'COLLECTION', notes: notes ?? null,
            details: { create: items.map((item: { item_id?: string; quantity?: number; metadata?: unknown }) => ({ item_id: item.item_id ?? null, quantity: item.quantity ?? 0, metadata: item.metadata ?? null })) },
        },
    });

    return NextResponse.json({ success: true, data: { eventId: event.id, message: 'Recolección registrada' } });
}
