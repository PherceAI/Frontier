<?php

require __DIR__ . '/vendor/autoload.php';

error_reporting(E_ALL);
ini_set('display_errors', '0'); // Suppress warnings in output, rely on json

try {
    $app = require __DIR__ . '/bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();

    $pdo = DB::connection('supabase_erp')->getPdo();

    $tables = $pdo->query("
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name ILIKE '%ocupacion%'
    ")->fetchAll(PDO::FETCH_COLUMN);

    $result = [];

    foreach ($tables as $tableName) {
        $columns = $pdo->query("
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = '$tableName'
            ORDER BY ordinal_position
        ")->fetchAll(PDO::FETCH_ASSOC);

        $result[$tableName] = $columns;
    }

    echo json_encode($result, JSON_PRETTY_PRINT);

} catch (\Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
