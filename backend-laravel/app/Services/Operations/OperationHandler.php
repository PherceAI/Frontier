<?php

namespace App\Services\Operations;

use App\Models\OperationalArea;
use App\Models\Employee;
use App\Models\OperationalEvent;
use App\Models\EmployeeSession;

interface OperationHandler
{
    /**
     * Validate the input data for this specific area type.
     * Throws ValidationException on failure.
     */
    public function validate(array $data): array;

    /**
     * Process the operation log.
     */
    public function process(OperationalArea $area, Employee $employee, ?EmployeeSession $session, array $validData): OperationalEvent;

    /**
     * Get the current status/dashboard data for this area.
     */
    public function getStatus(OperationalArea $area): array;

    /**
     * Get pending work items for this area (e.g. Backlog for Laundry).
     */
    public function getPendingWork(OperationalArea $area): array;
}
