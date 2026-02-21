import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, isErrorResponse } from '@/lib/auth/guards';

export async function GET(request: NextRequest) {
    const auth = await requireSession(request);
    if (isErrorResponse(auth)) return auth;

    const catalog = await prisma.catalogItem.findMany({
        where: {
            company_id: auth.employee.company_id,
            is_active: true,
        },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    return NextResponse.json({ success: true, data: catalog });
}
