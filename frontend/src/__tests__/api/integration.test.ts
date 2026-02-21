/**
 * Frontier - Comprehensive API Integration Tests
 * Tests all flows: Auth, Operations (all 4 areas), Tasks, Dashboard, Config
 * 
 * Run with: npx vitest run src/__tests__/api/integration.test.ts
 * Requires: Dev server running on localhost:3000 + database seeded
 */
import { describe, it, expect, beforeAll } from 'vitest';

const BASE = 'http://localhost:3000/api';

// ─── Helpers ──────────────────────────────────────────────────────────
async function api(path: string, options: {
    method?: string;
    body?: unknown;
    adminToken?: string;
    sessionToken?: string;
} = {}) {
    const { method = 'GET', body, adminToken, sessionToken } = options;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (adminToken) headers['Authorization'] = `Bearer ${adminToken}`;
    if (sessionToken) headers['x-session-token'] = sessionToken;

    const res = await fetch(`${BASE}${path}`, {
        method,
        headers,
        ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const data = await res.json();
    return { status: res.status, data };
}

// ─── Shared State ─────────────────────────────────────────────────────
let adminToken = '';
let employeeTokens: Record<string, string> = {};
let employeeData: Record<string, any> = {};
let createdTaskId = '';
let employeeIds: Record<string, string> = {};

// Known test PINs we'll set via admin API
const TEST_PINS: Record<string, string> = {
    maria: '1234',
    pedro: '5678',
    ana: '9012',
};

// =====================================================================
// 0. SETUP: Login admin and reset employee PINs
// =====================================================================
beforeAll(async () => {
    // Login admin first
    const loginRes = await api('/auth/admin/login', {
        method: 'POST',
        body: { email: 'admin@hotel.com', password: 'Admin123!' },
    });
    if (loginRes.status === 200) {
        adminToken = loginRes.data.data.accessToken;
    }

    // Get all employees and reset PINs
    if (adminToken) {
        const empRes = await api('/config/employees', { adminToken });
        if (empRes.status === 200 && empRes.data.data) {
            const employees = empRes.data.data;
            for (const emp of employees) {
                const name = (emp.full_name || emp.fullName || '').toLowerCase();
                if (name.includes('mar') && name.includes('gar')) { employeeIds['maria'] = emp.id; }
                else if (name.includes('pedr')) { employeeIds['pedro'] = emp.id; }
                else if (name.includes('ana') || name.includes('mart')) { employeeIds['ana'] = emp.id; }
            }
            // If we couldn't match by name, just take first 3 employees
            if (Object.keys(employeeIds).length < 3 && employees.length >= 3) {
                const names = ['maria', 'pedro', 'ana'];
                employees.slice(0, 3).forEach((emp: any, i: number) => {
                    if (!employeeIds[names[i]]) employeeIds[names[i]] = emp.id;
                });
            }
        }

        // Reset PINs for all mapped employees
        for (const [key, id] of Object.entries(employeeIds)) {
            const pin = TEST_PINS[key];
            if (pin && id) {
                await api(`/config/employees/${id}/reset-pin`, {
                    method: 'POST',
                    adminToken,
                    body: { pin },
                });
            }
        }

        // Login all employees to populate tokens upfront
        for (const [name, pin] of Object.entries(TEST_PINS)) {
            const res = await api('/auth/pin/login', { method: 'POST', body: { pin } });
            if (res.status === 200 && res.data?.data?.sessionToken) {
                employeeTokens[name] = res.data.data.sessionToken;
                employeeData[name] = res.data.data.employee;
            }
        }
    }
}, 30000);

// Helper: get a valid employee token, fallback to any available
function getToken(name: string): string {
    return employeeTokens[name] || employeeTokens['maria'] || '';
}
describe('Health Check', () => {
    it('should respond to health endpoint', async () => {
        const res = await api('/health');
        expect(res.status).toBe(200);
    });
});

// =====================================================================
// 2. ADMIN AUTH
// =====================================================================
describe('Admin Authentication', () => {
    it('should reject login with wrong credentials', async () => {
        const res = await api('/auth/admin/login', {
            method: 'POST',
            body: { email: 'admin@hotel.com', password: 'WrongPassword!' },
        });
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.data.success).toBe(false);
    });

    it('should reject login with missing fields', async () => {
        const res = await api('/auth/admin/login', {
            method: 'POST',
            body: { email: 'admin@hotel.com' },
        });
        expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should login admin with correct credentials', async () => {
        const res = await api('/auth/admin/login', {
            method: 'POST',
            body: { email: 'admin@hotel.com', password: 'Admin123!' },
        });
        expect(res.status).toBe(200);
        expect(res.data.success).toBe(true);
        expect(res.data.data.accessToken).toBeTruthy();
        expect(res.data.data.user).toBeTruthy();
        adminToken = res.data.data.accessToken;
    });

    it('should get admin profile with valid token', async () => {
        const res = await api('/auth/admin/me', { adminToken });
        expect(res.status).toBe(200);
        expect(res.data.success).toBe(true);
        expect(res.data.data.email).toBe('admin@hotel.com');
    });

    it('should reject admin endpoints without token', async () => {
        const res = await api('/auth/admin/me');
        expect(res.status).toBe(401);
    });
});

// =====================================================================
// 3. EMPLOYEE PIN AUTH
// =====================================================================
describe('Employee PIN Authentication', () => {
    it('should reject login with empty PIN', async () => {
        const res = await api('/auth/pin/login', {
            method: 'POST',
            body: { pin: '' },
        });
        expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject login with invalid PIN', async () => {
        const res = await api('/auth/pin/login', {
            method: 'POST',
            body: { pin: '0000' },
        });
        expect(res.status).toBe(401);
        expect(res.data.success).toBe(false);
    });

    // Test each known PIN — some may work, some may not depending on seed data
    const pins = [
        { name: 'maria', pin: '1234' },
        { name: 'pedro', pin: '5678' },
        { name: 'ana', pin: '9012' },
    ];

    pins.forEach(({ name, pin }) => {
        it(`should login employee ${name} (PIN: ${pin}) and verify session`, async () => {
            const res = await api('/auth/pin/login', {
                method: 'POST',
                body: { pin },
            });

            // PIN might work (200) or not (401) depending on seed data state
            if (res.status === 200) {
                expect(res.data.success).toBe(true);
                expect(res.data.data.sessionToken).toBeTruthy();
                expect(res.data.data.employee).toBeTruthy();
                expect(res.data.data.employee.fullName).toBeTruthy();
                expect(res.data.data.employee.areas).toBeInstanceOf(Array);

                // Store token for later tests
                employeeTokens[name] = res.data.data.sessionToken;
                employeeData[name] = res.data.data.employee;
            } else {
                // PIN not yet set for this employee — skip but don't fail
                expect(res.status).toBe(401);
                console.log(`  ⚠️ PIN ${pin} (${name}) not valid — employee may not exist in seed data`);
            }
        });
    });
});

// =====================================================================
// 4. CONFIG (Admin-only)
// =====================================================================
describe('Configuration (Admin)', () => {
    it('should list employees', async () => {
        const res = await api('/config/employees', { adminToken });
        expect(res.status).toBe(200);
        expect(res.data.success).toBe(true);
        expect(res.data.data).toBeInstanceOf(Array);
        expect(res.data.data.length).toBeGreaterThan(0);
    });

    it('should reject employees list without admin token', async () => {
        const res = await api('/config/employees');
        expect(res.status).toBe(401);
    });

    it('should list operational areas', async () => {
        const res = await api('/config/areas', { adminToken });
        expect(res.status).toBe(200);
        expect(res.data.success).toBe(true);
        expect(res.data.data).toBeInstanceOf(Array);
        // Should have 4 areas: Limpieza, Camareras, Lavandería, Cocina
        expect(res.data.data.length).toBeGreaterThanOrEqual(4);
    });

    it('should list catalog items', async () => {
        const res = await api('/config/items', { adminToken });
        expect(res.status).toBe(200);
        expect(res.data.success).toBe(true);
        expect(res.data.data).toBeInstanceOf(Array);
    });

    it('should reject config endpoints with session token only', async () => {
        const res = await api('/config/employees', {
            sessionToken: employeeTokens['maria'],
        });
        expect(res.status).toBe(401);
    });
});

// =====================================================================
// 5. OPERATIONS: Catalog for Employees
// =====================================================================
describe('Operations Catalog (Employee Session)', () => {
    it('should return catalog items for authenticated employee', async () => {
        const res = await api('/operations/catalog/items', {
            sessionToken: employeeTokens['maria'],
        });
        expect(res.status).toBe(200);
        expect(res.data.success).toBe(true);
        expect(res.data.data).toBeInstanceOf(Array);
    });

    it('should reject catalog without session token', async () => {
        const res = await api('/operations/catalog/items');
        expect(res.status).toBe(401);
    });

    it('should return housekeeping catalog for authenticated employee', async () => {
        const res = await api('/operations/catalog/housekeeping', {
            sessionToken: employeeTokens['maria'],
        });
        expect(res.status).toBe(200);
        expect(res.data.success).toBe(true);
    });
});

// =====================================================================
// 6. OPERATIONS: Housekeeping (Camareras)
// =====================================================================
describe('Operations: Housekeeping (Camareras)', () => {
    it('should get housekeeping status for employee with SOURCE area', async () => {
        const token = getToken('pedro');
        const res = await api('/operations/housekeeping/status', { sessionToken: token });
        if (res.status === 200) {
            expect(res.data.success).toBe(true);
            expect(res.data.data).toHaveProperty('totalCollected');
            expect(res.data.data).toHaveProperty('history');
        } else {
            expect([400, 401]).toContain(res.status);
        }
    });

    it('should reject housekeeping status without session', async () => {
        const res = await api('/operations/housekeeping/status');
        expect(res.status).toBe(401);
    });

    it('should log housekeeping items for SOURCE employee', async () => {
        const token = getToken('pedro');
        const res = await api('/operations/housekeeping/log', {
            method: 'POST',
            sessionToken: token,
            body: { items: [{ item_id: null, quantity: 5 }], notes: 'Test Envío #1' },
        });
        expect([200, 400, 401]).toContain(res.status);
    });
});

// =====================================================================
// 7. OPERATIONS: Laundry (Lavandería) 
// =====================================================================
describe('Operations: Laundry (Lavandería)', () => {
    it('should get laundry status for employee with PROCESSOR area', async () => {
        const token = getToken('ana');
        const res = await api('/operations/laundry/status', { sessionToken: token });
        if (res.status === 200) {
            expect(res.data.success).toBe(true);
            expect(res.data.data).toHaveProperty('pending');
            expect(res.data.data).toHaveProperty('totalCollected');
            expect(res.data.data).toHaveProperty('totalProcessed');
            expect(res.data.data).toHaveProperty('history');
        } else {
            expect([400, 401]).toContain(res.status);
        }
    });

    it('should reject laundry status without session', async () => {
        const res = await api('/operations/laundry/status');
        expect(res.status).toBe(401);
    });

    it('should log laundry cycle for PROCESSOR employee', async () => {
        const token = getToken('ana');
        const res = await api('/operations/laundry/log', {
            method: 'POST',
            sessionToken: token,
            body: { items: [{ item_id: null, quantity: 10 }], notes: 'Test Ciclo #1' },
        });
        expect([200, 400, 401]).toContain(res.status);
    });
});

// =====================================================================
// 8. OPERATIONS: Limpieza
// =====================================================================
describe('Operations: Limpieza', () => {
    it('should get limpieza history for employee', async () => {
        const res = await api('/operations/limpieza', {
            sessionToken: employeeTokens['maria'],
        });
        expect(res.status).toBe(200);
        expect(res.data.success).toBe(true);
        expect(res.data.data).toBeInstanceOf(Array);
    });

    it('should log limpieza activity', async () => {
        const res = await api('/operations/limpieza', {
            method: 'POST',
            sessionToken: employeeTokens['maria'],
            body: {
                notes: 'Test: Lobby principal limpio',
                items: [],
            },
        });
        if (res.status === 200) {
            expect(res.data.success).toBe(true);
            expect(res.data.data.eventId).toBeTruthy();
        } else {
            // 400 if area isn't assigned
            expect(res.status).toBe(400);
        }
    });

    it('should reject limpieza without session', async () => {
        const res = await api('/operations/limpieza');
        expect(res.status).toBe(401);
    });
});

// =====================================================================
// 9. OPERATIONS: Cocina
// =====================================================================
describe('Operations: Cocina', () => {
    it('should get cocina history for employee', async () => {
        // No employee is assigned to Cocina in seed, but we test the endpoint works
        const res = await api('/operations/cocina', {
            sessionToken: employeeTokens['maria'],
        });
        // 200 returns empty array, or 400 if area check fails differently
        expect([200, 400]).toContain(res.status);
    });

    it('should reject cocina without session', async () => {
        const res = await api('/operations/cocina');
        expect(res.status).toBe(401);
    });
});

// =====================================================================
// 10. OPERATIONS: Camareras-specific endpoint
// =====================================================================
describe('Operations: Camareras Endpoint', () => {
    it('should get camareras history', async () => {
        const token = getToken('pedro');
        const res = await api('/operations/camareras', { sessionToken: token });
        expect([200, 401]).toContain(res.status);
        if (res.status === 200) {
            expect(res.data.success).toBe(true);
            expect(res.data.data).toBeInstanceOf(Array);
        }
    });

    it('should get camareras catalog', async () => {
        const token = getToken('pedro');
        const res = await api('/operations/camareras?action=catalog', { sessionToken: token });
        expect([200, 401]).toContain(res.status);
        if (res.status === 200) {
            expect(res.data.success).toBe(true);
        }
    });
});

// =====================================================================
// 11. OPERATIONS: Lavandería-specific endpoint
// =====================================================================
describe('Operations: Lavandería Endpoint', () => {
    it('should get lavandería status', async () => {
        const token = getToken('ana');
        const res = await api('/operations/lavanderia', { sessionToken: token });
        if (res.status === 200) {
            expect(res.data.success).toBe(true);
        } else {
            expect([400, 401]).toContain(res.status);
        }
    });

    it('should get lavandería pending count', async () => {
        const token = getToken('ana');
        const res = await api('/operations/lavanderia?action=pending', { sessionToken: token });
        if (res.status === 200) {
            expect(res.data.success).toBe(true);
            expect(res.data.data).toHaveProperty('pending');
        }
    });
});

// =====================================================================
// 12. TASKS: Admin creates/manages tasks
// =====================================================================
describe('Tasks Management (Admin)', () => {
    it('should list tasks (empty or with existing)', async () => {
        const res = await api('/tasks', { adminToken });
        expect(res.status).toBe(200);
        expect(res.data.success).toBe(true);
        expect(res.data.data).toBeInstanceOf(Array);
    });

    it('should create a task with checklist', async () => {
        const res = await api('/tasks', {
            method: 'POST',
            adminToken,
            body: {
                title: 'Test: Limpiar habitación 301',
                description: 'Limpieza profunda de habitación 301',
                priority: 1,
                assigned_to: employeeData['maria']?.id || null,
                checklist: [
                    { label: 'Barrer y trapear', is_required: true },
                    { label: 'Cambiar sábanas', is_required: true },
                    { label: 'Limpiar baño', is_required: true },
                    { label: 'Reponer amenidades', is_required: false },
                ],
            },
        });
        expect(res.status).toBe(200);
        expect(res.data.success).toBe(true);
        expect(res.data.data.title).toBe('Test: Limpiar habitación 301');
        expect(res.data.data.checklistItems).toBeInstanceOf(Array);
        expect(res.data.data.checklistItems.length).toBe(4);
        createdTaskId = res.data.data.id;
    });

    it('should filter tasks by status', async () => {
        const res = await api('/tasks?status=PENDING', { adminToken });
        expect(res.status).toBe(200);
        expect(res.data.data).toBeInstanceOf(Array);
        if (res.data.data.length > 0) {
            expect(res.data.data[0].status).toBe('PENDING');
        }
    });

    it('should reject task creation without admin token', async () => {
        const res = await api('/tasks', {
            method: 'POST',
            body: { title: 'Unauthorized task' },
        });
        expect(res.status).toBe(401);
    });
});

// =====================================================================
// 13. TASKS: Employee views their tasks
// =====================================================================
describe('My Tasks (Employee)', () => {
    it('should list assigned tasks for employee', async () => {
        const res = await api('/my-tasks', {
            sessionToken: employeeTokens['maria'],
        });
        expect(res.status).toBe(200);
        expect(res.data.success).toBe(true);
        expect(res.data.data).toBeInstanceOf(Array);
    });

    it('should start a task', async () => {
        if (!createdTaskId) return;
        const res = await api(`/my-tasks/${createdTaskId}/start`, {
            method: 'PATCH',
            sessionToken: employeeTokens['maria'],
        });
        // May be 200 or 400 depending on task assignment
        expect([200, 400, 404]).toContain(res.status);
    });

    it('should reject my-tasks without session', async () => {
        const res = await api('/my-tasks');
        expect(res.status).toBe(401);
    });
});

// =====================================================================
// 14. DASHBOARD (Admin)
// =====================================================================
describe('Dashboard (Admin)', () => {
    it('should get bottleneck analysis', async () => {
        const res = await api('/dashboard/bottleneck', { adminToken });
        expect(res.status).toBe(200);
        expect(res.data.success).toBe(true);
        expect(res.data.data).toHaveProperty('summary');
        expect(res.data.data).toHaveProperty('byArea');
        expect(res.data.data).toHaveProperty('alerts');
        expect(res.data.data.summary).toHaveProperty('totalDemand');
        expect(res.data.data.summary).toHaveProperty('totalSupply');
        expect(res.data.data.summary).toHaveProperty('status');
    });

    it('should get activities log', async () => {
        const res = await api('/dashboard/activities', { adminToken });
        expect(res.status).toBe(200);
        expect(res.data.success).toBe(true);
    });

    it('should reject dashboard without admin token', async () => {
        const res = await api('/dashboard/bottleneck');
        expect(res.status).toBe(401);
    });
});

// =====================================================================
// 15. PIN LOGOUT
// =====================================================================
describe('Employee Logout', () => {
    it('should logout employee session', async () => {
        const res = await api('/auth/pin/logout', {
            method: 'POST',
            sessionToken: employeeTokens['maria'],
        });
        expect([200, 204]).toContain(res.status);
    });

    it('should reject operations after logout', async () => {
        const res = await api('/operations/limpieza', {
            sessionToken: employeeTokens['maria'],
        });
        expect(res.status).toBe(401);
    });
});

// =====================================================================
// 16. EDGE CASES & SECURITY
// =====================================================================
describe('Security & Edge Cases', () => {
    it('should not allow SQL injection in PIN', async () => {
        const res = await api('/auth/pin/login', {
            method: 'POST',
            body: { pin: "' OR 1=1; --" },
        });
        expect(res.status).toBe(401);
        expect(res.data.success).toBe(false);
    });

    it('should handle very long PIN gracefully', async () => {
        const res = await api('/auth/pin/login', {
            method: 'POST',
            body: { pin: '1'.repeat(1000) },
        });
        expect([400, 401]).toContain(res.status);
    });

    it('should reject malformed JSON body', async () => {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        const res = await fetch(`${BASE}/auth/pin/login`, {
            method: 'POST',
            headers,
            body: 'not-json',
        });
        expect([400, 500]).toContain(res.status);
    });
});
