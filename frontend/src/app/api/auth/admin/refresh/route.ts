import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt, signJwt } from '@/lib/auth/helpers';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const { refreshToken } = await request.json();
        if (!refreshToken) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION', message: 'Refresh token requerido' } },
                { status: 400 }
            );
        }

        const payload = await verifyJwt(refreshToken);
        if (!payload) {
            return NextResponse.json(
                { success: false, error: { code: 'AUTH_TOKEN_EXPIRED', message: 'Token inválido' } },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user) {
            return NextResponse.json(
                { success: false, error: { code: 'AUTH_TOKEN_EXPIRED', message: 'Usuario no encontrado' } },
                { status: 401 }
            );
        }

        const accessToken = await signJwt({
            sub: user.id,
            email: user.email,
            role: user.role,
            companyId: user.company_id,
        });

        return NextResponse.json({
            success: true,
            data: { accessToken, expiresIn: 900 },
        });
    } catch {
        return NextResponse.json(
            { success: false, error: { code: 'AUTH_TOKEN_EXPIRED', message: 'Token inválido' } },
            { status: 401 }
        );
    }
}
