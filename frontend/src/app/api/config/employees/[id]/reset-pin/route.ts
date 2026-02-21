import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, isErrorResponse } from '@/lib/auth/guards';
import { hashPassword } from '@/lib/auth/helpers';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
    const user = await requireAdmin(request);
    if (isErrorResponse(user)) return user;
    const { id } = await params;

    let pin: string | undefined;
    try {
        const body = await request.json();
        pin = body?.pin;
    } catch { /* empty body is fine */ }

    const newPin = pin || Math.floor(1000 + Math.random() * 9000).toString();
    const pinHash = await hashPassword(newPin);

    await prisma.employee.update({
        where: { id },
        data: { access_pin_hash: pinHash },
    });

    return NextResponse.json({ success: true, data: { message: 'PIN actualizado', newPin } });
}
