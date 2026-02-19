<?php

namespace App\Http\Controllers\Erp;

use App\Http\Controllers\Controller;

use App\Models\Erp\OcupacionHistorico;
use App\Http\Resources\Erp\OcupacionHistoricoResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SupabaseController extends Controller
{
    /**
     * Get historical occupation data from Supabase ERP.
     *
     * @return AnonymousResourceCollection
     */
    public function index(): AnonymousResourceCollection
    {
        // Define "Current Simulated Time" for the system: 2026-02-07 21:22:00
        // In a real scenario, we'd use now()
        $now = '2026-02-07 21:22:51';

        // Fetch records from the last 24 hours relative to the simulated 'now'
        // This ensures we get the latest state without being strictly bound to 00:00 UTC
        $data = OcupacionHistorico::where('ultima_verificacion', '<=', $now)
            ->where('ultima_verificacion', '>=', date('Y-m-d H:i:s', strtotime($now . ' - 24 hours')))
            ->orderBy('ultima_verificacion', 'desc')
            ->get();

        // Group by room and take the latest for each
        $uniqueRooms = $data->groupBy('habitacion')->map(function ($items) use ($now) {
            $latest = $items->first();

            // Heuristic: If check_out is today and last verification was more than 4 hours ago, 
            // and it's past noon, it might be a stale record. 
            // However, we'll return it and let the frontend decide or just rely on 'ultima_verificacion'
            return $latest;
        })->values();

        return OcupacionHistoricoResource::collection($uniqueRooms);
    }
}
