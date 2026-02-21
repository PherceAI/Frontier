import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, isErrorResponse } from '@/lib/auth/guards';
import { randomUUID } from 'crypto';

// ─── Helper: get employee area ─────────────────────────────────────────
async function getEmployeeArea(employeeId: string, type: string) {
    const ea = await prisma.employeeArea.findFirst({
        where: { employee_id: employeeId, area: { type: type as 'SOURCE' | 'PROCESSOR', is_active: true } },
        include: { area: true },
    });
    if (!ea) {
        return null;
    }
    return ea.area;
}

export async function GET(request: NextRequest) {
    const auth = await requireSession(request);
    if (isErrorResponse(auth)) return auth;

    const area = await getEmployeeArea(auth.employee.id, 'SOURCE');
    if (!area) {
        return NextResponse.json(
            { success: false, error: { code: 'OP_NO_AREA', message: 'Sin área asignada' } },
            { status: 400 }
        );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEvents = await prisma.operationalEvent.findMany({
        where: {
            employee_id: auth.employee.id,
            area_id: area.id,
            event_type: 'COLLECTION',
            timestamp: { gte: today },
        },
        include: { details: { include: { item: true } } },
        orderBy: { timestamp: 'desc' },
    });

    let totalCollected = 0;
    const history = todayEvents.map((e) => {
        const items = e.details.map((d) => {
            totalCollected += d.quantity;
            return { name: d.item?.name ?? 'Item', quantity: d.quantity };
        });
        return {
            id: e.id,
            timestamp: e.timestamp.toTimeString().slice(0, 5),
            cycle_number: e.notes,
            items,
        };
    });

    return NextResponse.json({
        success: true,
        data: { totalCollected, totalActive: todayEvents.length, history },
    });
}
