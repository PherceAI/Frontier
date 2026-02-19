<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $roi
 * @property string $habitacion
 * @property string|null $huesped
 * @property string|null $empresa
 * @property int|null $adultos
 * @property int|null $ninos
 * @property string|null $check_in
 * @property string|null $check_out
 * @property string|null $ultima_verificacion
 */
class OcupacionHistorico extends Model
{
    /**
     * The connection name for the model.
     *
     * @var string
     */
    protected $connection = 'supabase_erp';

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'ocupacion_historico';

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The attributes that aren't mass assignable.
     *
     * @var array
     */
    protected $guarded = [];
}
