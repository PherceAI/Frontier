<?php
$token = trim(file_get_contents('session_token.txt'));
$data = ['logs' => [['item_id' => '9773fbf0-b4c3-45f7-bdb0-b945dd24ebff', 'quantity' => 2]], 'notes' => 'Test'];
$opts = ['http' => ['method' => 'POST', 'header' => "Content-Type: application/json\r\nx-session-token: $token", 'ignore_errors' => true, 'content' => json_encode($data)]];
echo file_get_contents('http://localhost:8000/api/operations/housekeeping/log', false, stream_context_create($opts));
