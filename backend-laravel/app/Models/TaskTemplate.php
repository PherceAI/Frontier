<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TaskTemplate extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'company_id',
        'title',
        'description',
        'area_id',
        'priority',
        'estimated_minutes',
        'recurrence_rule',
        'checklist_template',
        'is_active',
    ];

    protected $casts = [
        'checklist_template' => 'array',
        'is_active' => 'boolean',
        'priority' => 'integer',
        'estimated_minutes' => 'integer',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(OperationalArea::class, 'area_id');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class, 'template_id');
    }
}
