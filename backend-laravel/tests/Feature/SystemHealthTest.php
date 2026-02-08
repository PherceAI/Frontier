<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SystemHealthTest extends TestCase
{
    /**
     * Test database connection.
     */
    public function test_database_connection_is_healthy(): void
    {
        try {
            $pdo = DB::connection()->getPdo();
            $this->assertNotNull($pdo, 'Could not connect to the database.');
        } catch (\Exception $e) {
            $this->fail('Database connection failed: ' . $e->getMessage());
        }
    }

    /**
     * Test that migrations are up to date.
     */
    public function test_migrations_are_up_to_date(): void
    {
        $this->artisan('migrate:status')
            ->assertExitCode(0);
    }

    /**
     * Test the Employees endpoint (the one failing).
     */
    public function test_employees_endpoint_is_accessible(): void
    {
        // This might fail if unauthenticated, but it shouldn't return 500.
        // If it returns 401, that's a success for "server is running".
        $response = $this->getJson('/api/config/employees');

        if ($response->status() === 500) {
            $this->fail('Employees endpoint returned 500. Check logs.');
        }

        $this->assertTrue(
            in_array($response->status(), [200, 401, 403]),
            "Expected 200, 401, or 403. Got: " . $response->status()
        );
    }
}
