<?php

namespace App\Services\Operations\Handlers;

use App\Models\EventDetail;
use App\Models\OperationalArea;
use App\Models\Employee;
use App\Models\EmployeeSession;
use App\Models\OperationalEvent;
use App\Services\Operations\OperationHandler;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Validator;

class LaundryHandler implements OperationHandler
{
    public function validate(array $data): array
    {
        $validator = Validator::make($data, [
            'cycles' => 'required|integer|min:1',
            'items' => 'nullable|array', // Optional breakdown
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return $validator->validated();
    }

    public function process(OperationalArea $area, Employee $employee, ?EmployeeSession $session, array $validData): OperationalEvent
    {
        return DB::transaction(function () use ($area, $employee, $session, $validData) {
            $notes = "Completed {$validData['cycles']} cycles";
            if (!empty($validData['notes'])) {
                $notes .= ". " . $validData['notes'];
            }

            // Create Event First
            $event = OperationalEvent::create([
                'id' => Str::uuid(),
                'company_id' => $employee->company_id,
                'employee_id' => $employee->id,
                'area_id' => $area->id,
                'session_id' => $session ? $session->id : null,
                'event_type' => 'SUPPLY',
                'timestamp' => now(),
                'notes' => $notes,
            ]);

            // Validate and Deduct Items
            if (!empty($validData['items'])) {
                foreach ($validData['items'] as $item) {
                    $qty = $item['quantity'] ?? 0;
                    if ($qty <= 0)
                        continue;

                    // PESSIMISTIC LOCK: Lock the item row to serialize access
                    // This prevents race conditions where two processes read the same balance
                    DB::table('catalog_items')
                        ->where('id', $item['item_id'])
                        ->lockForUpdate()
                        ->get();

                    // CALCULATE CURRENT BALANCE
                    $balance = DB::table('catalog_items as ci')
                        ->leftJoin('event_details as ed', 'ed.item_id', '=', 'ci.id')
                        ->leftJoin('operational_events as oe', 'oe.id', '=', 'ed.event_id')
                        ->where('ci.id', $item['item_id'])
                        ->where('ci.company_id', $employee->company_id)
                        ->selectRaw("
                            COALESCE(SUM(CASE 
                                WHEN oe.event_type = 'DEMAND' THEN ed.quantity 
                                WHEN oe.event_type = 'CORRECTION' THEN ed.quantity
                                WHEN oe.event_type = 'SUPPLY' THEN -ed.quantity
                                ELSE 0 
                            END), 0) as current_balance
                        ")
                        ->value('current_balance');

                    $balance = (int) $balance;

                    // STRICT VALIDATION -> AUTO-CORRECTION
                    if ($qty > $balance) {
                        $diff = $qty - $balance;

                        // Auto-create Correction Event (Inflow)
                        // Log it as "CORRECTION" to explain where these items came from
                        $correctionEvent = OperationalEvent::create([
                            'id' => Str::uuid(),
                            'company_id' => $event->company_id,
                            'employee_id' => $event->employee_id, // Same employee reporting
                            'area_id' => $event->area_id,
                            'session_id' => $event->session_id,
                            'event_type' => 'CORRECTION',
                            'timestamp' => now()->subSecond(), // Just before the supply
                            'notes' => "Auto-correction: Found {$diff} unlogged items during processing",
                        ]);

                        EventDetail::create([
                            'event_id' => $correctionEvent->id,
                            'item_id' => $item['item_id'],
                            'quantity' => $diff,
                        ]);
                    }

                    EventDetail::create([
                        'event_id' => $event->id,
                        'item_id' => $item['item_id'],
                        'quantity' => $qty,
                    ]);
                }
            }

            return $event;
        });
    }

    public function getStatus(OperationalArea $area): array
    {
        // Get pending work calculation
        $pendingData = $this->getPendingWork($area);

        // Transform to frontend expected format 'collections'
        // Frontend expects: { id, name, total }
        // CRITICAL: We must return the REAL catalog_item_id as 'id', not a random UUID.
        // The frontend will send this ID back when logging a cycle.
        $collections = $pendingData['byItem']->map(function ($item) {
            return [
                'id' => $item['id'], // Use the real ID from the query
                'name' => $item['name'],
                'total' => $item['pending']
            ];
        })->values();

        return [
            'message' => 'Laundry Status Retrieved',
            'collections' => $collections,
            'summary' => $pendingData['message']
        ];
    }

    public function getPendingWork(OperationalArea $area): array
    {
        // Calculate Demand (Source) - Supply (Processor)
        // This logic is specific to Laundry (Processor) as they clear the backlog.

        $companyId = $area->company_id;

        $pending = DB::select("
            SELECT 
                ci.id,
                ci.name,
                ci.icon_ref as icon,
                COALESCE(SUM(CASE WHEN oe.event_type = 'DEMAND' THEN ed.quantity ELSE 0 END), 0) as demand,
                COALESCE(SUM(CASE WHEN oe.event_type = 'SUPPLY' THEN ed.quantity ELSE 0 END), 0) as supply,
                COALESCE(SUM(CASE 
                    WHEN oe.event_type = 'DEMAND' THEN ed.quantity 
                    WHEN oe.event_type = 'CORRECTION' THEN ed.quantity 
                    WHEN oe.event_type = 'SUPPLY' THEN -ed.quantity 
                    ELSE 0 
                END), 0) as balance
            FROM catalog_items ci
            LEFT JOIN event_details ed ON ed.item_id = ci.id
            LEFT JOIN operational_events oe ON oe.id = ed.event_id
            WHERE ci.company_id = ?
              AND ci.is_active = true
            GROUP BY ci.id, ci.name, ci.icon_ref
            HAVING (
                COALESCE(SUM(CASE 
                    WHEN oe.event_type = 'DEMAND' THEN ed.quantity 
                    WHEN oe.event_type = 'CORRECTION' THEN ed.quantity 
                    WHEN oe.event_type = 'SUPPLY' THEN -ed.quantity 
                    ELSE 0 
                END), 0)
            ) > 0
        ", [$companyId]);

        $totalPending = collect($pending)->sum('balance');

        return [
            'totalPending' => $totalPending,
            'byItem' => collect($pending)->map(fn($p) => [
                'id' => $p->id, // Pass ID through
                'name' => $p->name,
                'icon' => $p->icon,
                'pending' => $p->balance,
            ]),
            'message' => $totalPending > 0
                ? "Tienes {$totalPending} piezas pendientes"
                : "¡Todo al día!",
        ];
    }
}
