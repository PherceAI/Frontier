<?php
try {
    echo "Clearing config cache...\n";
    \Artisan::call('config:clear');

    $config = config('database.connections.supabase_erp');
    echo "\n--- DEBUG INFO ---\n";
    echo "Host: " . ($config['host'] ?? 'NULL') . "\n";
    echo "User: " . ($config['username'] ?? 'NULL') . "\n";
    echo "Password provided: " . (empty($config['password']) ? 'NO' : 'YES') . "\n";
    echo "------------------\n\n";

    echo "Attempting connection...\n";
    $pdo = \DB::connection('supabase_erp')->getPdo();
    echo "✅ CONNECTION SUCCESSFUL!\n";

    echo "\nChecking tables...\n";
    $stmt = $pdo->query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    $tables = $stmt->fetchAll(\PDO::FETCH_COLUMN);

    if (empty($tables)) {
        echo "⚠️ No tables found in 'public' schema.\n";
    } else {
        echo "Tables found: " . implode(', ', $tables) . "\n";
    }

} catch (\Exception $e) {
    echo "❌ CONNECTION FAILED: " . $e->getMessage() . "\n";
}
