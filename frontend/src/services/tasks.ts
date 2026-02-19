// Task Management API Service (Admin)
import { apiRequest } from '@/lib/api';
import type { Task, TaskTemplate, TaskStats, CreateTaskPayload } from '@/types/tasks';

interface TaskFilters {
    status?: string;
    area_id?: string;
    assigned_to?: string;
    priority?: number;
    due_date?: string;
    from?: string;
    to?: string;
    limit?: number;
}

export const taskService = {
    // ─── Tasks ──────────────────────

    listTasks: async (filters: TaskFilters = {}): Promise<{ success: boolean; data: { data: Task[] } }> => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== '') params.append(key, String(value));
        });
        const query = params.toString();
        return apiRequest(`/tasks${query ? `?${query}` : ''}`);
    },

    createTask: async (payload: CreateTaskPayload): Promise<{ success: boolean; data: Task }> => {
        return apiRequest('/tasks', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    updateTask: async (id: string, data: Partial<Task>): Promise<{ success: boolean; data: Task }> => {
        return apiRequest(`/tasks/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    deleteTask: async (id: string): Promise<{ success: boolean }> => {
        return apiRequest(`/tasks/${id}`, { method: 'DELETE' });
    },

    getStats: async (from?: string, to?: string): Promise<{ success: boolean; data: TaskStats }> => {
        const params = new URLSearchParams();
        if (from) params.append('from', from);
        if (to) params.append('to', to);
        const query = params.toString();
        return apiRequest(`/tasks/stats${query ? `?${query}` : ''}`);
    },

    // ─── Templates ──────────────────

    listTemplates: async (): Promise<{ success: boolean; data: TaskTemplate[] }> => {
        return apiRequest('/task-templates');
    },

    createTemplate: async (data: Partial<TaskTemplate>): Promise<{ success: boolean; data: TaskTemplate }> => {
        return apiRequest('/task-templates', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    updateTemplate: async (id: string, data: Partial<TaskTemplate>): Promise<{ success: boolean; data: TaskTemplate }> => {
        return apiRequest(`/task-templates/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    deleteTemplate: async (id: string): Promise<{ success: boolean }> => {
        return apiRequest(`/task-templates/${id}`, { method: 'DELETE' });
    },
};
