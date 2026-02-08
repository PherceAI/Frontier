import { apiRequest } from '@/lib/api';

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
    getLaundryStatus: () => Promise<{ success: boolean; data: { collections: any[] } }>;
    submitLaundryLog: (cycles: number, items: any[]) => Promise<any>;
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

    submitLaundryLog: async (cycles, items) => {
        return apiRequest('/operations/laundry/log', {
            method: 'POST',
            body: JSON.stringify({ cycles, items }),
        });
    },
};
