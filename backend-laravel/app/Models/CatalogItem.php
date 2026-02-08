<?php
// CatalogItem Model - Assets tracked in operations

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CatalogItem extends Model
{
    use HasUuids;

    protected $table = 'catalog_items';
    protected $keyType = 'string';
    public $incrementing = false;

    // This table only has created_at
    const UPDATED_AT = null;

    protected $fillable = [
        'company_id',
        'name',
        'category',
        'icon_ref',
        'unit',
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

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }
}
