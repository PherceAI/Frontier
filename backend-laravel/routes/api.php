<?php
// API Routes for Frontier Backend
// All routes are prefixed with /api automatically

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EmployeesController;
use App\Http\Controllers\Api\AreasController;
use App\Http\Controllers\Api\ItemsController;

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

    // Supabase ERP Integration
    Route::get('/erp/ocupacion', [\App\Http\Controllers\Erp\SupabaseController::class, 'index']);
});

/*
|--------------------------------------------------------------------------
| Room Management Routes
|--------------------------------------------------------------------------
*/
Route::middleware(JwtAuth::class)->group(function () {
    Route::get('/rooms', [\App\Http\Controllers\Api\RoomController::class, 'index']);
});

/*
|--------------------------------------------------------------------------
| Task Management Routes (Admin Only)
|--------------------------------------------------------------------------
*/
Route::prefix('tasks')->middleware(JwtAuth::class)->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\TaskController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\TaskController::class, 'store']);
    Route::get('/stats', [\App\Http\Controllers\Api\TaskController::class, 'stats']);
    Route::patch('/{id}', [\App\Http\Controllers\Api\TaskController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\Api\TaskController::class, 'destroy']);
});

Route::prefix('task-templates')->middleware(JwtAuth::class)->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\TaskController::class, 'indexTemplates']);
    Route::post('/', [\App\Http\Controllers\Api\TaskController::class, 'storeTemplate']);
    Route::patch('/{id}', [\App\Http\Controllers\Api\TaskController::class, 'updateTemplate']);
    Route::delete('/{id}', [\App\Http\Controllers\Api\TaskController::class, 'destroyTemplate']);
});

/*
|--------------------------------------------------------------------------
| Employee Task Routes (Session Auth)
|--------------------------------------------------------------------------
*/
Route::prefix('my-tasks')->middleware(SessionAuth::class)->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\MyTaskController::class, 'index']);
    Route::patch('/{id}/start', [\App\Http\Controllers\Api\MyTaskController::class, 'start']);
    Route::patch('/{id}/complete', [\App\Http\Controllers\Api\MyTaskController::class, 'complete']);
    Route::patch('/{id}/checklist/{itemId}', [\App\Http\Controllers\Api\MyTaskController::class, 'toggleChecklist']);
});
