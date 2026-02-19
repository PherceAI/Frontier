<?php

namespace App\Models\Erp;

use Illuminate\Database\Eloquent\Model;

abstract class ErpBaseModel extends Model
{
    /**
     * The connection name for the model.
     *
     * @var string
     */
    protected $connection = 'supabase_erp';

    /**
     * Indicates if the model should be compliant with the ERP's timestamps.
     * Often legacy DBs don't have created_at/updated_at or use different names.
     * Set to false if not needed, or configure const CREATED_AT = 'creation_date'; etc.
     * Starting with standard assumptions.
     *
     * @var bool
     */
    public $timestamps = false;
}
