import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, isErrorResponse } from '@/lib/auth/guards';

/**
 * GET /api/operations/catalog/items
 * Returns catalog items filtered by the employee's company.
 * Uses session auth (employee PIN), NOT admin auth.
 */
export async function GET(request: NextRequest) {
    const auth = await requireSession(request);
    if (isErrorResponse(auth)) return auth;

    const data = await prisma.catalogItem.findMany({
        where: {
            company_id: auth.employee.company_id,
            is_active: true,
        },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
        select: {
            id: true,
            name: true,
            category: true,
            icon_ref: true,
            unit: true,
        },
    });

    return NextResponse.json({ success: true, data });
}
