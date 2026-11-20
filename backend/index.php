<?php
require_once __DIR__ . '/config/env.php';
loadEnvFile();

header('Content-Type: application/json; charset=utf-8');

function isAllowedOrigin(string $origin): bool {
    $allowed = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://player-finder-eight.vercel.app',
    ];

    $frontendUrl = rtrim((string) env('FRONTEND_URL', ''), '/');
    if ($frontendUrl !== '') {
        $allowed[] = $frontendUrl;
    }

    if (in_array($origin, $allowed, true)) {
        return true;
    }

    // Vercel preview deployok: https://valami.vercel.app
    return (bool) preg_match('#^https://[a-z0-9-]+\.vercel\.app$#i', $origin);
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && isAllowedOrigin($origin)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

require_once __DIR__ . '/routes/api.php';
