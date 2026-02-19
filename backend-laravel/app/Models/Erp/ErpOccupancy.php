<?php

namespace App\Models\Erp;

class ErpOccupancy extends ErpBaseModel
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'ocupacion_historico';

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
    protected $fillable = [];
}
