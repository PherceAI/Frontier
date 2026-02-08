<?php
// Items Controller - CRUD for catalog items

namespace App\Http\Controllers\Api;

use App\Models\CatalogItem;
use Illuminate\Http\Request;

class ItemsController extends ApiController
{
    /**
     * GET /config/items
     * List catalog items
     */
    public function index(Request $request)
    {
        $companyId = $request->user->company_id;
        $category = $request->get('category');
        $isActive = $request->get('isActive');

        $query = CatalogItem::where('company_id', $companyId);

        if ($category) {
            $query->where('category', $category);
        }

        if ($isActive !== null) {
            $query->where('is_active', $isActive === 'true');
        }

        $items = $query->orderBy('category')->orderBy('name')->get();

        return $this->success(
            $items->map(fn($i) => [
                'id' => $i->id,
                'name' => $i->name,
                'category' => $i->category,
                'iconRef' => $i->icon_ref,
                'unit' => $i->unit,
                'isActive' => $i->is_active,
            ])
        );
    }

    /**
     * POST /config/items
     * Create catalog item
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|min:2|max:100',
            'category' => 'required|string|max:50',
            'iconRef' => 'required|string|max:50',
            'unit' => 'nullable|string|max:20',
        ]);

        $companyId = $request->user->company_id;

        $item = CatalogItem::create([
            'company_id' => $companyId,
            'name' => $request->name,
            'category' => $request->category,
            'icon_ref' => $request->iconRef,
            'unit' => $request->unit ?? 'piece',
            'is_active' => true,
        ]);

        return $this->success([
            'id' => $item->id,
            'name' => $item->name,
            'category' => $item->category,
            'iconRef' => $item->icon_ref,
            'unit' => $item->unit,
        ], 201);
    }

    /**
     * GET /config/items/{id}
     * Get single item
     */
    public function show(Request $request, string $id)
    {
        $companyId = $request->user->company_id;

        $item = CatalogItem::where('id', $id)
            ->where('company_id', $companyId)
            ->first();

        if (!$item) {
            return $this->error('RESOURCE_NOT_FOUND', 'Item not found', 404);
        }

        return $this->success([
            'id' => $item->id,
            'name' => $item->name,
            'category' => $item->category,
            'iconRef' => $item->icon_ref,
            'unit' => $item->unit,
            'isActive' => $item->is_active,
        ]);
    }

    /**
     * PATCH /config/items/{id}
     * Update item
     */
    public function update(Request $request, string $id)
    {
        $request->validate([
            'name' => 'nullable|string|min:2|max:100',
            'category' => 'nullable|string|max:50',
            'iconRef' => 'nullable|string|max:50',
            'unit' => 'nullable|string|max:20',
            'isActive' => 'nullable|boolean',
        ]);

        $companyId = $request->user->company_id;

        $item = CatalogItem::where('id', $id)
            ->where('company_id', $companyId)
            ->first();

        if (!$item) {
            return $this->error('RESOURCE_NOT_FOUND', 'Item not found', 404);
        }

        if ($request->has('name'))
            $item->name = $request->name;
        if ($request->has('category'))
            $item->category = $request->category;
        if ($request->has('iconRef'))
            $item->icon_ref = $request->iconRef;
        if ($request->has('unit'))
            $item->unit = $request->unit;
        if ($request->has('isActive'))
            $item->is_active = $request->isActive;

        $item->save();

        return $this->success([
            'id' => $item->id,
            'name' => $item->name,
            'category' => $item->category,
            'iconRef' => $item->icon_ref,
            'unit' => $item->unit,
            'isActive' => $item->is_active,
        ]);
    }

    /**
     * DELETE /config/items/{id}
     * Soft delete item
     */
    public function destroy(Request $request, string $id)
    {
        $companyId = $request->user->company_id;

        $item = CatalogItem::where('id', $id)
            ->where('company_id', $companyId)
            ->first();

        if (!$item) {
            return $this->error('RESOURCE_NOT_FOUND', 'Item not found', 404);
        }

        $item->is_active = false;
        $item->save();

        return $this->success(['message' => 'Item deactivated']);
    }
}
