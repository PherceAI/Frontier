<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class HousekeepingCatalogSeeder extends Seeder
{
    public function run()
    {
        // Get the first company
        $companyId = DB::table('companies')->value('id');

        if (!$companyId) {
            $this->command->error('No company found to seed items for.');
            return;
        }

        $items = [
            [
                'name' => 'Cama King/Doble',
                'category' => 'HOUSEKEEPING',
                'unit' => 'kit',
                'icon_ref' => 'bed-double',
                'cost_per_unit' => 5.00,
            ],
            [
                'name' => 'Cama Sencilla',
                'category' => 'HOUSEKEEPING',
                'unit' => 'kit',
                'icon_ref' => 'bed-single',
                'cost_per_unit' => 3.50,
            ],
            [
                'name' => 'Toalla Baño',
                'category' => 'HOUSEKEEPING',
                'unit' => 'ea',
                'icon_ref' => 'towel-large',
                'cost_per_unit' => 1.20,
            ],
            [
                'name' => 'Toalla Mano',
                'category' => 'HOUSEKEEPING',
                'unit' => 'ea',
                'icon_ref' => 'towel-medium',
                'cost_per_unit' => 0.80,
            ],
            [
                'name' => 'Tapete Baño',
                'category' => 'HOUSEKEEPING',
                'unit' => 'ea',
                'icon_ref' => 'footprints',
                'cost_per_unit' => 1.00,
            ],
        ];

        foreach ($items as $item) {
            DB::table('catalog_items')->updateOrInsert(
                [
                    'company_id' => $companyId,
                    'name' => $item['name'],
                ],
                [
                    'id' => Str::uuid(),
                    'category' => $item['category'],
                    'unit' => $item['unit'],
                    'icon_ref' => $item['icon_ref'],
                    'is_active' => true,
                    'created_at' => now(),
                ]
            );
        }

        $this->command->info('Housekeeping Catalog Seeded Successfully.');
    }
}
