import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signJwt, signRefreshToken } from '@/lib/auth/helpers';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION', message: 'Email y contraseña requeridos' } },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: { company: true },
        });

        if (!user || !(await comparePassword(password.trim(), user.password_hash))) {
            return NextResponse.json(
                { success: false, error: { code: 'AUTH_INVALID_CREDENTIALS', message: 'Credenciales inválidas' } },
                { status: 401 }
            );
        }

        if (!user.is_active || !user.company?.is_active) {
            return NextResponse.json(
                { success: false, error: { code: 'AUTH_ACCOUNT_DISABLED', message: 'La cuenta o la compañía están deshabilitadas' } },
                { status: 403 }
            );
        }

        const accessToken = await signJwt({
            sub: user.id,
            email: user.email,
            role: user.role,
            companyId: user.company_id,
        });
        const refreshToken = await signRefreshToken(user.id);

        return NextResponse.json({
            success: true,
            data: {
                accessToken,
                refreshToken,
                expiresIn: 900,
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    role: user.role,
                    companyId: user.company_id,
                },
            },
        });
    } catch (error) {
        console.error('[Auth Login Error]', error);
        return NextResponse.json(
            { success: false, error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } },
            { status: 500 }
        );
    }
}
