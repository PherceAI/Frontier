import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, generateSessionToken, hashToken } from '@/lib/auth/helpers';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
    // 🛡️ Sentinel: Prevent brute-force attacks on PIN login
    const rateLimitError = rateLimit(request, { limit: 5, windowMs: 60 * 1000 }); // 5 attempts per minute per IP
    if (rateLimitError) {
        return rateLimitError;
    }

    try {
        const { pin } = await request.json();
        if (!pin) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION', message: 'PIN requerido' } },
                { status: 400 }
            );
        }

        // SCALABILITY WARNING:
        // This query fetches ALL active employees and iterates through them to check the PIN.
        // This is O(N) complexity where N is the number of employees.
        // As the number of employees grows, this will become a performance bottleneck.
        // SUGGESTED FIX:
        // 1. Ask for a "Company Code" in the login screen to filter employees by company first.
        // 2. Or, store a searchable hash of the PIN (e.g., SHA256) alongside the bcrypt hash.
        //    (Note: This reduces security slightly against rainbow tables if the salt isn't managed carefully,
        //    but for 4-6 digit PINs, rainbow tables are trivial anyway. Rate limiting is more important).
        const employees = await prisma.employee.findMany({
            where: { is_active: true },
            select: { id: true, access_pin_hash: true },
        });

        let matchedEmployeeId: string | null = null;
        for (const emp of employees) {
            if (await comparePassword(pin, emp.access_pin_hash)) {
                matchedEmployeeId = emp.id;
                break;
            }
        }

        if (!matchedEmployeeId) {
            return NextResponse.json(
                { success: false, error: { code: 'AUTH_INVALID_CREDENTIALS', message: 'PIN incorrecto' } },
                { status: 401 }
            );
        }

        const employee = await prisma.employee.findUnique({
            where: { id: matchedEmployeeId },
            include: {
                areas: {
                    where: { area: { is_active: true } },
                    include: { area: true },
                },
            },
        });

        if (!employee) {
            return NextResponse.json(
                { success: false, error: { code: 'AUTH_INVALID_CREDENTIALS', message: 'PIN incorrecto' } },
                { status: 401 }
            );
        }

        const sessionToken = generateSessionToken(employee.id);
        const tokenHash = hashToken(sessionToken);
        const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);

        // Invalidate older sessions
        await prisma.employeeSession.updateMany({
            where: { employee_id: employee.id, is_active: true },
            data: { is_active: false },
        });

        await prisma.employeeSession.create({
            data: {
                employee_id: employee.id,
                token_hash: tokenHash,
                expires_at: expiresAt,
                last_activity: new Date(),
                is_active: true,
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                sessionToken,
                expiresAt: expiresAt.toISOString(),
                employee: {
                    id: employee.id,
                    fullName: employee.full_name,
                    areas: employee.areas.map((ea) => ({
                        id: ea.area.id,
                        name: ea.area.name,
                        type: ea.area.type,
                    })),
                },
            },
        });
    } catch (error) {
        console.error('[PIN Login Error]', error);
        return NextResponse.json(
            { success: false, error: { code: 'SERVER_ERROR', message: 'Error interno del servidor' } },
            { status: 500 }
        );
    }
}
