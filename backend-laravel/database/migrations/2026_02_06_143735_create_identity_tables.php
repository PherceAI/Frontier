<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Companies
        Schema::create('companies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 100);
            $table->string('code', 10)->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('code');
        });

        // 2. Users (Admins)
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('company_id')->constrained('companies')->onDelete('cascade');
            $table->string('email', 255)->unique();
            $table->string('password_hash', 255);
            $table->string('full_name', 100);
            $table->enum('role', ['OWNER', 'MANAGER']);
            $table->boolean('is_active')->default(true);
            $table->rememberToken();
            $table->timestamps();

            $table->index('company_id');
        });

        // 3. Employees
        Schema::create('employees', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('company_id')->constrained('companies')->onDelete('cascade');
            $table->string('full_name', 100);
            $table->string('employee_code', 20);
            $table->string('access_pin_hash', 255);
            $table->string('access_pin_plain', 4)->nullable(); // Insecure but required by App logic
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['company_id', 'employee_code']);
            $table->index('company_id');
        });

        // 4. Operational Areas (Since we need it for the pivot)
        Schema::create('operational_areas', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('company_id')->constrained('companies')->onDelete('cascade');
            $table->string('name', 100);
            $table->enum('type', ['SOURCE', 'PROCESSOR']);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('created_at')->useCurrent();
            // No updated_at as per Model UPDATED_AT = null

            $table->index('company_id');
        });

        // 5. Employee Areas Pivot
        Schema::create('employee_areas', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('employee_id')->constrained('employees')->onDelete('cascade');
            $table->foreignUuid('area_id')->constrained('operational_areas')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['employee_id', 'area_id']);
        });

        // 6. Employee Sessions
        Schema::create('employee_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('employee_id')->constrained('employees')->onDelete('cascade');
            $table->string('token_hash', 255);
            $table->string('device_fingerprint', 255)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('expires_at');
            $table->timestamp('last_activity')->useCurrent();
            $table->timestamp('created_at')->useCurrent();

            $table->index('employee_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_sessions');
        Schema::dropIfExists('employee_areas');
        Schema::dropIfExists('operational_areas');
        Schema::dropIfExists('employees');
        Schema::dropIfExists('users');
        Schema::dropIfExists('companies');
    }
};
