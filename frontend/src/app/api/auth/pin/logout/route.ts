import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashToken } from '@/lib/auth/helpers';

export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('x-session-token');
        if (token) {
            const tokenHash = hashToken(token);
            await prisma.employeeSession.updateMany({
                where: { token_hash: tokenHash },
                data: { is_active: false },
            });
        }
        return NextResponse.json({ success: true, data: { message: 'Session ended' } });
    } catch (error) {
        console.error('[PIN Logout Error]', error);
        return NextResponse.json({ success: true, data: { message: 'Session ended' } });
    }
}
