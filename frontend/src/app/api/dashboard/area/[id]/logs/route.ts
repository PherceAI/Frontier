import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, isErrorResponse } from '@/lib/auth/guards';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
    const user = await requireAdmin(request);
    if (isErrorResponse(user)) return user;
    const { id: areaId } = await params;

    // Verify area belongs to user's company
    const area = await prisma.operationalArea.findUnique({
        where: { id: areaId },
        select: { company_id: true },
    });

    if (!area) {
        return NextResponse.json(
            { success: false, error: { code: 'NOT_FOUND', message: 'Área no encontrada' } },
            { status: 404 }
        );
    }

    if (area.company_id !== user.company_id) {
        return NextResponse.json(
            { success: false, error: { code: 'AUTH_FORBIDDEN', message: 'Acceso denegado a esta área' } },
            { status: 403 }
        );
    }

    const { searchParams } = request.nextUrl;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = { area_id: areaId };
    if (from || to) {
        where.timestamp = {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to + 'T23:59:59') } : {}),
        };
    }
    if (search) {
        where.employee = {
            OR: [
                { full_name: { contains: search, mode: 'insensitive' } },
                { employee_code: { contains: search, mode: 'insensitive' } },
            ],
        };
    }

    const [events, total] = await Promise.all([
        prisma.operationalEvent.findMany({
            where,
            include: {
                employee: { select: { id: true, full_name: true, employee_code: true } },
                details: { include: { item: { select: { id: true, name: true } } } },
            },
            orderBy: { timestamp: 'desc' },
            take: limit,
        }),
        prisma.operationalEvent.count({ where }),
    ]);

    const data = events.map((e) => ({
        id: e.id,
        timestamp: e.timestamp,
        type: e.event_type,
        employee: {
            id: e.employee?.id,
            name: e.employee?.full_name ?? 'Unknown Employee',
            code: e.employee?.employee_code ?? 'N/A',
        },
        summary: e.notes,
        items: e.details.map((d) => ({ name: d.item?.name ?? 'Item Eliminado', quantity: d.quantity })),
        total_items: e.details.reduce((s, d) => s + d.quantity, 0),
    }));

    return NextResponse.json({ success: true, data: { data, total, per_page: limit } });
}
