import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, isErrorResponse } from '@/lib/auth/guards';
import { randomUUID } from 'crypto';
import { withApiErrorHandling, apiResponse } from '@/lib/api-error';
import { validateOperationalItems } from '@/lib/validation/operational-validation';

async function handler(request: NextRequest) {
    const auth = await requireSession(request);
    if (isErrorResponse(auth)) return auth;

    const ea = await prisma.employeeArea.findFirst({
        where: { employee_id: auth.employee.id, area: { type: 'PROCESSOR', is_active: true } },
        include: { area: true },
    });

    if (!ea) {
        return apiResponse.error('OP_NO_AREA', 'Sin área de procesamiento', 400);
    }

    const body = await request.json();
    const { items = [], notes, event_type } = body;

    const { validItems } = await validateOperationalItems(items, auth.employee.company_id);

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
                create: validItems.map((item) => ({
                    item_id: item.item_id,
                    quantity: item.quantity,
                    metadata: item.metadata as any,
                })),
            },
        },
    });

    return apiResponse.success({ eventId: event.id, message: 'Ciclo de lavado registrado' });
}

export const POST = withApiErrorHandling(handler);
