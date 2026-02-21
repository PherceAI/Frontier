import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt, verifySessionToken } from './helpers';
import { prisma } from '@/lib/prisma';

// Standard error response
function unauthorized(message = 'No autorizado') {
    return NextResponse.json(
        { success: false, error: { code: 'AUTH_UNAUTHORIZED', message } },
        { status: 401 }
    );
}

function forbidden(message = 'Acceso denegado') {
    return NextResponse.json(
        { success: false, error: { code: 'AUTH_FORBIDDEN', message } },
        { status: 403 }
    );
}

// ─── Admin Guard ──────────────────────────────────────────────────────────

export interface AdminUser {
    id: string;
    email: string;
    role: string;
    company_id: string;
    full_name: string;
    company: { id: string; name: string; code: string };
}

export async function requireAdmin(request: NextRequest): Promise<AdminUser | NextResponse> {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return unauthorized('Token requerido');

    const token = authHeader.slice(7);
    const payload = await verifyJwt(token);
    if (!payload) return unauthorized('Token inválido o expirado');

    const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        include: { company: true },
    });

    if (!user || !user.is_active) return forbidden('Cuenta deshabilitada');
    if (!user.company?.is_active) return forbidden('Compañía deshabilitada');

    return {
        id: user.id,
        email: user.email,
        role: user.role,
        company_id: user.company_id,
        full_name: user.full_name,
        company: { id: user.company.id, name: user.company.name, code: user.company.code },
    };
}

// ─── Session Guard ────────────────────────────────────────────────────────

export interface SessionUser {
    employee: {
        id: string;
        company_id: string;
        full_name: string;
        areas: { id: string; name: string; type: string }[];
    };
    session: { id: string };
}

export async function requireSession(request: NextRequest): Promise<SessionUser | NextResponse> {
    const sessionToken = request.headers.get('x-session-token');
    if (!sessionToken) return unauthorized('Session token requerido');

    const result = await verifySessionToken(sessionToken);
    if (!result) return unauthorized('Sesión inválida o expirada');

    return {
        employee: {
            id: result.employee.id,
            company_id: result.employee.company_id,
            full_name: result.employee.full_name,
            areas: result.employee.areas.map((ea) => ({
                id: ea.area.id,
                name: ea.area.name,
                type: ea.area.type,
            })),
        },
        session: { id: result.session.id },
    };
}

// ─── Helper to check if result is a response (error) ─────────────────────

export function isErrorResponse(result: unknown): result is NextResponse {
    return result instanceof NextResponse;
}
