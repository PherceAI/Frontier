<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskChecklistItem extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'task_id',
        'label',
        'is_required',
        'is_completed',
        'completed_at',
        'sort_order',
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'is_completed' => 'boolean',
        'completed_at' => 'datetime',
        'sort_order' => 'integer',
    ];

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }
}
