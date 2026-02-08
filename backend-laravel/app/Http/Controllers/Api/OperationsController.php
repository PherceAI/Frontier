<?php

namespace App\Http\Controllers\Api;

use App\Models\CatalogItem;
use App\Models\Employee;
use App\Models\OperationalEvent;
use App\Models\EventDetail;
use App\Models\OperationalArea;
use App\Services\Operations\OperationFactory;
use App\Http\Requests\Operations\StoreHousekeepingLogRequest;
use App\Http\Resources\Operations\CatalogItemResource;
use App\Actions\Operations\LogHousekeepingAction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OperationsController extends ApiController
{
    /**
     * GET /operations/catalog/housekeeping
     * Get active housekeeping items
     */
    public function getHousekeepingCatalog()
    {
        $items = CatalogItem::where('category', 'HOUSEKEEPING')
            ->where('is_active', true)
            ->get();

        return $this->success(CatalogItemResource::collection($items)->resolve());
    }

    /**
     * POST /operations/housekeeping/log
     * Log housekeeping collection (Camarera output)
     */
    public function storeHousekeepingLog(Request $request)
    {
        return $this->handleOperation($request, 'SOURCE');
    }

    /**
     * GET /operations/laundry/status
     * Get inventory status (Incoming vs Processed)
     */
    public function getLaundryStatus(Request $request)
    {
        // Resolve Laundry Area
        $employee = $request->employee ?? $request->input('employee');
        // We need an area to calculate status for (company context).
        // Since status is usually per area, but here we view "My Laundry Status".
        $area = $employee->areas()->where('type', 'PROCESSOR')->first();

        if (!$area) {
            return $this->error('OP_NO_AREA', 'Employee not assigned to Laundry area', 400);
        }

        try {
            $handler = OperationFactory::make('PROCESSOR');
            $status = $handler->getStatus($area);

            // Append "My Production Today" history
            $todayLogs = OperationalEvent::with('details.item')
                ->where('employee_id', $employee->id)
                ->where('event_type', 'SUPPLY')
                ->whereDate('timestamp', now())
                ->orderBy('timestamp', 'desc')
                ->get()
                ->map(function ($e) {
                    return [
                        'id' => $e->id,
                        'timestamp' => $e->timestamp->format('H:i'),
                        'cycle_number' => $e->notes, // Assuming we store "Completed X cycles" in notes
                        'items' => $e->details->map(fn($d) => [
                            'name' => optional($d->item)->name ?? 'Item',
                            'quantity' => $d->quantity
                        ])
                    ];
                });

            $status['history'] = $todayLogs;

            return $this->success($status);
        } catch (\Exception $e) {
            return $this->error('OP_STATUS_FAILED', $e->getMessage(), 500);
        }
    }

    /**
     * POST /operations/laundry/log
     * Log laundry cycles
     */
    public function storeLaundryLog(Request $request)
    {
        return $this->handleOperation($request, 'PROCESSOR');
    }

    /**
     * Generic handler for operations
     */
    private function handleOperation(Request $request, string $areaType)
    {
        $employee = $request->employee ?? $request->input('employee');
        $session = $request->employee_session ?? $request->input('employee_session');

        // Find assigned area of this type
        $area = $employee->areas()->where('type', $areaType)->first();

        // Fallback or Error
        if (!$area) {
            return $this->error('OP_NO_AREA', "Employee not assigned to a {$areaType} area", 400);
        }

        try {
            $handler = OperationFactory::make($areaType);

            // Validate
            $validData = $handler->validate($request->all());

            // Process
            $event = $handler->process($area, $employee, $session, $validData);

            return $this->success([
                'eventId' => $event->id,
                'message' => 'Operation logged successfully'
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            // UX Improvement: Return the specific error as the main message
            $firstError = collect($e->errors())->flatten()->first();
            return $this->error('VALIDATION_ERROR', $firstError ?? 'Datos inválidos', 422, $e->errors());
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Operation Failed', [
                'type' => $areaType,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->error('OP_FAILED', $e->getMessage(), 500);
        }
    }

    /**
     * GET /operations/area/{id}/logs
     * Detailed logs for a specific area (Bitacora)
     */
    public function getAreaLogs(Request $request, string $id)
    {
        $limit = min((int) $request->get('limit', 50), 100);
        $from = $request->get('from');
        $to = $request->get('to');
        $search = $request->get('search'); // Filter by employee name?

        $query = OperationalEvent::where('area_id', $id)
            ->with(['employee:id,full_name,employee_code', 'details.item:id,name'])
            ->orderBy('timestamp', 'desc');

        if ($from) {
            $query->whereDate('timestamp', '>=', $from);
        }
        if ($to) {
            $query->whereDate('timestamp', '<=', $to);
        }

        if ($search) {
            $query->whereHas('employee', function ($q) use ($search) {
                $q->where('full_name', 'ilike', "%{$search}%")
                    ->orWhere('employee_code', 'ilike', "%{$search}%");
            });
        }

        $events = $query->paginate($limit);

        // Transform collection
        $events->getCollection()->transform(function ($e) {
            return [
                'id' => $e->id,
                'timestamp' => $e->timestamp,
                'type' => $e->event_type,
                'employee' => [
                    'id' => $e->employee ? $e->employee->id : null,
                    'name' => $e->employee ? $e->employee->full_name : 'Unknown Employee',
                    'code' => $e->employee ? $e->employee->employee_code : 'N/A',
                ],
                'summary' => $e->notes,
                'items' => $e->details->map(fn($d) => [
                    'name' => optional($d->item)->name ?? 'Item Eliminado',
                    'quantity' => $d->quantity,
                ]),
                'total_items' => $e->details->sum('quantity'),
            ];
        });

        return $this->success($events);
    }
    /**
     * GET /operations/pending
     * Get pending work for the employees area
     */
    public function getPendingWork(Request $request)
    {
        $employee = $request->employee ?? $request->input('employee');

        // Prioritize PROCESSOR area if assigned (e.g. Laundry needs to see work)
        // If not, fall back to SOURCE (Housekeeping sees empty or relevant info)
        $area = $employee->areas()
            ->orderByRaw("CASE WHEN type = 'PROCESSOR' THEN 1 ELSE 2 END")
            ->first();

        if (!$area) {
            return $this->error('OP_NO_AREA', 'Sin área asignada', 400);
        }

        try {
            $handler = OperationFactory::make($area->type);
            $pending = $handler->getPendingWork($area);
            return $this->success($pending);
        } catch (\Exception $e) {
            return $this->error('OP_PENDING_FAILED', $e->getMessage(), 500);
        }
    }
}
