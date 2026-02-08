<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Employee;
use App\Models\OperationalArea;
use App\Models\CatalogItem;
use App\Models\Company;
use App\Models\EmployeeSession;
use Illuminate\Support\Str;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OperationsTest extends TestCase
{
    // use RefreshDatabase; // Commented out to avoid wiping existing dev DB if not desired, but recommended for clean tests. Using transaction rollback by default in tests.

    public function test_housekeeping_catalog_structure()
    {
        // 1. Setup Tenant
        $company = Company::factory()->create();

        $employee = Employee::forceCreate([
            'id' => (string) Str::uuid(),
            'company_id' => $company->id,
            'full_name' => 'Test Employee',
            'employee_code' => '1234',
            'access_pin_hash' => 'hash',
            'access_pin_plain' => '1234',
            'is_active' => true,
        ]);
        $token = Str::random(60);
        $session = new EmployeeSession([
            'id' => (string) Str::uuid(),
            'employee_id' => $employee->id,
            'token_hash' => hash('sha256', $token),
            'is_active' => true,
            'expires_at' => now()->addHours(8),
            'last_activity' => now(),
        ]);
        $session->timestamps = false;
        $session->setCreatedAt(now());
        $session->save();

        // Ensure catalog item
        $item = new CatalogItem([
            'id' => (string) Str::uuid(),
            'company_id' => $company->id,
            'name' => 'Test Towel',
            'category' => 'HOUSEKEEPING',
            'unit' => 'PCS',
            'icon_ref' => 'towel',
            'is_active' => true,
        ]);
        $item->timestamps = false;
        $item->setCreatedAt(now());
        $item->save();

        $response = $this->withHeaders([
            'x-session-token' => $token
        ])->getJson('/api/operations/catalog/housekeeping');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'category'
                    ]
                ]
            ]);
    }
}
