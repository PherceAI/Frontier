<?php
// User Model - Admin users with JWT Auth
// Maps to existing 'users' table from NestJS

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasUuids, Notifiable, \Illuminate\Database\Eloquent\Factories\HasFactory;

    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    protected $table = 'users';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'company_id',
        'email',
        'password_hash',
        'full_name',
        'role',
        'is_active',
        'remember_token',
    ];

    protected $hidden = [
        'password_hash',
        'remember_token',
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

    // Helper to check role
    public function isOwner(): bool
    {
        return $this->role === 'OWNER';
    }

    public function isManager(): bool
    {
        return in_array($this->role, ['OWNER', 'MANAGER']);
    }
}
