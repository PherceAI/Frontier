<?php
// Employee Model - Workers with PIN Authentication

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Employee extends Model
{
    use HasUuids;

    protected $table = 'employees';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'company_id',
        'full_name',
        'employee_code',
        'access_pin_hash',
        'is_active',
    ];

    protected $hidden = [
        'access_pin_hash',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function areas(): BelongsToMany
    {
        return $this->belongsToMany(OperationalArea::class, 'employee_areas', 'employee_id', 'area_id')
            ->withTimestamps();
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(EmployeeSession::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(OperationalEvent::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class, 'assigned_to');
    }
}
