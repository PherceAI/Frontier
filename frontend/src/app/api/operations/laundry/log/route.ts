import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, isErrorResponse } from '@/lib/auth/guards';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
    const auth = await requireSession(request);
    if (isErrorResponse(auth)) return auth;

    const ea = await prisma.employeeArea.findFirst({
        where: { employee_id: auth.employee.id, area: { type: 'PROCESSOR', is_active: true } },
        include: { area: true },
    });
    if (!ea) {
        return NextResponse.json(
            { success: false, error: { code: 'OP_NO_AREA', message: 'Sin área de procesamiento' } },
            { status: 400 }
        );
    }

    const body = await request.json();
    const { items = [], notes, event_type } = body;

    if (!Array.isArray(items)) {
         return NextResponse.json(
            { success: false, error: { code: 'VALIDATION', message: 'Formato de items inválido' } },
            { status: 400 }
        );
    }

    // Validate items
    const itemIds = new Set<string>();
    for (const item of items) {
        if ((item.quantity ?? 0) <= 0) {
             return NextResponse.json(
                { success: false, error: { code: 'VALIDATION', message: 'Cantidad debe ser mayor a 0' } },
                { status: 400 }
            );
        }
        if (item.item_id) {
            if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.item_id)) {
                 return NextResponse.json(
                    { success: false, error: { code: 'VALIDATION', message: 'ID de item inválido' } },
                    { status: 400 }
                );
            }
            itemIds.add(item.item_id);
        }
    }

    if (itemIds.size > 0) {
        const validItemsCount = await prisma.catalogItem.count({
            where: {
                id: { in: Array.from(itemIds) },
                company_id: auth.employee.company_id,
            },
        });

        if (validItemsCount !== itemIds.size) {
             return NextResponse.json(
                { success: false, error: { code: 'VALIDATION', message: 'Uno o más items no pertenecen a la compañía' } },
                { status: 400 }
            );
        }
    }

    const event = await prisma.operationalEvent.create({
        data: {
            id: randomUUID(),
            company_id: auth.employee.company_id,
            employee_id: auth.employee.id,
            area_id: ea.area.id,
            session_id: auth.session.id,
            event_type: event_type ?? 'WASH_CYCLE',
            notes: notes ?? null,
            details: {
                create: items.map((item: { item_id?: string; quantity?: number; metadata?: unknown }) => {
                    const isValidUuid = item.item_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.item_id);
                    const detailPayload: any = {
                        item_id: isValidUuid ? item.item_id : null,
                        quantity: item.quantity ?? 0,
                    };
                    if (item.metadata !== undefined && item.metadata !== null) {
                        detailPayload.metadata = item.metadata;
                    }
                    return detailPayload;
                }),
            },
        },
    });

    return NextResponse.json({
        success: true,
        data: { eventId: event.id, message: 'Ciclo de lavado registrado' },
    });
}
