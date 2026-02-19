<?php

namespace App\Services;

use App\Models\OcupacionHistorico;
use Illuminate\Support\Collection;

class RoomService
{
    /**
     * Returns the full list of rooms merged with their current status from the ERP.
     * Caches the result for 15 seconds to prevent database overload.
     */
    public function getRoomsWithStatus(): Collection
    {
        return \Illuminate\Support\Facades\Cache::remember('rooms_status', 15, function () {
            // 1. Get static definition of all physical rooms
            $staticRooms = $this->getStaticRoomDefinitions();

            // 2. Fetch current occupancy from Supabase (read-only)
            // Optimization: Select only necessary columns and cache the result
            $oneHourAgo = now()->subHour();

            $occupancyRecords = OcupacionHistorico::where('ultima_verificacion', '>=', $oneHourAgo)
                ->select([
                    'habitacion',
                    'huesped',
                    'empresa',
                    'adultos',
                    'ninos',
                    'check_in',
                    'check_out',
                    'ultima_verificacion',
                    'roi'
                ])
                ->get()
                ->keyBy('habitacion');

            // 3. Merge status
            return $staticRooms->map(function ($room) use ($occupancyRecords) {
                $record = $occupancyRecords->get($room['number']);

                if ($record) {
                    $room['status'] = 'OCCUPIED';
                    $room['guest'] = [
                        'name' => $record->huesped,
                        'company' => $record->empresa,
                        'adults' => $record->adultos,
                        'children' => $record->ninos,
                        'check_in' => $record->check_in,
                        'check_out' => $record->check_out,
                        'last_updated' => $record->ultima_verificacion,
                        'roi' => $record->roi,
                    ];
                } else {
                    $room['status'] = 'AVAILABLE';
                    $room['guest'] = null;
                }

                return $room;
            });
        });
    }

    /**
     * Defines the static layout of the hotel.
     * Source of Truth for physical existence of rooms.
     */
    private function getStaticRoomDefinitions(): Collection
    {
        $floors = [
            1 => ['101', '102', '103', '104', '105', '106', '107', '108'],
            2 => ['201', '202', '203', '204', '205', '206', '207', '208', '224', '225'],
            3 => ['301', '302', '303', '304', '305', '306', '307', '308'],
            4 => ['401', '402', '403', '404', '405', '406', '408'],
            5 => ['501', '502', '503', '504', '505', '506', '507', '508'],
            6 => ['602', '603', '604', '605', '606', '608'],
            7 => ['701', '702', '703', '704', '705', '706', '708'],
            8 => ['801', '802', '803', '804', '805', '806', '808'],
            9 => ['901', '902', '903', '904', '905', '906', '907', '908'],
            10 => ['1001', '1002', '1003', '1004', '1005', '1006', '1007', '1008'],
        ];

        $rooms = [];

        foreach ($floors as $floor => $roomNumbers) {
            $type = $this->getRoomTypeByFloor($floor);

            foreach ($roomNumbers as $number) {
                $rooms[] = [
                    'id' => "room-{$number}", // Unique frontend key
                    'number' => (string) $number,
                    'floor' => $floor,
                    'type' => $type,
                    // Default values
                    'status' => 'UNKNOWN',
                    'guest' => null
                ];
            }
        }

        return collect($rooms);
    }

    private function getRoomTypeByFloor(int $floor): string
    {
        if ($floor >= 1 && $floor <= 3)
            return 'STANDARD';
        if ($floor >= 4 && $floor <= 6)
            return 'EXECUTIVE';
        if ($floor >= 7 && $floor <= 10)
            return 'PREMIUM';
        return 'STANDARD';
    }
}
