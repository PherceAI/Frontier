<?php
// Operations Controller - Event recording and pending work

namespace App\Http\Controllers\Api;

use App\Models\OperationalEvent;
use App\Models\EventDetail;
use App\Models\CatalogItem;
use App\Http\Resources\Operations\CatalogItemResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OpsController extends ApiController
{
    /**
     * POST /ops/events
     * Record operational event (The "One-Tap" Action)
     */
    public function createEvent(Request $request)
    {
        $request->validate([
            'areaId' => 'required|uuid',
            'eventType' => 'required|in:DEMAND,SUPPLY',
            'items' => 'required|array|min:1',
            'items.*.itemId' => 'required|uuid',
            'items.*.quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        $session = $request->session_data;
        $employee = $request->employee;

        // Validate employee has access to the area
        $hasAccess = $employee->areas()->where('operational_areas.id', $request->areaId)->exists();
        if (!$hasAccess) {
            return $this->error('AUTH_INSUFFICIENT_ROLE', 'No tienes acceso a esta área', 403);
        }

        // Create event with details in transaction
        $event = DB::transaction(function () use ($request, $session, $employee) {
            $event = OperationalEvent::create([
                'company_id' => $employee->company_id,
                'employee_id' => $employee->id,
                'area_id' => $request->areaId,
                'event_type' => $request->eventType,
                'session_id' => $session->id,
                'notes' => $request->notes,
            ]);

            // Create event details
            foreach ($request->items as $item) {
                EventDetail::create([
                    'event_id' => $event->id,
                    'item_id' => $item['itemId'],
                    'quantity' => $item['quantity'],
                ]);
            }

            return $event;
        });

        // Load relationships for response
        $event->load(['area:id,name', 'details.item:id,name']);
        $totalItems = $event->details->sum('quantity');

        return $this->success([
            'eventId' => $event->id,
            'timestamp' => $event->timestamp->toIso8601String(),
            'employee' => $employee->full_name,
            'area' => $event->area->name,
            'eventType' => $event->event_type,
            'totalItems' => $totalItems,
        ], 201);
    }

    /**
     * GET /ops/events
     * Get employee's event history
     */
    public function getEvents(Request $request)
    {
        $employee = $request->employee;
        $limit = min((int) $request->get('limit', 50), 100);
        $since = $request->get('since');

        $query = OperationalEvent::where('employee_id', $employee->id)
            ->with(['area:id,name', 'details.item:id,name'])
            ->orderBy('timestamp', 'desc')
            ->limit($limit);

        if ($since) {
            $query->where('timestamp', '>=', $since);
        }

        $events = $query->get();

        return $this->success(
            $events->map(fn($e) => [
                'id' => $e->id,
                'timestamp' => $e->timestamp->toIso8601String(),
                'area' => $e->area->name,
                'eventType' => $e->event_type,
                'items' => $e->details->map(fn($d) => [
                    'name' => $d->item->name,
                    'quantity' => $d->quantity,
                ]),
            ])
        );
    }

    /**
     * GET /ops/pending
     * Get pending work for employee's assigned areas
     */
    public function getPending(Request $request)
    {
        $employee = $request->employee;
        $areaIds = $employee->areas()->pluck('operational_areas.id');

        if ($areaIds->isEmpty()) {
            return $this->success([
                'totalPending' => 0,
                'byItem' => [],
                'message' => 'No tienes áreas asignadas',
            ]);
        }

        // Calculate demand - supply per item for processor areas
        $pending = DB::select("
            SELECT 
                ci.id,
                ci.name,
                ci.icon_ref as icon,
                COALESCE(SUM(CASE WHEN oe.event_type = 'DEMAND' THEN ed.quantity ELSE 0 END), 0) as demand,
                COALESCE(SUM(CASE WHEN oe.event_type = 'SUPPLY' THEN ed.quantity ELSE 0 END), 0) as supply
            FROM catalog_items ci
            LEFT JOIN event_details ed ON ed.item_id = ci.id
            LEFT JOIN operational_events oe ON oe.id = ed.event_id
            WHERE ci.company_id = ?
              AND ci.is_active = true
            GROUP BY ci.id, ci.name, ci.icon_ref
            HAVING COALESCE(SUM(CASE WHEN oe.event_type = 'DEMAND' THEN ed.quantity ELSE 0 END), 0) 
                 - COALESCE(SUM(CASE WHEN oe.event_type = 'SUPPLY' THEN ed.quantity ELSE 0 END), 0) > 0
        ", [$employee->company_id]);

        $totalPending = collect($pending)->sum(fn($p) => $p->demand - $p->supply);

        return $this->success([
            'totalPending' => $totalPending,
            'byItem' => collect($pending)->map(fn($p) => [
                'name' => $p->name,
                'icon' => $p->icon,
                'pending' => $p->demand - $p->supply,
            ]),
            'message' => $totalPending > 0
                ? "Tienes {$totalPending} piezas pendientes"
                : "¡Todo al día!",
        ]);
    }
    /**
     * GET /ops/catalog
     * Get generic catalog for worker selection
     */
    public function getCatalog(Request $request)
    {
        $employee = $request->employee;

        $items = CatalogItem::where('company_id', $employee->company_id)
            ->where('is_active', true)
            ->get();

        return $this->success(CatalogItemResource::collection($items)->resolve());
    }
}
