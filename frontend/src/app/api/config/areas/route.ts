import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, isErrorResponse } from '@/lib/auth/guards';

export async function GET(request: NextRequest) {
    const user = await requireAdmin(request);
    if (isErrorResponse(user)) return user;

    const data = await prisma.operationalArea.findMany({
        where: { company_id: user.company_id },
        orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
    const user = await requireAdmin(request);
    if (isErrorResponse(user)) return user;

    const body = await request.json();
    const data = await prisma.operationalArea.create({
        data: { ...body, company_id: user.company_id },
    });

    return NextResponse.json({ success: true, data });
}
