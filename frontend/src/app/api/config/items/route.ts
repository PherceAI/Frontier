import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, isErrorResponse } from '@/lib/auth/guards';

export async function GET(request: NextRequest) {
    const user = await requireAdmin(request);
    if (isErrorResponse(user)) return user;

    const data = await prisma.catalogItem.findMany({
        where: { company_id: user.company_id },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ success: true, data });
}
