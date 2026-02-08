<?php
// API Routes for Frontier Backend
// All routes are prefixed with /api automatically

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EmployeesController;
use App\Http\Controllers\Api\AreasController;
use App\Http\Controllers\Api\ItemsController;
use App\Http\Controllers\Api\OpsController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Middleware\JwtAuth;
use App\Http\Middleware\SessionAuth;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/
Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'data' => [
            'status' => 'ok',
            'timestamp' => now()->toIso8601String(),
            'service' => 'frontier-laravel',
        ],
    ]);
});

// TEMP TEST ROUTE - OVERFLOW SIMULATION
Route::get('/test-overflow', function () {
    $employee = \App\Models\Employee::where('full_name', 'Test Auth')->first();
    if (!$employee)
        return 'No Test Auth employee found';

    $area = $employee->areas()->where('type', 'PROCESSOR')->first();
    // Assign if missing
    if (!$area) {
        $company = \App\Models\Company::first();
        $area = \App\Models\OperationalArea::create(['company_id' => $company->id, 'name' => 'Laundry Test', 'type' => 'PROCESSOR']);
        $employee->areas()->attach($area->id);
    }

    // Find an item
    $item = \App\Models\CatalogItem::first();
    if (!$item) {
        $item = \App\Models\CatalogItem::create(['company_id' => $employee->company_id, 'name' => 'Test Item', 'category' => 'HOUSEKEEPING']);
    }

    try {
        $handler = new \App\Services\Operations\Handlers\LaundryHandler();
        $session = null;
        $validData = [
            'cycles' => 1,
            'items' => [
                ['item_id' => $item->id, 'quantity' => 99999] // OVERFLOW!
            ]
        ];

        $handler->process($area, $employee, $session, $validData);
        return 'FAILED: Should have thrown ValidationException';

    } catch (\Illuminate\Validation\ValidationException $e) {
        return 'SUCCESS: Validation Exception Caught: ' . json_encode($e->errors());
    } catch (\Exception $e) {
        return 'ERROR: Wrong Exception: ' . $e->getMessage();
    }
});

// TEMP TEST ROUTE
Route::get('/test-create-emp', function () {
    $company = \App\Models\Company::first();
    if (!$company) {
        $company = \App\Models\Company::create(['name' => 'Test Co', 'code' => 'TEST']);
    }
    $emp = \App\Models\Employee::create([
        'company_id' => $company->id,
        'full_name' => 'Test Auth',
        'employee_code' => 'TA-' . rand(100, 999),
        'access_pin_hash' => \Illuminate\Support\Facades\Hash::make('9999'),
        'is_active' => true
    ]);
    return $emp;
});



/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    // Admin JWT Auth
    Route::post('/admin/login', [AuthController::class, 'adminLogin']);
    Route::post('/admin/refresh', [AuthController::class, 'adminRefresh']);
    Route::get('/admin/me', [AuthController::class, 'adminMe'])->middleware(JwtAuth::class);
    Route::post('/admin/logout', function () {
        return response()->json(['success' => true, 'data' => ['message' => 'Logged out']]);
    })->middleware(JwtAuth::class);

    // Employee PIN Auth
    Route::post('/pin/login', [AuthController::class, 'pinLogin']);
    Route::post('/pin/logout', [AuthController::class, 'pinLogout'])->middleware(SessionAuth::class);
});

/*
|--------------------------------------------------------------------------
| Configuration Routes (Admin Only)
|--------------------------------------------------------------------------
*/
Route::prefix('config')->middleware(JwtAuth::class)->group(function () {
    // Employees CRUD
    Route::get('/employees', [EmployeesController::class, 'index']);
    Route::post('/employees', [EmployeesController::class, 'store']);
    Route::get('/employees/{id}', [EmployeesController::class, 'show']);
    Route::patch('/employees/{id}', [EmployeesController::class, 'update']);
    Route::delete('/employees/{id}', [EmployeesController::class, 'destroy']);
    Route::post('/employees/{id}/reset-pin', [EmployeesController::class, 'resetPin']);

    // Areas CRUD
    Route::get('/areas', [AreasController::class, 'index']);
    Route::post('/areas', [AreasController::class, 'store']);
    Route::get('/areas/{id}', [AreasController::class, 'show']);
    Route::patch('/areas/{id}', [AreasController::class, 'update']);
    Route::delete('/areas/{id}', [AreasController::class, 'destroy']);

    // Items CRUD
    Route::get('/items', [ItemsController::class, 'index']);
    Route::post('/items', [ItemsController::class, 'store']);
    Route::get('/items/{id}', [ItemsController::class, 'show']);
    Route::patch('/items/{id}', [ItemsController::class, 'update']);
    Route::delete('/items/{id}', [ItemsController::class, 'destroy']);
});

/*
|--------------------------------------------------------------------------
| Operations Routes (Employee Session Auth)
|--------------------------------------------------------------------------
*/
Route::prefix('ops')->middleware(SessionAuth::class)->group(function () {
    Route::post('/events', [OpsController::class, 'createEvent']);
    Route::get('/events', [OpsController::class, 'getEvents']);
    Route::get('/pending', [OpsController::class, 'getPending']);
    Route::get('/catalog', [OpsController::class, 'getCatalog']);
});

/*
|--------------------------------------------------------------------------
| New Operational Routes (Housekeeping & Laundry)
|--------------------------------------------------------------------------
*/
Route::prefix('operations')->middleware(SessionAuth::class)->group(function () {
    Route::get('/catalog/housekeeping', [\App\Http\Controllers\Api\OperationsController::class, 'getHousekeepingCatalog']);
    Route::post('/housekeeping/log', [\App\Http\Controllers\Api\OperationsController::class, 'storeHousekeepingLog']);
    Route::get('/laundry/status', [\App\Http\Controllers\Api\OperationsController::class, 'getLaundryStatus']);
    Route::post('/laundry/log', [\App\Http\Controllers\Api\OperationsController::class, 'storeLaundryLog']);
    Route::get('/pending', [\App\Http\Controllers\Api\OperationsController::class, 'getPendingWork']);
});

/*
|--------------------------------------------------------------------------
| Dashboard Routes (Admin Only)
|--------------------------------------------------------------------------
*/
Route::prefix('dashboard')->middleware(JwtAuth::class)->group(function () {
    Route::get('/bottleneck', [DashboardController::class, 'bottleneck']);
    Route::get('/activities', [DashboardController::class, 'activities']);
    Route::get('/employee/{id}/stats', [DashboardController::class, 'employeeStats']);
    // Bitacora (Detailed Area Logs)
    Route::get('/area/{id}/logs', [\App\Http\Controllers\Api\OperationsController::class, 'getAreaLogs']);
});
