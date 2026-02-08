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
    collections: {
        id: string;
        name: string;
        total: number; // Sum from DB
    }[];
}

export interface PendingWorkResponse {
    totalPending: number;
    byItem: {
        name: string;
        icon: string;
        pending: number;
    }[];
    message: string;
}
