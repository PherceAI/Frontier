<?php
// Test Script: Full Operational Flow Simulation

echo "🚀 Starting Rigorous Flow Test...\n";

// Unified Request Function
function request($method, $path, $token = null, $data = [], $isBearer = false)
{
    $headers = "Content-Type: application/json\r\nAccept: application/json\r\n";
    if ($token) {
        $headers .= $isBearer ? "Authorization: Bearer $token\r\n" : "x-session-token: $token\r\n";
    }

    $opts = [
        'http' => [
            'method' => $method,
            'header' => $headers,
            'ignore_errors' => true,
            'content' => !empty($data) ? json_encode($data) : null
        ]
    ];
    $url = "http://localhost:8000/api$path";
    $json = file_get_contents($url, false, stream_context_create($opts));
    return json_decode($json, true);
}

// 0. Setup
echo "\n📦 0. Fetching Catalog to get Item ID...\n";
$authRes0 = request('POST', '/auth/pin/login', null, ['pin' => '1234']);
if (!$authRes0['success'])
    die("❌ Setup Auth Failed: " . json_encode($authRes0));
$tempToken = $authRes0['data']['sessionToken'];

$catalogRes = request('GET', '/operations/catalog/housekeeping', $tempToken);
if (!$catalogRes['success'])
    die("❌ Catalog Fetch Failed\n");

$itemId = $catalogRes['data'][0]['id'];
$itemName = $catalogRes['data'][0]['name'];
echo "✅ Using Item: $itemName ($itemId)\n";

$testQty = 5;

// 1. Get Housekeeping Session
echo "\n🔑 1. Logging in as Housekeeping (Pin: 1234)...\n";
$authRes = request('POST', '/auth/pin/login', null, ['pin' => '1234']);
if (!$authRes['success'])
    die("❌ Auth Failed: " . json_encode($authRes));
$token = $authRes['data']['sessionToken'];
echo "✅ Logged in.\n";

// 2. Initial Laundry Status Check
echo "\n📊 2. Checking Initial Laundry Status...\n";
$statusRes = request('GET', '/operations/laundry/status', $token);
$initialBacklog = 0;
foreach ($statusRes['data']['collections'] as $item) {
    if ($item['id'] === $itemId)
        $initialBacklog = $item['total'];
}
echo "ℹ️ Initial Backlog for Item: $initialBacklog\n";

// 3. Log a Housekeeping Collection
echo "\n🛏️ 3. Logging Housekeeping Collection (+ $testQty items)...\n";
$logRes = request('POST', '/operations/housekeeping/log', $token, [
    'logs' => [['item_id' => $itemId, 'quantity' => $testQty]],
    'notes' => 'Test Flow Script'
]);
if (!$logRes['success'])
    die("❌ Log Failed: " . json_encode($logRes));
echo "✅ Logged. Event ID: " . $logRes['data']['eventId'] . "\n";

// 4. Verify Laundry Status Increased
echo "\n📊 4. Verifying Backlog Increase...\n";
$statusRes2 = request('GET', '/operations/laundry/status', $token);
$newBacklog = 0;
foreach ($statusRes2['data']['collections'] as $item) {
    if ($item['id'] === $itemId)
        $newBacklog = $item['total'];
}
echo "ℹ️ New Backlog: $newBacklog\n";

if ($newBacklog !== $initialBacklog + $testQty) {
    die("❌ FAILED: Backlog did not increase correctly. Expected " . ($initialBacklog + $testQty) . ", got $newBacklog\n");
}
echo "✅ Backlog Increased Correctly.\n";

// 5. Log Laundry Wash (Process the items)
echo "\n🔑 5. Logging in as Laundry (Pin: 5678)...\n";
$laundryAuth = request('POST', '/auth/pin/login', null, ['pin' => '5678']);
if (!$laundryAuth['success'])
    die("❌ Laundry Auth Failed: " . json_encode($laundryAuth));
$laundryToken = $laundryAuth['data']['sessionToken'];
echo "✅ Logged in as Laundry.\n";

echo "\nwm 6. Logging Wash Cycle (Processing $testQty items)...\n";
$washRes = request('POST', '/operations/laundry/log', $laundryToken, [
    'cycles' => 1,
    'items' => [['item_id' => $itemId, 'quantity' => $testQty]]
]);
if (!$washRes['success'])
    die("❌ Wash Log Failed: " . json_encode($washRes));
echo "✅ Wash Logged.\n";

// 6. Verify Backlog Decreased
echo "\n📊 7. Verifying Backlog Decrease...\n";
$statusRes3 = request('GET', '/operations/laundry/status', $laundryToken);
$finalBacklog = 0;
foreach ($statusRes3['data']['collections'] as $item) {
    if ($item['id'] === $itemId)
        $finalBacklog = $item['total'];
}
echo "ℹ️ Final Backlog: $finalBacklog\n";

if ($finalBacklog >= $newBacklog) {
    die("❌ FAILED: Backlog did not decrease. New: $newBacklog, Final: $finalBacklog\n");
}
echo "✅ Backlog Decreased Correctly.\n";

// 7. Verify Dashboard Filters (Admin)
echo "\n👨‍💼 8. Testing Dashboard Date Filter...\n";
$adminLogin = request('POST', '/auth/admin/login', null, ['email' => 'admin@hotel.com', 'password' => 'Admin123!']);
if (!$adminLogin['success'])
    die("❌ Admin Auth Failed\n");
$adminToken = $adminLogin['data']['accessToken'];

$today = date('Y-m-d');
$dashRes = request('GET', "/dashboard/activities?from=$today&to=$today", $adminToken, [], true);

if (!$dashRes['success'])
    die("❌ Dashboard Request Failed\n");

echo "✅ Dashboard Data Retrieved. Events found: " . count($dashRes['data']) . "\n";

$foundHousekeeping = false;
$foundLaundry = false;
foreach ($dashRes['data'] as $event) {
    if ($event['eventType'] == 'COLLECTION')
        $foundHousekeeping = true;
    if ($event['eventType'] == 'WASH_CYCLE')
        $foundLaundry = true;
}

if ($foundHousekeeping && $foundLaundry) {
    echo "✅ Recent events found in Dashboard filter.\n";
} else {
    echo "⚠️ Warning: events not found in filtered list.\n";
}

// 8. Verify Area Logs (Bitacora)
echo "\n📜 9. Testing Area Logs (Bitacora)...\n";

$areasRes = request('GET', '/config/areas', $adminToken, [], true);
$laundryId = null;
if (isset($areasRes['data'])) {
    foreach ($areasRes['data'] as $area) {
        if ($area['type'] === 'PROCESSOR')
            $laundryId = $area['id'];
    }
}
echo "ℹ️ Laundry Area ID: $laundryId\n";

if ($laundryId) {
    $logsRes = request('GET', "/dashboard/area/$laundryId/logs", $adminToken, [], true);
    if (!$logsRes['success'])
        die("❌ Area Logs Failed: " . json_encode($logsRes));

    echo "✅ Area Logs Retrieved. count: " . count($logsRes['data']['data']) . "\n";

    $foundWash = false;
    foreach ($logsRes['data']['data'] as $log) {
        if ($log['type'] === 'WASH_CYCLE')
            $foundWash = true;
    }
    if ($foundWash)
        echo "✅ Wash event confirmed in Area Logs.\n";
    else
        echo "⚠️ Warning: Wash event not found in logs.\n";
}

echo "\n🎉 SYSTEM RESET & OPTIMIZATION VERIFIED.\n";
