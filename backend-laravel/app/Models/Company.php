<?php
// Company Model - Multi-tenant root entity

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    use HasUuids, \Illuminate\Database\Eloquent\Factories\HasFactory;

    protected $table = 'companies';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'name',
        'code',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    public function areas(): HasMany
    {
        return $this->hasMany(OperationalArea::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(CatalogItem::class);
    }
}
