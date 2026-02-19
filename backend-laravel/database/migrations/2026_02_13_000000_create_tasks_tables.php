<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. Task Templates (reusable task blueprints)
        Schema::create('task_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('company_id')->constrained('companies')->onDelete('cascade');
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->foreignUuid('area_id')->nullable()->constrained('operational_areas')->onDelete('set null');
            $table->smallInteger('priority')->default(2); // 1=Urgente, 2=Normal, 3=Baja
            $table->integer('estimated_minutes')->nullable();
            $table->string('recurrence_rule', 100)->nullable(); // DAILY, WEEKLY:MON,WED, MONTHLY:15
            $table->jsonb('checklist_template')->nullable(); // [{label, required}]
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['company_id', 'is_active']);
        });

        // 2. Tasks (assigned instances)
        Schema::create('tasks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('company_id')->constrained('companies')->onDelete('cascade');
            $table->foreignUuid('template_id')->nullable()->constrained('task_templates')->onDelete('set null');
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->foreignUuid('area_id')->nullable()->constrained('operational_areas')->onDelete('set null');
            $table->foreignUuid('assigned_to')->nullable()->constrained('employees')->onDelete('set null');
            $table->foreignUuid('assigned_by')->nullable()->constrained('users')->onDelete('set null');
            $table->string('status', 20)->default('PENDING'); // PENDING, IN_PROGRESS, COMPLETED, OVERDUE, CANCELLED
            $table->smallInteger('priority')->default(2);
            $table->date('due_date')->nullable();
            $table->time('due_time')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('completion_notes')->nullable();
            $table->timestamps();

            $table->index(['assigned_to', 'status', 'due_date']);
            $table->index(['company_id', 'area_id', 'status']);
            $table->index(['company_id', 'status', 'due_date']);
        });

        // 3. Task Checklist Items
        Schema::create('task_checklist_items', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('task_id')->constrained('tasks')->onDelete('cascade');
            $table->string('label', 255);
            $table->boolean('is_required')->default(false);
            $table->boolean('is_completed')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->smallInteger('sort_order')->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_checklist_items');
        Schema::dropIfExists('tasks');
        Schema::dropIfExists('task_templates');
    }
};
