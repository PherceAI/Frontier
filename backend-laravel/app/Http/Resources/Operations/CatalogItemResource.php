<?php

namespace App\Http\Resources\Operations;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CatalogItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'category' => $this->category,
            'iconRef' => $this->icon_ref,
            'unit' => $this->unit,
            'isActive' => $this->is_active,
        ];
    }
}
