<?php

namespace App\Actions\Operations;

use App\Models\EventDetail;
use App\Models\OperationalEvent;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LogHousekeepingAction
{
    public function execute(array $data, $employee, $session): OperationalEvent
    {
        return DB::transaction(function () use ($data, $employee, $session) {

            // Find standard housekeeping area (SOURCE)
            $area = $employee->areas()->where('type', 'SOURCE')->first();

            if (!$area) {
                throw new \Exception('Employee not assigned to a Source area', 400);
            }

            $event = OperationalEvent::create([
                'id' => Str::uuid(),
                'company_id' => $employee->company_id,
                'employee_id' => $employee->id,
                'area_id' => $area->id,
                'session_id' => $session ? $session->id : null,
                'event_type' => 'COLLECTION',
                'timestamp' => now(),
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($data['logs'] as $log) {
                if ($log['quantity'] > 0) {
                    EventDetail::create([
                        'event_id' => $event->id,
                        'item_id' => $log['item_id'],
                        'quantity' => $log['quantity'],
                    ]);
                }
            }

            return $event;
        });
    }
}
