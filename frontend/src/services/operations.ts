import { apiRequest } from '@/lib/api';
import { LaundryCycleGroup } from '@/types/operations';

export interface CatalogItem {
    id: string;
    name: string;
    unit: string;
    icon_ref?: string;
}

export interface OperationsService {
    // Auth
    login: (pin: string) => Promise<{
        sessionToken: string;
        expiresAt: string;
        employee: {
            id: string;
            fullName: string;
            areas: { id: string; name: string; type: 'SOURCE' | 'PROCESSOR' }[];
        };
    }>;

    // Housekeeping
    getCatalog: () => Promise<{ success: boolean; data: CatalogItem[] }>;
    submitHousekeepingLog: (logs: { item_id: string; quantity: number }[], notes?: string) => Promise<any>;

    // Laundry
    getLaundryStatus: () => Promise<{ success: boolean; data: { collections: any[]; history: any[]; cycles: LaundryCycleGroup[]; totalPending: number } }>;
    submitLaundryLog: (cycles: number, items: { item_id: string; quantity: number }[], notes?: string) => Promise<any>;

    // Tasks
    getMyTasks: () => Promise<any>;
    startTask: (taskId: string) => Promise<any>;
    completeTask: (taskId: string, notes?: string) => Promise<any>;
    toggleChecklistItem: (taskId: string, itemId: number) => Promise<any>;
}

export const opsService: OperationsService = {
    login: async (pin: string) => {
        const res: any = await apiRequest('/auth/pin/login', {
            method: 'POST',
            body: JSON.stringify({ pin }),
        });
        return res.data;
    },

    getCatalog: async () => {
        return apiRequest('/operations/catalog/housekeeping');
    },

    submitHousekeepingLog: async (logs, notes) => {
        return apiRequest('/operations/housekeeping/log', {
            method: 'POST',
            body: JSON.stringify({ logs, notes }),
        });
    },

    getLaundryStatus: async () => {
        return apiRequest('/operations/laundry/status');
    },

    submitLaundryLog: async (cycles, items, notes) => {
        return apiRequest('/operations/laundry/log', {
            method: 'POST',
            body: JSON.stringify({ cycles, items, notes }),
        });
    },

    // Tasks
    getMyTasks: async (): Promise<any> => {
        return apiRequest('/my-tasks');
    },

    startTask: async (taskId: string): Promise<any> => {
        return apiRequest(`/my-tasks/${taskId}/start`, { method: 'PATCH' });
    },

    completeTask: async (taskId: string, notes?: string): Promise<any> => {
        return apiRequest(`/my-tasks/${taskId}/complete`, {
            method: 'PATCH',
            body: JSON.stringify({ notes }),
        });
    },

    toggleChecklistItem: async (taskId: string, itemId: number): Promise<any> => {
        return apiRequest(`/my-tasks/${taskId}/checklist/${itemId}`, { method: 'PATCH' });
    },
};
