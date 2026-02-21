export interface CatalogItem {
    id: string;
    name: string;
    category: string;
    iconRef?: string;
    unit?: string;
    isActive?: boolean;
}

export interface HousekeepingLogPayload {
    logs: {
        item_id: string;
        quantity: number;
    }[];
    notes?: string;
}

export interface OperationEventResponse {
    eventId: string;
    message?: string;
}

export interface LaundryStatusResponse {
    message?: string;
    summary?: string;
    // New grouped format
    cycles?: LaundryCycleGroup[];
    // Legacy support if needed, or mapped from cycles
    collections?: {
        id: string;
        name: string;
        total: number;
    }[];
    history?: any[];
}

export interface LaundryCycleGroup {
    group: string; // 'Juegos de Sábanas'
    type: string; // 'BEDDING'
    total_pieces: number;
    full_cycles: number;
    remainder: number;
    capacity: number;
    items: {
        id: string;
        name: string;
        qty: number;
    }[];
}

export interface PendingWorkResponse {
    totalPending: number;
    cycles?: LaundryCycleGroup[];
    // Legacy flat list might still be sent for other areas
    byItem?: {
        id: string;
        name: string;
        icon: string;
        pending: number;
    }[];
    message: string;
}
