<?php
// ── Spruch des Tages – API Proxy ──────────────────────────
// Verhindert CORS-Fehler beim direkten Aufrufen der Anthropic API
// 
// SETUP: Trage deinen API-Key bei $API_KEY ein und lade diese
//        Datei in denselben Ordner wie index.html hoch.

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// !! HIER deinen Anthropic API-Key eintragen !!
$API_KEY = 'sk-ant-DEIN-KEY-HIER';

$body = json_decode(file_get_contents('php://input'), true);
$prompt = $body['prompt'] ?? 'Erstelle einen kurzen deutschen Motivationsspruch. Format: SPRUCH|||AUTOR';

$payload = json_encode([
    'model'      => 'claude-haiku-4-5-20251001',
    'max_tokens' => 200,
    'messages'   => [
        ['role' => 'user', 'content' => $prompt]
    ]
]);

$ch = curl_init('https://api.anthropic.com/v1/messages');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'x-api-key: ' . $API_KEY,
        'anthropic-version: 2023-06-01'
    ],
    CURLOPT_TIMEOUT        => 15,
]);

$result = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($result === false || $httpCode !== 200) {
    http_response_code(502);
    echo json_encode(['error' => 'Upstream error', 'code' => $httpCode]);
    exit;
}

$data = json_decode($result, true);
$text = $data['content'][0]['text'] ?? '';

echo json_encode(['text' => trim($text)]);
