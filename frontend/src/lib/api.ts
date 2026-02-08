// Use environment variable for flexibility, default to localhost for dev
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface RequestOptions extends RequestInit {
    token?: string;
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { token, headers, ...rest } = options;

    // Separate token retrieval
    const storedSessionToken = typeof window !== 'undefined' ? localStorage.getItem('sessionToken') : undefined;
    const storedAdminToken = typeof window !== 'undefined' ? localStorage.getItem('token') : undefined;

    // Use explicit token as Bearer if provided, otherwise use stored tokens
    const bearerToken = token || storedAdminToken;
    const sessionToken = storedSessionToken;

    const config: RequestInit = {
        ...rest,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(bearerToken ? { 'Authorization': `Bearer ${bearerToken}` } : {}),
            ...(sessionToken ? { 'x-session-token': sessionToken } : {}),
            ...headers,
        },
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);

        let data: any;
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            // Handle non-JSON (HTML 404/500 or plain text)
            const text = await response.text();
            data = { message: text || `HTTP ${response.status} ${response.statusText}` };
        }

        if (!response.ok) {
            // Handle 401 Unauthorized globally
            if (response.status === 401 && typeof window !== 'undefined') {
                console.warn('[API] Session expired or invalid. Redirecting to login.');
                localStorage.removeItem('token');
                localStorage.removeItem('sessionToken');

                const currentPath = window.location.pathname;
                if (currentPath.startsWith('/tower')) {
                    window.location.href = '/tower/login';
                } else if (currentPath.startsWith('/hands')) {
                    window.location.href = '/hands';
                } else {
                    window.location.href = '/';
                }

                // Stop execution to avoid further error handling
                throw new Error('Sesión expirada. Redirigiendo...');
            }

            // Standardize error object
            const errorMsg = data.error?.message || data.message || `Request Failed (${response.status})`;
            const errorCode = data.error?.code || 'UNKNOWN_ERROR';

            console.error('[API Error]', {
                endpoint,
                status: response.status,
                code: errorCode,
                message: errorMsg,
                response: typeof data === 'object' ? JSON.stringify(data, null, 2) : data
            });

            // Throw simple error object or custom class? Keep it simple for now.
            throw new Error(errorMsg);
        }

        return data;

    } catch (error: any) {
        // Handle Network Errors (Fetch failed)
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            console.error('[Network Error] Backend unreachable', endpoint);
            throw new Error('No se pudo conectar con el servidor. Verifica tu conexión.');
        }

        console.error('[System Error]', { endpoint, error });
        throw error;
    }
}

// Auth API for Admin Login
export const authApi = {
    adminLogin: async (email: string, password: string) => {
        const response = await apiRequest<any>('/auth/admin/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        // Store token for future requests
        if (typeof window !== 'undefined' && response.data?.accessToken) {
            localStorage.setItem('token', response.data.accessToken);
        }
        return {
            accessToken: response.data?.accessToken,
            refreshToken: response.data?.refreshToken || response.data?.accessToken,
            user: response.data?.user || { fullName: 'Admin' },
        };
    },
    adminRefresh: async (refreshToken: string) => {
        return apiRequest<any>('/auth/admin/refresh', {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
        });
    },
    adminLogout: async () => {
        return apiRequest<any>('/auth/admin/logout', { method: 'POST' });
    },
};

// Legacy API Exports for Admin Dashboard
export const dashboardApi = {
    getBottleneck: async () => {
        const res = await apiRequest<any>('/dashboard/bottleneck');
        return res.data || res;
    },
    getActivities: async (params?: any) => {
        const qs = params ? '?' + new URLSearchParams(params).toString() : '';
        const res = await apiRequest<any>(`/dashboard/activities${qs}`);
        return res.data || res;
    }
};

export const configApi = {
    employees: {
        list: async () => {
            const res = await apiRequest<any>('/config/employees');
            // Return full response to access pagination
            return res;
        },
        create: async (data: any) => {
            const res = await apiRequest<any>('/config/employees', { method: 'POST', body: JSON.stringify(data) });
            return res.data || res;
        },
        update: async (id: string, data: any) => {
            const res = await apiRequest<any>(`/config/employees/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
            return res.data || res;
        },
        delete: async (id: string) => {
            const res = await apiRequest<any>(`/config/employees/${id}`, { method: 'DELETE' });
            return res.data || res;
        },
        resetPin: async (id: string) => {
            const res = await apiRequest<any>(`/config/employees/${id}/reset-pin`, { method: 'POST' });
            return res.data || res;
        },
    },
    areas: {
        list: async (params?: Record<string, string>) => {
            const qs = params ? '?' + new URLSearchParams(params).toString() : '';
            const res = await apiRequest<any>(`/config/areas${qs}`);
            // Return full response to access pagination
            return res;
        },
        create: async (data: any) => {
            const res = await apiRequest<any>('/config/areas', { method: 'POST', body: JSON.stringify(data) });
            return res.data || res;
        },
        update: async (id: string, data: any) => {
            const res = await apiRequest<any>(`/config/areas/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
            return res.data || res;
        },
        delete: async (id: string) => {
            const res = await apiRequest<any>(`/config/areas/${id}`, { method: 'DELETE' });
            return res.data || res;
        },
    },
    items: {
        list: async () => {
            const res = await apiRequest<any>('/config/items');
            // Return full response to access pagination
            return res;
        },
    }
};

export const opsApi = {
    createEvent: async (data: any) => {
        const res = await apiRequest<any>('/ops/events', { method: 'POST', body: JSON.stringify(data) });
        return res.data || res;
    },
    getEvents: async () => {
        const res = await apiRequest<any>('/ops/events');
        return res.data || res;
    },
    getPending: async () => {
        const res = await apiRequest<any>('/operations/pending');
        return res.data || res;
    },
    getCatalog: async () => {
        // Returns CatalogItem[] via CatalogItemResource
        const res = await apiRequest<{ data: CatalogItem[] }>('/ops/catalog');
        return res.data;
    }
};

import { CatalogItem, HousekeepingLogPayload, OperationEventResponse, LaundryStatusResponse } from '../types/operations';

export const operationsApi = {
    catalog: {
        housekeeping: async () => {
            // resolve() in backend means data is CatalogItem[]
            const res = await apiRequest<{ data: CatalogItem[] }>('/operations/catalog/housekeeping');
            return res.data;
        }
    },
    housekeeping: {
        log: async (payload: HousekeepingLogPayload) => {
            const res = await apiRequest<{ data: OperationEventResponse }>('/operations/housekeeping/log', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            return res.data;
        }
    },
    laundry: {
        status: async () => {
            const res = await apiRequest<{ data: LaundryStatusResponse }>('/operations/laundry/status');
            return res.data;
        },
        log: async (payload: { cycles: number, items?: { item_id: string, quantity: number }[] }) => {
            const res = await apiRequest<{ data: { eventId: string } }>('/operations/laundry/log', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            return res.data;
        }
    }
};
