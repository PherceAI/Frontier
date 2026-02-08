<?php
// EventDetail Model - Line items in events

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventDetail extends Model
{
    // use HasUuids; // Disabled to match DB Schema (BigInt)

    protected $table = 'event_details';
    // protected $keyType = 'string';
    // public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'event_id',
        'item_id',
        'quantity',
    ];

    protected $casts = [
        'quantity' => 'integer',
    ];

    // Relationships
    public function event(): BelongsTo
    {
        return $this->belongsTo(OperationalEvent::class, 'event_id');
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(CatalogItem::class, 'item_id');
    }
}
