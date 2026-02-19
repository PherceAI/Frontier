<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoomResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this['id'],
            'number' => $this['number'],
            'floor' => $this['floor'],
            'type' => $this['type'],
            'status' => $this['status'], // AVAILABLE | OCCUPIED
            'guest' => $this['guest'] ? [
                'name' => $this['guest']['name'],
                'company' => $this['guest']['company'],
                'adults' => $this['guest']['adults'],
                'children' => $this['guest']['children'],
                'check_in' => $this['guest']['check_in'],
                'check_out' => $this['guest']['check_out'],
                'last_updated' => $this['guest']['last_updated'],
                'roi' => $this['guest']['roi'],
            ] : null,
        ];
    }
}
