<?php

namespace App\Services\Operations;

use App\Services\Operations\Handlers\HousekeepingHandler;
use App\Services\Operations\Handlers\LaundryHandler;

class OperationFactory
{
    public static function make(string $type): OperationHandler
    {
        return match ($type) {
            'SOURCE' => new HousekeepingHandler(),
            'PROCESSOR' => new LaundryHandler(),
            default => throw new \Exception("No handler configured for area type: {$type}"),
        };
    }
}
