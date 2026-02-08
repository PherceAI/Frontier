<?php
// Employees Controller - CRUD for employees

namespace App\Http\Controllers\Api;

use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class EmployeesController extends ApiController
{
    /**
     * GET /config/employees
     * List employees with pagination
     */
    public function index(Request $request)
    {
        $companyId = $request->user->company_id;
        $page = (int) $request->get('page', 1);
        $limit = min((int) $request->get('limit', 20), 100);
        $search = $request->get('search');
        $isActive = $request->get('isActive');

        $query = Employee::where('company_id', $companyId)
            ->with(['areas:id,name']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'ilike', "%{$search}%")
                    ->orWhere('employee_code', 'ilike', "%{$search}%");
            });
        }

        if ($isActive !== null) {
            $query->where('is_active', $isActive === 'true');
        }

        $total = $query->count();
        $employees = $query
            ->orderBy('full_name')
            ->offset(($page - 1) * $limit)
            ->limit($limit)
            ->get();

        return $this->paginated(
            $employees->map(fn($e) => [
                'id' => $e->id,
                'fullName' => $e->full_name,
                'employeeCode' => $e->employee_code,
                // 'accessPinPlain' removed for security
                'isActive' => $e->is_active,
                'areas' => $e->areas->map(fn($a) => [
                    'id' => $a->id,
                    'name' => $a->name,
                ]),
                'createdAt' => $e->created_at->toIso8601String(),
            ]),
            [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'totalPages' => ceil($total / $limit),
            ]
        );
    }

    /**
     * POST /config/employees
     * Create new employee
     */
    public function store(Request $request)
    {
        $request->validate([
            'fullName' => 'required|string|min:2|max:100',
            'employeeCode' => 'nullable|string|max:20',
            'areaIds' => 'nullable|array',
            'areaIds.*' => 'uuid',
        ]);

        $companyId = $request->user->company_id;

        // Generate employee code if not provided
        $employeeCode = $request->employeeCode ?? $this->generateEmployeeCode($companyId);

        // Generate 4-digit PIN
        $pin = str_pad(random_int(0, 9999), 4, '0', STR_PAD_LEFT);
        $pinHash = Hash::make($pin);

        $employee = Employee::create([
            'company_id' => $companyId,
            'full_name' => $request->fullName,
            'employee_code' => $employeeCode,
            'access_pin_hash' => $pinHash,
            // 'access_pin_plain' removed for security
            'is_active' => true,
        ]);

        // Assign areas
        if ($request->areaIds) {
            $employee->areas()->sync($request->areaIds);
        }

        $employee->load('areas:id,name');

        return $this->success([
            'id' => $employee->id,
            'fullName' => $employee->full_name,
            'employeeCode' => $employee->employee_code,
            'generatedPin' => $pin,
            'areas' => $employee->areas->map(fn($a) => [
                'id' => $a->id,
                'name' => $a->name,
            ]),
        ], 201);
    }

    /**
     * GET /config/employees/{id}
     * Get single employee
     */
    public function show(Request $request, string $id)
    {
        $companyId = $request->user->company_id;

        $employee = Employee::with('areas:id,name')
            ->where('id', $id)
            ->where('company_id', $companyId)
            ->first();

        if (!$employee) {
            return $this->error('RESOURCE_NOT_FOUND', 'Employee not found', 404);
        }

        return $this->success([
            'id' => $employee->id,
            'fullName' => $employee->full_name,
            'employeeCode' => $employee->employee_code,
            // 'accessPinPlain' removed
            'isActive' => $employee->is_active,
            'areas' => $employee->areas->map(fn($a) => [
                'id' => $a->id,
                'name' => $a->name,
            ]),
            'createdAt' => $employee->created_at->toIso8601String(),
        ]);
    }

    /**
     * PATCH /config/employees/{id}
     * Update employee
     */
    public function update(Request $request, string $id)
    {
        $request->validate([
            'fullName' => 'nullable|string|min:2|max:100',
            'isActive' => 'nullable|boolean',
            'areaIds' => 'nullable|array',
            'areaIds.*' => 'uuid',
        ]);

        $companyId = $request->user->company_id;

        $employee = Employee::where('id', $id)
            ->where('company_id', $companyId)
            ->first();

        if (!$employee) {
            return $this->error('RESOURCE_NOT_FOUND', 'Employee not found', 404);
        }

        if ($request->has('fullName')) {
            $employee->full_name = $request->fullName;
        }

        if ($request->has('isActive')) {
            $employee->is_active = $request->isActive;
        }

        $employee->save();

        if ($request->has('areaIds')) {
            $employee->areas()->sync($request->areaIds);
        }

        $employee->load('areas:id,name');

        return $this->success([
            'id' => $employee->id,
            'fullName' => $employee->full_name,
            'isActive' => $employee->is_active,
            'areas' => $employee->areas->map(fn($a) => [
                'id' => $a->id,
                'name' => $a->name,
            ]),
        ]);
    }

    /**
     * DELETE /config/employees/{id}
     * Delete employee
     */
    public function destroy(Request $request, string $id)
    {
        $companyId = $request->user->company_id;

        $employee = Employee::where('id', $id)
            ->where('company_id', $companyId)
            ->first();

        if (!$employee) {
            return $this->error('RESOURCE_NOT_FOUND', 'Employee not found', 404);
        }

        $employee->delete();

        return $this->success(['message' => 'Employee deleted']);
    }

    /**
     * POST /config/employees/{id}/reset-pin
     * Generate new PIN
     */
    public function resetPin(Request $request, string $id)
    {
        $companyId = $request->user->company_id;

        $employee = Employee::where('id', $id)
            ->where('company_id', $companyId)
            ->first();

        if (!$employee) {
            return $this->error('RESOURCE_NOT_FOUND', 'Employee not found', 404);
        }

        $newPin = str_pad(random_int(0, 9999), 4, '0', STR_PAD_LEFT);
        $employee->access_pin_hash = Hash::make($newPin);
        // $employee->access_pin_plain = $newPin; // Removed
        $employee->save();

        return $this->success(['newPin' => $newPin]);
    }

    // Helper: Generate unique employee code
    private function generateEmployeeCode(string $companyId): string
    {
        $count = Employee::where('company_id', $companyId)->count();
        return 'EMP-' . str_pad($count + 1, 3, '0', STR_PAD_LEFT);
    }
}
