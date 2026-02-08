<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Company;
use Illuminate\Support\Str;

class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        $company = Company::first();

        if (!$company) {
            return;
        }

        $items = [
            ['name' => 'Sábanas grandes', 'category' => 'HOUSEKEEPING', 'icon_ref' => 'bed-double', 'unit' => 'pcs'],
            ['name' => 'Sábanas pequeñas', 'category' => 'HOUSEKEEPING', 'icon_ref' => 'bed-single', 'unit' => 'pcs'],
            ['name' => 'Toallas grandes', 'category' => 'HOUSEKEEPING', 'icon_ref' => 'towel-large', 'unit' => 'pcs'],
            ['name' => 'Toallas medianas', 'category' => 'HOUSEKEEPING', 'icon_ref' => 'towel-medium', 'unit' => 'pcs'],
            ['name' => 'Toallas de pie', 'category' => 'HOUSEKEEPING', 'icon_ref' => 'footprints', 'unit' => 'pcs'],
        ];

        foreach ($items as $item) {
            DB::table('catalog_items')->insert([
                'id' => Str::uuid()->toString(),
                'company_id' => $company->id,
                'name' => $item['name'],
                'category' => $item['category'],
                'icon_ref' => $item['icon_ref'],
                'unit' => $item['unit'],
                'is_active' => true,
                'created_at' => now(),
            ]);
        }
    }
}
