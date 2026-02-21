import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, isErrorResponse } from '@/lib/auth/guards';

async function getEmployeeProcessorArea(employeeId: string) {
    const ea = await prisma.employeeArea.findFirst({
        where: { employee_id: employeeId, area: { type: 'PROCESSOR', is_active: true } },
        include: { area: true },
    });
    return ea?.area ?? null;
}

export async function GET(request: NextRequest) {
    const auth = await requireSession(request);
    if (isErrorResponse(auth)) return auth;

    const area = await getEmployeeProcessorArea(auth.employee.id);
    if (!area) {
        return NextResponse.json(
            { success: false, error: { code: 'OP_NO_AREA', message: 'Sin área de procesamiento asignada' } },
            { status: 400 }
        );
    }

    const [sourceTotal, processedTotal] = await Promise.all([
        prisma.eventDetail.aggregate({
            where: { event: { area: { type: 'SOURCE' }, company_id: auth.employee.company_id, event_type: { in: ['DEMAND', 'COLLECTION'] } } },
            _sum: { quantity: true },
        }),
        prisma.eventDetail.aggregate({
            where: { event: { area_id: area.id, event_type: { in: ['SUPPLY', 'WASH_CYCLE'] } } },
            _sum: { quantity: true },
        }),
    ]);

    const pending = Math.max(0, (sourceTotal._sum.quantity ?? 0) - (processedTotal._sum.quantity ?? 0));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEvents = await prisma.operationalEvent.findMany({
        where: { employee_id: auth.employee.id, event_type: 'SUPPLY', timestamp: { gte: today } },
        include: { details: { include: { item: true } } },
        orderBy: { timestamp: 'desc' },
    });

    const history = todayEvents.map((e) => ({
        id: e.id,
        timestamp: e.timestamp.toTimeString().slice(0, 5),
        cycle_number: e.notes,
        items: e.details.map((d) => ({ name: d.item?.name ?? 'Item', quantity: d.quantity })),
    }));

    return NextResponse.json({
        success: true,
        data: {
            pending, totalCollected: sourceTotal._sum.quantity ?? 0,
            totalProcessed: processedTotal._sum.quantity ?? 0, history,
        },
    });
}
