<?php

namespace App\Models\Erp;

class ErpRevenue extends ErpBaseModel
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'revenue'; // TODO: Verify table name in Supabase

    /**
     * The primary key associated with the table.
     *
     * @var string
     */
    protected $primaryKey = 'id'; // TODO: Verify primary key

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = []; // Read-only mostly, so empty or select specific fields
}
