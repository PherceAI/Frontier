import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, isErrorResponse } from '@/lib/auth/guards';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
    const user = await requireAdmin(request);
    if (isErrorResponse(user)) return user;
    const { id } = await params;

    const data = await prisma.employee.findFirstOrThrow({
        where: { id, company_id: user.company_id },
        include: { areas: { include: { area: true } } },
    });

    return NextResponse.json({ success: true, data });
}

export async function PATCH(request: NextRequest, { params }: Params) {
    const user = await requireAdmin(request);
    if (isErrorResponse(user)) return user;
    const { id } = await params;

    const body = await request.json();
    const { area_ids, areaIds, full_name, fullName, employee_code, employeeCode, ...rest } = body;
    const finalAreaIds = area_ids || areaIds;

    if (finalAreaIds) {
        await prisma.employeeArea.deleteMany({ where: { employee_id: id } });
        await prisma.employeeArea.createMany({
            data: finalAreaIds.map((aId: string) => ({ employee_id: id, area_id: aId })),
        });
    }

    const updateData: Record<string, unknown> = { ...rest };
    if (full_name || fullName) updateData.full_name = full_name || fullName;
    if (employee_code || employeeCode) updateData.employee_code = employee_code || employeeCode;

    const data = await prisma.employee.update({
        where: { id },
        data: updateData,
        include: { areas: { include: { area: true } } },
    });

    return NextResponse.json({ success: true, data });
}

export async function DELETE(request: NextRequest, { params }: Params) {
    const user = await requireAdmin(request);
    if (isErrorResponse(user)) return user;
    const { id } = await params;

    await prisma.employee.update({ where: { id }, data: { is_active: false } });
    return NextResponse.json({ success: true, data: { message: 'Empleado desactivado' } });
}
