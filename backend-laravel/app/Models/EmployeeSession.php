<?php
// EmployeeSession Model - PIN session management

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeSession extends Model
{
    use HasUuids;

    protected $table = 'employee_sessions';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'employee_id',
        'token_hash',
        'device_fingerprint',
        'expires_at',
        'last_activity',
        'is_active',
    ];

    protected $hidden = [
        'token_hash',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'last_activity' => 'datetime',
        'created_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where('expires_at', '>', now());
    }
}
