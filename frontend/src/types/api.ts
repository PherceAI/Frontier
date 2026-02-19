// API Response types
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    meta?: {
        timestamp: string;
        requestId: string;
    };
}

export interface ApiError {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Record<string, string[]>;
    };
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

// Auth types
export interface AdminUser {
    id: string;
    fullName: string;
    email: string;
    role: 'OWNER' | 'MANAGER';
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: AdminUser;
}

// Employee types for PIN auth
export interface EmployeeArea {
    id: string;
    name: string;
    type: 'SOURCE' | 'PROCESSOR';
}

export interface EmployeeProfile {
    id: string;
    fullName: string;
    employeeCode: string;
    areas: EmployeeArea[];
}

export interface PinLoginResponse {
    sessionToken: string;
    expiresAt: string;
    employee: EmployeeProfile;
}

// Room types
export interface Room {
    id: string;
    number: string;
    floor: number;
    type: string;
    status: 'AVAILABLE' | 'OCCUPIED' | 'UNKNOWN';
    guest: {
        name: string | null;
        company: string | null;
        adults: number | null;
        children: number | null;
        check_in: string | null;
        check_out: string | null;
        last_updated: string | null;
        roi: number;
    } | null;
}

export type RoomStatus = Room['status'];

// Dashboard types
export interface BottleneckData {
    totalDemand: number;
    totalSupply: number;
    pendingRatio: number;
    areas: {
        id: string;
        name: string;
        type: string;
        demand: number;
        supply: number;
    }[];
}

export interface ActivityEntry {
    id: string;
    timestamp: string;
    type: string;
    employee: {
        id: string;
        name: string;
        code: string;
    };
    summary: string;
    items: { name: string; quantity: number }[];
    totalItems: number;
}

// Config types
export interface EmployeeConfig {
    id: string;
    full_name: string;
    employee_code: string;
    is_active: boolean;
    areas: EmployeeArea[];
    created_at: string;
}

export interface AreaConfig {
    id: string;
    name: string;
    type: 'SOURCE' | 'PROCESSOR';
    description: string | null;
    is_active: boolean;
}

export interface CatalogItemConfig {
    id: string;
    name: string;
    category: string;
    icon_ref: string | null;
    unit: string;
    is_active: boolean;
}
