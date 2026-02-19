<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'company_id',
        'template_id',
        'title',
        'description',
        'area_id',
        'assigned_to',
        'assigned_by',
        'status',
        'priority',
        'due_date',
        'due_time',
        'started_at',
        'completed_at',
        'completion_notes',
    ];

    protected $casts = [
        'priority' => 'integer',
        'due_date' => 'date',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    // Status constants
    const STATUS_PENDING = 'PENDING';
    const STATUS_IN_PROGRESS = 'IN_PROGRESS';
    const STATUS_COMPLETED = 'COMPLETED';
    const STATUS_OVERDUE = 'OVERDUE';
    const STATUS_CANCELLED = 'CANCELLED';

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(TaskTemplate::class, 'template_id');
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(OperationalArea::class, 'area_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'assigned_to');
    }

    public function assigner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function checklistItems(): HasMany
    {
        return $this->hasMany(TaskChecklistItem::class)->orderBy('sort_order');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeInProgress($query)
    {
        return $query->where('status', self::STATUS_IN_PROGRESS);
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', [self::STATUS_PENDING, self::STATUS_IN_PROGRESS]);
    }

    public function scopeForEmployee($query, string $employeeId)
    {
        return $query->where('assigned_to', $employeeId);
    }

    public function scopeForToday($query)
    {
        return $query->whereDate('due_date', now()->toDateString())
            ->orWhereNull('due_date');
    }
}
