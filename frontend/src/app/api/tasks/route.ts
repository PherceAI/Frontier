import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, isErrorResponse } from '@/lib/auth/guards';

export async function GET(request: NextRequest) {
    const user = await requireAdmin(request);
    if (isErrorResponse(user)) return user;

    const { searchParams } = request.nextUrl;
    const filters: Record<string, unknown> = {};
    if (searchParams.get('status')) filters.status = searchParams.get('status');
    if (searchParams.get('area_id')) filters.area_id = searchParams.get('area_id');
    if (searchParams.get('assigned_to')) filters.assigned_to = searchParams.get('assigned_to');
    if (searchParams.get('priority')) filters.priority = parseInt(searchParams.get('priority')!);

    const where: Record<string, unknown> = { company_id: user.company_id, ...filters };
    if (searchParams.get('from') || searchParams.get('to')) {
        where.due_date = {
            ...(searchParams.get('from') ? { gte: new Date(searchParams.get('from')!) } : {}),
            ...(searchParams.get('to') ? { lte: new Date(searchParams.get('to')!) } : {}),
        };
    }

    const limit = parseInt(searchParams.get('limit') ?? '50');

    const tasks = await prisma.task.findMany({
        where, include: {
            assignee: { select: { id: true, full_name: true, employee_code: true } },
            area: { select: { id: true, name: true, type: true } },
            checklistItems: true,
        },
        orderBy: [{ priority: 'asc' }, { due_date: 'asc' }], take: limit,
    });

    const statusPriority: Record<string, number> = { OVERDUE: 1, IN_PROGRESS: 2, PENDING: 3, COMPLETED: 4, CANCELLED: 5 };
    tasks.sort((a, b) => (statusPriority[a.status] ?? 6) - (statusPriority[b.status] ?? 6));

    return NextResponse.json({ success: true, data: tasks });
}

export async function POST(request: NextRequest) {
    const user = await requireAdmin(request);
    if (isErrorResponse(user)) return user;

    const body = await request.json();
    const { checklist = [], template_id, ...rest } = body;

    let templateChecklist: { label: string; is_required?: boolean; required?: boolean }[] = [];
    let templateAreaId: string | null = null;

    if (template_id) {
        const template = await prisma.taskTemplate.findUnique({ where: { id: template_id } });
        if (template) {
            if (!checklist.length) templateChecklist = (template.checklist_template as typeof templateChecklist) ?? [];
            if (!rest.area_id) templateAreaId = template.area_id ?? null;
        }
    }

    const task = await prisma.task.create({
        data: {
            ...rest,
            due_date: rest.due_date ? new Date(rest.due_date) : undefined,
            due_time: rest.due_time ? new Date(`1970-01-01T${rest.due_time}:00Z`) : undefined,
            company_id: user.company_id, assigned_by: user.id,
            status: 'PENDING', priority: rest.priority ?? 2,
            template_id: template_id ?? null, area_id: rest.area_id ?? templateAreaId,
            checklistItems: {
                create: [...checklist, ...templateChecklist].map((item: { label: string; is_required?: boolean; required?: boolean }, i: number) => ({
                    label: item.label, is_required: item.is_required ?? item.required ?? false, sort_order: i,
                })),
            },
        },
        include: {
            assignee: { select: { id: true, full_name: true, employee_code: true } },
            area: { select: { id: true, name: true, type: true } },
            checklistItems: true,
        },
    });

    return NextResponse.json({ success: true, data: task });
}
