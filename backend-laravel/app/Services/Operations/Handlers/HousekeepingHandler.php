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

class HousekeepingHandler implements OperationHandler
{
    public function validate(array $data): array
    {
        $validator = Validator::make($data, [
            'logs' => 'required|array',
            'logs.*.item_id' => 'required|distinct|exists:catalog_items,id',
            'logs.*.quantity' => 'required|integer|min:1|max:100', // Sanity limits
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
            $event = OperationalEvent::create([
                'id' => Str::uuid(),
                'company_id' => $employee->company_id,
                'employee_id' => $employee->id,
                'area_id' => $area->id,
                'session_id' => $session ? $session->id : null,
                'event_type' => 'DEMAND', // Explicitly DEMAND (Source generates demand)
                'timestamp' => now(),
                'notes' => $validData['notes'] ?? null,
            ]);

            foreach ($validData['logs'] as $log) {
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

    public function getStatus(OperationalArea $area): array
    {
        return [
            'message' => 'Housekeeping Area Active',
            'type' => 'SOURCE'
        ];
    }

    public function getPendingWork(OperationalArea $area): array
    {
        // Source areas don't have a "backlog" of items to process (usually).
        // Unless we track "dirty rooms" vs "clean rooms".
        // For now, return empty pending state.
        return [
            'totalPending' => 0,
            'byItem' => [],
            'message' => "Área de Origen (Genera Demanda)",
        ];
    }
}
