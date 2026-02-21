import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, isErrorResponse } from '@/lib/auth/guards';
import { hashPassword } from '@/lib/auth/helpers';

export async function GET(request: NextRequest) {
    const user = await requireAdmin(request);
    if (isErrorResponse(user)) return user;

    const data = await prisma.employee.findMany({
        where: { company_id: user.company_id },
        include: { areas: { include: { area: true } } },
        orderBy: { full_name: 'asc' },
    });

    return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
    const user = await requireAdmin(request);
    if (isErrorResponse(user)) return user;

    try {
        const body = await request.json();
        const { area_ids, areaIds, pin, full_name, fullName, employee_code, employeeCode, ...rest } = body;
        const generatedPin = pin || Math.floor(1000 + Math.random() * 9000).toString();
        const pinHash = await hashPassword(generatedPin);

        const finalFullName = full_name || fullName;
        const finalEmployeeCode = employee_code || employeeCode || String(Date.now()).slice(-6);
        const finalAreaIds: string[] = area_ids || areaIds || [];

        const employee = await prisma.employee.create({
            data: {
                ...rest,
                full_name: finalFullName,
                employee_code: finalEmployeeCode,
                company_id: user.company_id,
                access_pin_hash: pinHash,
                areas: finalAreaIds.length
                    ? { create: finalAreaIds.map((id: string) => ({ area_id: id })) }
                    : undefined,
            },
            include: { areas: { include: { area: true } } },
        });

        return NextResponse.json({ success: true, data: { ...employee, generatedPin } });
    } catch (error) {
        console.error('[Employees Create Error]', error);
        return NextResponse.json(
            { success: false, error: { code: 'SERVER_ERROR', message: 'Error al crear empleado' } },
            { status: 500 }
        );
    }
}
