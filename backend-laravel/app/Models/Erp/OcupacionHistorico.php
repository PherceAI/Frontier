<?php

namespace App\Models\Erp;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class OcupacionHistorico extends ErpBaseModel
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'ocupacion_historico';

    /**
     * The primary key associated with the table.
     * Assuming 'id' is standard, but ERPs can be tricky.
     * Based on Supabase table structure.
     *
     * @var string
     */
    protected $primaryKey = 'id';

    /**
     * The attributes that are mass assignable.
     * Should be effectively read-only for this application context, 
     * but defined for completeness.
     *
     * @var array
     */
    protected $guarded = ['id'];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'ultima_verificacion' => 'datetime',
        'check_in' => 'date',
        'check_out' => 'date',
        'adultos' => 'integer',
        'ninos' => 'integer',
        'roi' => 'float',
    ];
}
