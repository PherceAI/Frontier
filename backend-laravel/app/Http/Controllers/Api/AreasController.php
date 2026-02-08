<?php
// Areas Controller - CRUD for operational areas

namespace App\Http\Controllers\Api;

use App\Models\OperationalArea;
use Illuminate\Http\Request;

class AreasController extends ApiController
{
    /**
     * GET /config/areas
     * List areas
     */
    public function index(Request $request)
    {
        $companyId = $request->user->company_id;
        $type = $request->get('type');
        $isActive = $request->get('isActive');

        $query = OperationalArea::where('company_id', $companyId);

        if ($type && in_array($type, ['SOURCE', 'PROCESSOR'])) {
            $query->where('type', $type);
        }

        if ($isActive !== null) {
            $query->where('is_active', $isActive === 'true');
        }

        $areas = $query->orderBy('name')->get();

        return $this->success(
            $areas->map(fn($a) => [
                'id' => $a->id,
                'name' => $a->name,
                'type' => $a->type,
                'description' => $a->description,
                'isActive' => $a->is_active,
                'createdAt' => $a->created_at->toIso8601String(),
            ])
        );
    }

    /**
     * POST /config/areas
     * Create new area
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|min:2|max:100',
            'type' => 'required|in:SOURCE,PROCESSOR',
            'description' => 'nullable|string|max:500',
        ]);

        $companyId = $request->user->company_id;

        $area = OperationalArea::create([
            'company_id' => $companyId,
            'name' => $request->name,
            'type' => $request->type,
            'description' => $request->description,
            'is_active' => true,
        ]);

        return $this->success([
            'id' => $area->id,
            'name' => $area->name,
            'type' => $area->type,
            'description' => $area->description,
            'isActive' => $area->is_active,
        ], 201);
    }

    /**
     * GET /config/areas/{id}
     * Get single area
     */
    public function show(Request $request, string $id)
    {
        $companyId = $request->user->company_id;

        $area = OperationalArea::where('id', $id)
            ->where('company_id', $companyId)
            ->first();

        if (!$area) {
            return $this->error('RESOURCE_NOT_FOUND', 'Area not found', 404);
        }

        return $this->success([
            'id' => $area->id,
            'name' => $area->name,
            'type' => $area->type,
            'description' => $area->description,
            'isActive' => $area->is_active,
            'createdAt' => $area->created_at->toIso8601String(),
        ]);
    }

    /**
     * PATCH /config/areas/{id}
     * Update area
     */
    public function update(Request $request, string $id)
    {
        $request->validate([
            'name' => 'nullable|string|min:2|max:100',
            'description' => 'nullable|string|max:500',
            'isActive' => 'nullable|boolean',
        ]);

        $companyId = $request->user->company_id;

        $area = OperationalArea::where('id', $id)
            ->where('company_id', $companyId)
            ->first();

        if (!$area) {
            return $this->error('RESOURCE_NOT_FOUND', 'Area not found', 404);
        }

        if ($request->has('name')) {
            $area->name = $request->name;
        }

        if ($request->has('description')) {
            $area->description = $request->description;
        }

        if ($request->has('isActive')) {
            $area->is_active = $request->isActive;
        }

        $area->save();

        return $this->success([
            'id' => $area->id,
            'name' => $area->name,
            'type' => $area->type,
            'description' => $area->description,
            'isActive' => $area->is_active,
        ]);
    }

    /**
     * DELETE /config/areas/{id}
     * Soft delete area
     */
    public function destroy(Request $request, string $id)
    {
        $companyId = $request->user->company_id;

        $area = OperationalArea::where('id', $id)
            ->where('company_id', $companyId)
            ->first();

        if (!$area) {
            return $this->error('RESOURCE_NOT_FOUND', 'Area not found', 404);
        }

        // Hard delete to remove it completely as requested
        $area->delete();

        return $this->success(['message' => 'Area deleted permanentely']);
    }
}
