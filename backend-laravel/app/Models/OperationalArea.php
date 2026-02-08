<?php
// OperationalArea Model - SOURCE or PROCESSOR zones

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OperationalArea extends Model
{
    use HasUuids;

    protected $table = 'operational_areas';
    protected $keyType = 'string';
    public $incrementing = false;

    // Disable updated_at since the table only has created_at
    const UPDATED_AT = null;

    protected $fillable = [
        'company_id',
        'name',
        'type',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
    ];

    // Relationships
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function employees(): BelongsToMany
    {
        return $this->belongsToMany(Employee::class, 'employee_areas', 'area_id', 'employee_id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(OperationalEvent::class, 'area_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeSource($query)
    {
        return $query->where('type', 'SOURCE');
    }

    public function scopeProcessor($query)
    {
        return $query->where('type', 'PROCESSOR');
    }
}
