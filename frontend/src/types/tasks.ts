// Task Module TypeScript Types

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
export type TaskPriority = 1 | 2 | 3; // 1=Urgente, 2=Normal, 3=Baja

export interface TaskChecklistItem {
    id: number;
    task_id: string;
    label: string;
    is_required: boolean;
    is_completed: boolean;
    completed_at: string | null;
    evidence_url?: string | null;
    sort_order: number;
}

export interface Task {
    id: string;
    company_id: string;
    template_id: string | null;
    title: string;
    description: string | null;
    area_id: string | null;
    assigned_to: string | null;
    assigned_by: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    due_date: string | null;
    due_time: string | null;
    requires_photo: boolean;
    evidence_url?: string | null;
    ai_analysis?: string | null;
    ai_status?: string | null;
    started_at: string | null;
    completed_at: string | null;
    completion_notes: string | null;
    created_at: string;
    updated_at: string;

    // Relations (when loaded)
    assignee?: { id: string; full_name: string; employee_code: string };
    area?: { id: string; name: string; type: 'SOURCE' | 'PROCESSOR' };
    assigner?: { id: string; full_name: string };
    checklist_items?: TaskChecklistItem[];
}

export interface TaskTemplate {
    id: string;
    company_id: string;
    title: string;
    description: string | null;
    area_id: string | null;
    priority: TaskPriority;
    estimated_minutes: number | null;
    recurrence_rule: string | null;
    checklist_template: { label: string; required: boolean }[] | null;
    is_active: boolean;
    area?: { id: string; name: string; type: string };
}

export interface TaskStats {
    period: { from: string; to: string };
    total: number;
    completed: number;
    overdue: number;
    pending: number;
    in_progress: number;
    compliance_rate: number;
}

export interface CreateTaskPayload {
    title: string;
    description?: string;
    area_id?: string;
    assigned_to?: string;
    template_id?: string;
    priority?: TaskPriority;
    due_date?: string;
    due_time?: string;
    requires_photo?: boolean;
    checklist?: { label: string; is_required?: boolean }[];
}

export interface MyTasksResponse {
    tasks: {
        in_progress: Task[];
        pending: Task[];
        overdue: Task[];
        completed: Task[];
    };
    summary: {
        total: number;
        pending: number;
        in_progress: number;
        completed: number;
        overdue: number;
    };
}

// Priority display helpers
export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; icon: string }> = {
    1: { label: 'Urgente', color: 'red', icon: '🔴' },
    2: { label: 'Normal', color: 'blue', icon: '🔵' },
    3: { label: 'Baja', color: 'slate', icon: '⚪' },
};

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string }> = {
    PENDING: { label: 'Pendiente', color: 'text-amber-600', bg: 'bg-amber-50' },
    IN_PROGRESS: { label: 'En Progreso', color: 'text-blue-600', bg: 'bg-blue-50' },
    COMPLETED: { label: 'Completada', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    OVERDUE: { label: 'Vencida', color: 'text-red-600', bg: 'bg-red-50' },
    CANCELLED: { label: 'Cancelada', color: 'text-slate-400', bg: 'bg-slate-50' },
};
