<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create default company
        $company = \App\Models\Company::create([
            'name' => 'Frontier Hotel',
            'code' => 'FR01',
        ]);

        // 2. Create OWNER user (Admin)
        \App\Models\User::factory()->create([
            'full_name' => 'Administrador',
            'email' => 'admin@hotel.com',
            'role' => 'OWNER',
            'company_id' => $company->id,
            'password_hash' => \Illuminate\Support\Facades\Hash::make('Admin123!'),
        ]);

        // 3. Create Operational Areas
        // $lavanderia = \App\Models\OperationalArea::create([
        //     'company_id' => $company->id,
        //     'name' => 'Lavandería',
        //     'type' => 'PROCESSOR',
        //     'is_active' => true,
        // ]);

        // $pisos = \App\Models\OperationalArea::create([
        //     'company_id' => $company->id,
        //     'name' => 'Pisos',
        //     'type' => 'SOURCE',
        //     'is_active' => true,
        // ]);

        // 4. Create Demo Employees with known PINs
        // $maria = \App\Models\Employee::create([
        //     'company_id' => $company->id,
        //     // 'full_name' => 'María García',
        //     'full_name' => 'María García',
        //     'employee_code' => 'EMP-001',
        //     'access_pin_hash' => \Illuminate\Support\Facades\Hash::make('1234'),
        //     'access_pin_plain' => '1234',
        //     'is_active' => true,
        // ]);
        // $maria->areas()->attach($pisos->id);

        // $pedro = \App\Models\Employee::create([
        //     'company_id' => $company->id,
        //     'full_name' => 'Pedro Martínez',
        //     'employee_code' => 'EMP-002',
        //     'access_pin_hash' => \Illuminate\Support\Facades\Hash::make('5678'),
        //     'access_pin_plain' => '5678',
        //     'is_active' => true,
        // ]);
        // $pedro->areas()->attach($lavanderia->id);

        // 5. Seed Catalog
        // $this->call(CatalogSeeder::class);
    }
}
