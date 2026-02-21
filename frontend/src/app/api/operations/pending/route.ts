import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, isErrorResponse } from '@/lib/auth/guards';

export async function GET(request: NextRequest) {
    const auth = await requireSession(request);
    if (isErrorResponse(auth)) return auth;

    const procArea = await prisma.employeeArea.findFirst({
        where: { employee_id: auth.employee.id, area: { type: 'PROCESSOR', is_active: true } },
        include: { area: true },
    });
    const srcArea = procArea ? null : await prisma.employeeArea.findFirst({
        where: { employee_id: auth.employee.id, area: { type: 'SOURCE', is_active: true } },
        include: { area: true },
    });

    const area = procArea?.area ?? srcArea?.area;
    if (!area) {
        return NextResponse.json(
            { success: false, error: { code: 'OP_NO_AREA', message: 'Sin área asignada' } },
            { status: 400 }
        );
    }

    if (area.type === 'PROCESSOR') {
        const collected = await prisma.eventDetail.aggregate({
            where: { event: { area: { type: 'SOURCE' }, company_id: auth.employee.company_id, event_type: { in: ['DEMAND', 'COLLECTION'] } } },
            _sum: { quantity: true },
        });
        const processed = await prisma.eventDetail.aggregate({
            where: { event: { area_id: area.id, event_type: { in: ['SUPPLY', 'WASH_CYCLE'] } } },
            _sum: { quantity: true },
        });

        return NextResponse.json({
            success: true,
            data: { pending: Math.max(0, (collected._sum.quantity ?? 0) - (processed._sum.quantity ?? 0)) },
        });
    }

    return NextResponse.json({ success: true, data: { pending: 0, items: [] } });
}
