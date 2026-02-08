<?php
// Dashboard Controller - Analytics and real-time data

namespace App\Http\Controllers\Api;

use App\Models\OperationalEvent;
use App\Models\OperationalArea;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends ApiController
{
    /**
     * GET /dashboard/bottleneck
     * The "God View" - Supply vs Demand in real-time
     */
    /**
     * GET /dashboard/bottleneck
     * The "God View" - Supply vs Demand in real-time
     */
    public function bottleneck(Request $request)
    {
        $companyId = $request->user->company_id;

        // 1. Calculate Totals (All Time)
        $totals = DB::selectOne("
            SELECT 
                COALESCE(SUM(CASE WHEN oe.event_type IN ('DEMAND', 'COLLECTION') THEN ed.quantity ELSE 0 END), 0) as total_demand,
                COALESCE(SUM(CASE WHEN oe.event_type IN ('SUPPLY', 'WASH_CYCLE') THEN ed.quantity ELSE 0 END), 0) as total_supply
            FROM operational_events oe
            JOIN event_details ed ON ed.event_id = oe.id
            WHERE oe.company_id = ?
        ", [$companyId]);

        $totalDemand = (int) $totals->total_demand;
        $totalSupply = (int) $totals->total_supply;
        $pending = $totalDemand - $totalSupply;
        $pendingRatio = $totalDemand > 0 ? round($pending / $totalDemand, 2) : 0;

        // 2. Calculate Trends (Today vs Yesterday)
        // We compare volume of items processed/demanded today vs yesterday
        $todayStart = now()->startOfDay();
        $todayEnd = now()->endOfDay();
        $yesterdayStart = now()->subDay()->startOfDay();
        $yesterdayEnd = now()->subDay()->endOfDay();

        $trendsQuery = DB::select("
            SELECT
                -- Today
                SUM(CASE WHEN oe.timestamp BETWEEN ? AND ? AND oe.event_type IN ('DEMAND', 'COLLECTION') THEN ed.quantity ELSE 0 END) as demand_today,
                SUM(CASE WHEN oe.timestamp BETWEEN ? AND ? AND oe.event_type IN ('SUPPLY', 'WASH_CYCLE') THEN ed.quantity ELSE 0 END) as supply_today,
                -- Yesterday
                SUM(CASE WHEN oe.timestamp BETWEEN ? AND ? AND oe.event_type IN ('DEMAND', 'COLLECTION') THEN ed.quantity ELSE 0 END) as demand_yesterday,
                SUM(CASE WHEN oe.timestamp BETWEEN ? AND ? AND oe.event_type IN ('SUPPLY', 'WASH_CYCLE') THEN ed.quantity ELSE 0 END) as supply_yesterday
            FROM operational_events oe
            JOIN event_details ed ON ed.event_id = oe.id
            WHERE oe.company_id = ?
        ", [
            $todayStart,
            $todayEnd,
            $todayStart,
            $todayEnd,
            $yesterdayStart,
            $yesterdayEnd,
            $yesterdayStart,
            $yesterdayEnd,
            $companyId
        ]);

        $trendData = $trendsQuery[0];

        $calculateTrend = function ($current, $previous) {
            if ($previous == 0)
                return $current > 0 ? 100 : 0;
            return round((($current - $previous) / $previous) * 100, 1);
        };

        $demandTrend = $calculateTrend($trendData->demand_today, $trendData->demand_yesterday);
        $supplyTrend = $calculateTrend($trendData->supply_today, $trendData->supply_yesterday);

        // Pending trend is inverse (less pending is better)
        $pendingToday = $trendData->demand_today - $trendData->supply_today;
        $pendingYesterday = $trendData->demand_yesterday - $trendData->supply_yesterday;
        $pendingTrend = $calculateTrend($pendingToday, $pendingYesterday);


        // Determine global status
        $status = 'OK';
        if ($pendingRatio > 0.5) {
            $status = 'CRITICAL';
        } elseif ($pendingRatio > 0.2) {
            $status = 'WARNING';
        }

        // 3. Per-Area Breakdown
        $byArea = DB::select("
            SELECT 
                oa.id as area_id,
                oa.name as area_name,
                oa.type as area_type,
                COALESCE(SUM(CASE WHEN oe.event_type IN ('DEMAND', 'COLLECTION') THEN ed.quantity ELSE 0 END), 0) as demand,
                COALESCE(SUM(CASE WHEN oe.event_type IN ('SUPPLY', 'WASH_CYCLE') THEN ed.quantity ELSE 0 END), 0) as supply
            FROM operational_areas oa
            LEFT JOIN operational_events oe ON oe.area_id = oa.id
            LEFT JOIN event_details ed ON ed.event_id = oe.id
            WHERE oa.company_id = ? AND oa.is_active = true
            GROUP BY oa.id, oa.name, oa.type
            ORDER BY oa.name
        ", [$companyId]);

        $areasData = collect($byArea)->map(function ($a) {
            $pending = $a->demand - $a->supply;
            $ratio = $a->demand > 0 ? $pending / $a->demand : 0;

            $status = 'OK';
            if ($ratio > 0.5)
                $status = 'CRITICAL';
            elseif ($ratio > 0.2)
                $status = 'WARNING';

            return [
                'areaId' => $a->area_id,
                'areaName' => $a->area_name,
                'type' => $a->area_type,
                'demand' => (int) $a->demand,
                'supply' => (int) $a->supply,
                'pending' => max(0, $pending),
                'status' => $status,
            ];
        });

        // Generate critical alerts
        $alerts = $areasData
            ->filter(fn($a) => $a['status'] !== 'OK')
            ->map(fn($a) => [
                'area' => $a['areaName'],
                'level' => $a['status'],
                'message' => "{$a['pending']} items sin procesar",
            ])
            ->values();

        return $this->success([
            'summary' => [
                'totalDemand' => $totalDemand,
                'totalSupply' => $totalSupply,
                'pendingRatio' => $pendingRatio,
                'status' => $status,
                'trends' => [
                    'demand' => $demandTrend,
                    'supply' => $supplyTrend,
                    'pending' => $pendingTrend
                ]
            ],
            'byArea' => $areasData,
            'alerts' => $alerts,
        ]);
    }

    /**
     * GET /dashboard/activities
     * Live feed of recent events
     */
    public function activities(Request $request)
    {
        $companyId = $request->user->company_id;
        $limit = min((int) $request->get('limit', 50), 100);
        $areaId = $request->get('areaId');
        $eventType = $request->get('eventType');

        $query = OperationalEvent::where('company_id', $companyId)
            ->with(['employee:id,full_name', 'area:id,name', 'details.item:id,name'])
            ->orderBy('timestamp', 'desc')
            ->limit($limit);

        if ($areaId) {
            $query->where('area_id', $areaId);
        }

        if ($eventType && in_array($eventType, ['COLLECTION', 'WASH_CYCLE', 'CORRECTION'])) {
            $query->where('event_type', $eventType);
        }

        // Date Filtering
        $from = $request->get('from');
        $to = $request->get('to');

        if ($from) {
            $query->whereDate('timestamp', '>=', $from);
        }
        if ($to) {
            $query->whereDate('timestamp', '<=', $to);
        }

        $events = $query->get();

        return $this->success(
            $events->map(fn($e) => [
                'id' => $e->id,
                'timestamp' => $e->timestamp->toIso8601String(),
                'employee' => $e->employee->full_name,
                'area' => $e->area->name,
                'eventType' => $e->event_type,
                'totalItems' => $e->details->sum('quantity'),
                'items' => $e->details->map(fn($d) => [
                    'name' => $d->item->name,
                    'quantity' => $d->quantity,
                ]),
            ])
        );
    }

    /**
     * GET /dashboard/employee/{id}/stats
     * Individual employee performance
     */
    public function employeeStats(Request $request, string $id)
    {
        $companyId = $request->user->company_id;
        $from = $request->get('from', now()->subDays(7)->toDateString());
        $to = $request->get('to', now()->toDateString());

        $stats = DB::selectOne("
            SELECT 
                COUNT(DISTINCT oe.id) as total_events,
                COALESCE(SUM(ed.quantity), 0) as total_items
            FROM operational_events oe
            JOIN event_details ed ON ed.event_id = oe.id
            WHERE oe.employee_id = ?
              AND oe.company_id = ?
              AND DATE(oe.timestamp) >= ?
              AND DATE(oe.timestamp) <= ?
        ", [$id, $companyId, $from, $to]);

        return $this->success([
            'employeeId' => $id,
            'period' => ['from' => $from, 'to' => $to],
            'stats' => [
                'totalEvents' => (int) $stats->total_events,
                'totalItems' => (int) $stats->total_items,
                'avgItemsPerEvent' => $stats->total_events > 0
                    ? round($stats->total_items / $stats->total_events, 1)
                    : 0,
            ],
        ]);
    }
}
