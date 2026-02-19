<?php

require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "🔍 Auditing Supabase Schema...\n";

try {
    $tables = DB::connection('supabase_erp')->select("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");

    foreach ($tables as $table) {
        $tableName = $table->tablename;
        echo "\n📋 Table: $tableName\n";

        $columns = Schema::connection('supabase_erp')->getColumnListing($tableName);

        foreach ($columns as $column) {
            $type = Schema::connection('supabase_erp')->getColumnType($tableName, $column);
            echo "   - $column ($type)\n";
        }

        // Show one row content fully to see data samples
        $row = DB::connection('supabase_erp')->table($tableName)->first();
        if ($row) {
            echo "   📝 Sample Row: " . json_encode($row) . "\n";
        }
    }

} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage();
}
