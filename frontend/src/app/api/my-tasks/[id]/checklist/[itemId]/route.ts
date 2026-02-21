import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, isErrorResponse } from '@/lib/auth/guards';

type Params = { params: Promise<{ id: string; itemId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
    const auth = await requireSession(request);
    if (isErrorResponse(auth)) return auth;
    const { itemId } = await params;

    const item = await prisma.taskChecklistItem.findUniqueOrThrow({ where: { id: parseInt(itemId) } });

    const data = await prisma.taskChecklistItem.update({
        where: { id: parseInt(itemId) },
        data: { is_completed: !item.is_completed, completed_at: !item.is_completed ? new Date() : null },
    });

    return NextResponse.json({ success: true, data });
}
