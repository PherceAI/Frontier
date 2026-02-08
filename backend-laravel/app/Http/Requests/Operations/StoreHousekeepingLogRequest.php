<?php

namespace App\Http\Requests\Operations;

use Illuminate\Foundation\Http\FormRequest;

class StoreHousekeepingLogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Auth is handled by middleware
    }

    public function rules(): array
    {
        return [
            'logs' => ['required', 'array'],
            'logs.*.item_id' => ['required', 'exists:catalog_items,id'],
            'logs.*.quantity' => ['required', 'integer', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
