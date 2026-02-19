<?php

namespace App\Http\Resources\Erp;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OcupacionHistoricoResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'habitacion' => $this->habitacion,
            'huesped' => $this->huesped,
            'empresa' => $this->empresa,
            'adultos' => (int) $this->adultos,
            'ninos' => (int) $this->ninos,
            'checkIn' => $this->check_in ? $this->check_in->format('Y-m-d') : null,
            'checkOut' => $this->check_out ? $this->check_out->format('Y-m-d') : null,
            'roi' => (float) $this->roi,
            'fecha' => $this->ultima_verificacion ? $this->ultima_verificacion->format('Y-m-d H:i:s') : null,
        ];
    }
}
