<?php
// OperationalEvent Model - The Immutable Ledger

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OperationalEvent extends Model
{
    use HasUuids;

    protected $table = 'operational_events';
    protected $keyType = 'string';
    public $incrementing = false;

    // This is an append-only ledger - no timestamps auto-update
    public $timestamps = false;

    protected $fillable = [
        'company_id',
        'timestamp',
        'employee_id',
        'area_id',
        'event_type',
        'session_id',
        'notes',
    ];

    protected $casts = [
        'timestamp' => 'datetime',
    ];

    // Relationships
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(OperationalArea::class, 'area_id');
    }

    public function details(): HasMany
    {
        return $this->hasMany(EventDetail::class, 'event_id');
    }

    // Boot method to set timestamp on creation
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (!$model->timestamp) {
                $model->timestamp = now();
            }
        });
    }
}
