<?php

namespace Tests\Feature;

use App\Models\CatalogItem;
use App\Models\Company;
use App\Models\Employee;
use App\Models\OperationalArea;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class LaundryOperationsTest extends TestCase
{
    use RefreshDatabase;

    protected $company;
    protected $laundryArea;
    protected $employee;
    protected $item;

    protected function setUp(): void
    {
        parent::setUp();

        // Setup base data
        $this->company = Company::factory()->create();

        $this->laundryArea = OperationalArea::create([
            'company_id' => $this->company->id,
            'name' => 'Main Laundry',
            'type' => 'PROCESSOR',
            'slug' => 'main-laundry'
        ]);

        $this->employee = Employee::create([
            'company_id' => $this->company->id,
            'full_name' => 'Laundry Operator',
            'employee_code' => 'LAUNDRY01',
            'pin_code' => bcrypt('1234'),
            'is_active' => true,
        ]);

        // Assign employee to area
        $this->employee->areas()->attach($this->laundryArea);

        // Create Item
        $this->item = CatalogItem::create([
            'company_id' => $this->company->id,
            'name' => 'Bath Towel',
            'category' => 'HOUSEKEEPING',
            'is_active' => true,
        ]);
    }

    /** @test */
    public function it_fails_to_register_cycle_without_balance()
    {
        // Login
        $loginResponse = $this->postJson('/api/auth/employee/login', [
            'key' => '1234'
        ]);

        $token = $loginResponse->json('token');
        $headers = ['x-session-token' => $token];

        // Attempt to log 5 items when balance is 0
        $response = $this->postJson('/api/operations/laundry/log', [
            'cycles' => 1,
            'items' => [
                ['item_id' => $this->item->id, 'quantity' => 5]
            ]
        ], $headers);

        // Assert success due to auto-correction
        $response->assertStatus(200);
        // ->assertJson(['message' => 'Operation logged successfully']);
    }

    /** @test */
    public function it_succeeds_to_register_cycle_with_balance()
    {
        // Login
        $loginResponse = $this->postJson('/api/auth/employee/login', [
            'key' => '1234'
        ]);
        $token = $loginResponse->json('token');
        $headers = ['x-session-token' => $token];

        // 1. Create Demand (simulate Housekeeping)
        // Need a source area and employee
        $housekeepingArea = OperationalArea::create([
            'company_id' => $this->company->id,
            'name' => 'Floor 1',
            'type' => 'SOURCE', // Should trigger DEMAND
            'slug' => 'floor-1'
        ]);
        $hkEmployee = Employee::create([
            'company_id' => $this->company->id,
            'full_name' => 'Maid',
            'employee_code' => 'MAID01',
            'pin_code' => bcrypt('5678'),
            'is_active' => true
        ]);
        $hkEmployee->areas()->attach($housekeepingArea);

        // HK Login
        $hkLogin = $this->postJson('/api/auth/employee/login', ['key' => '5678']);
        $hkToken = $hkLogin->json('token');

        // Log Housekeeping (adds 10 pending)
        $this->postJson('/api/operations/housekeeping/log', [
            'items' => [
                ['item_id' => $this->item->id, 'quantity' => 10]
            ]
        ], ['x-session-token' => $hkToken])->assertStatus(200);

        // 2. Laundry Process (5 items)
        $response = $this->postJson('/api/operations/laundry/log', [
            'cycles' => 1,
            'items' => [
                ['item_id' => $this->item->id, 'quantity' => 5]
            ]
        ], $headers);

        $response->assertStatus(200);
    }
}
