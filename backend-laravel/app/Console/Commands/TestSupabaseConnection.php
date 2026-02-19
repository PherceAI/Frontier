<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class TestSupabaseConnection extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:test-supabase';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test connection to Supabase ERP database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("🔄 Testing Supabase ERP Connection...");

        try {
            // 1. Check basic connection
            // Force reconnection to ensure fresh config
            DB::purge('supabase_erp');
            $pdo = DB::connection('supabase_erp')->getPdo();
            $this->info("✅ Connection Established Successfully!");

            // 2. Check if table exists
            $tableName = 'ocupacion_historico';
            $schema = DB::connection('supabase_erp')->getSchemaBuilder();

            if ($schema->hasTable($tableName)) {
                $this->info("✅ Table '$tableName' found.");

                // 3. Get row count
                $count = DB::connection('supabase_erp')->table($tableName)->count();
                $this->info("📊 Total Rows: $count");

                // 4. Get sample data (first row)
                $sample = DB::connection('supabase_erp')->table($tableName)->first();
                if ($sample) {
                    $this->info("📝 Sample Data (First Row):");
                    $this->table(array_keys((array) $sample), [(array) $sample]);
                    $this->info("✅ Data read access confirmed.");
                } else {
                    $this->warn("⚠️ Table is empty, but access is working.");
                }

            } else {
                $this->error("❌ Table '$tableName' NOT found.");
                // List available tables to help debug
                $tables = DB::connection('supabase_erp')->select("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'");
                $this->info("📋 Available Tables:");
                foreach ($tables as $table) {
                    $this->line(" - " . $table->tablename);
                }
            }

        } catch (\Exception $e) {
            $this->error("❌ Connection Failed:");
            $this->error($e->getMessage());
        }
    }
}
