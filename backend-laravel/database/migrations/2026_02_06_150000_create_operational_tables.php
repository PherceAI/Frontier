<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. Catalog Items
        Schema::create('catalog_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('company_id')->constrained('companies')->onDelete('cascade');
            $table->string('name', 100);
            $table->string('category', 50); // HOUSEKEEPING, LAUNDRY, etc.
            $table->string('icon_ref', 50)->nullable(); // For frontend icons
            $table->string('unit', 20)->default('pcs'); // pcs, kg, etc.
            $table->boolean('is_active')->default(true);
            $table->timestamp('created_at')->useCurrent();
            // UPDATED_AT handled by code or ignored as per model
        });

        // 2. Operational Events (The Ledger)
        Schema::create('operational_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('company_id')->constrained('companies')->onDelete('cascade');
            $table->foreignUuid('employee_id')->constrained('employees')->onDelete('cascade');
            $table->foreignUuid('area_id')->constrained('operational_areas')->onDelete('cascade');
            $table->foreignUuid('session_id')->nullable()->constrained('employee_sessions')->onDelete('set null');

            $table->string('event_type', 50); // COLLECTION, WASH_CYCLE, etc.
            $table->timestamp('timestamp')->useCurrent(); // When it happened
            $table->text('notes')->nullable();
        });

        // 3. Event Details (Line Items)
        Schema::create('event_details', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('event_id')->constrained('operational_events')->onDelete('cascade');
            $table->foreignUuid('item_id')->nullable()->constrained('catalog_items')->onDelete('set null');

            $table->integer('quantity')->default(0);
            $table->json('metadata')->nullable(); // Extra data (cycle temp, weight, etc.)
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_details');
        Schema::dropIfExists('operational_events');
        Schema::dropIfExists('catalog_items');
    }
};
