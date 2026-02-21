/**
 * Test helper: builds NextRequest objects for API route testing.
 */
import { NextRequest } from 'next/server';

const BASE_URL = 'http://localhost:3000';

export function buildRequest(
    path: string,
    options: {
        method?: string;
        body?: unknown;
        adminToken?: string;
        sessionToken?: string;
        searchParams?: Record<string, string>;
    } = {}
): NextRequest {
    const { method = 'GET', body, adminToken, sessionToken, searchParams } = options;

    const url = new URL(`/api${path}`, BASE_URL);
    if (searchParams) {
        Object.entries(searchParams).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (adminToken) headers['Authorization'] = `Bearer ${adminToken}`;
    if (sessionToken) headers['x-session-token'] = sessionToken;

    return new NextRequest(url.toString(), {
        method,
        headers,
        ...(body ? { body: JSON.stringify(body) } : {}),
    });
}

/**
 * Parse JSON response from a NextResponse.
 */
export async function parseResponse(response: Response) {
    const data = await response.json();
    return {
        status: response.status,
        body: data,
    };
}

// Known test data from seed.sql / init.sql
export const TEST_DATA = {
    companyId: '11111111-1111-1111-1111-111111111111',
    adminUserId: '22222222-2222-2222-2222-222222222222',
    adminEmail: 'admin@hotel.com',
    adminPassword: 'Admin123!',
    employees: {
        maria: { id: 'eeee1111-1111-1111-1111-111111111111', pin: '1234', name: 'María García', area: 'Limpieza' },
        pedro: { id: 'eeee2222-2222-2222-2222-222222222222', pin: '5678', name: 'Pedro López', area: 'Camareras' },
        ana: { id: 'eeee3333-3333-3333-3333-333333333333', pin: '9012', name: 'Ana Martínez', area: 'Lavandería' },
    },
    areas: {
        limpieza: 'aaaa1111-1111-1111-1111-111111111111',
        camareras: 'aaaa2222-2222-2222-2222-222222222222',
        lavanderia: 'aaaa3333-3333-3333-3333-333333333333',
        cocina: 'aaaa4444-4444-4444-4444-444444444444',
    },
};
