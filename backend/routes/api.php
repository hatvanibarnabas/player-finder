<?php
require_once __DIR__ . '/../controllers/AuthController.php';

$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

$auth = new AuthController();

match(true) {
    $uri === '/auth/register' && $method === 'POST' => $auth->register(),
    $uri === '/auth/login'    && $method === 'POST' => $auth->login(),
    default => http_response_code(404)
};