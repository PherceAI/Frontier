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
        Schema::table('operational_events', function (Blueprint $table) {
            // Dashboard queries filter by company, type, and range
            $table->index(['company_id', 'event_type', 'timestamp'], 'oe_dashboard_index');
            // Standard FK indexes if not present (Laravel usually relies on DB, but explicit is safer for perf)
            $table->index('area_id');
            $table->index('employee_id');
        });

        Schema::table('event_details', function (Blueprint $table) {
            $table->index('event_id');
            $table->index('item_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('operational_events', function (Blueprint $table) {
            $table->dropIndex('oe_dashboard_index');
            $table->dropIndex(['area_id']);
            $table->dropIndex(['employee_id']);
        });

        Schema::table('event_details', function (Blueprint $table) {
            $table->dropIndex(['event_id']);
            $table->dropIndex(['item_id']);
        });
    }
};
