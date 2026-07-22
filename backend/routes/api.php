<?php
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

if ($uri === '/auth/register' && $method === 'POST') {
    require_once __DIR__ . '/../controllers/AuthController.php';
    (new AuthController())->register();

} elseif ($uri === '/auth/login' && $method === 'POST') {
    require_once __DIR__ . '/../controllers/AuthController.php';
    (new AuthController())->login();

} elseif ($uri === '/me' && $method === 'GET') {
    require_once __DIR__ . '/../controllers/MeController.php';
    (new MeController())->show();

} elseif ($uri === '/me/riot' && $method === 'POST') {
    require_once __DIR__ . '/../controllers/MeController.php';
    (new MeController())->linkRiot();

} elseif ($uri === '/me/riot' && $method === 'DELETE') {
    require_once __DIR__ . '/../controllers/MeController.php';
    (new MeController())->unlinkRiot();

} elseif ($uri === '/friends' && $method === 'GET') {
    require_once __DIR__ . '/../controllers/FriendController.php';
    (new FriendController())->index();

} elseif ($uri === '/friends/request' && $method === 'POST') {
    require_once __DIR__ . '/../controllers/FriendController.php';
    (new FriendController())->request();

} elseif ($uri === '/friends/respond' && $method === 'POST') {
    require_once __DIR__ . '/../controllers/FriendController.php';
    (new FriendController())->respond();

} elseif ($uri === '/friends' && $method === 'DELETE') {
    require_once __DIR__ . '/../controllers/FriendController.php';
    (new FriendController())->remove();

} elseif ($uri === '/search' && $method === 'GET') {
    require_once __DIR__ . '/../controllers/SearchController.php';
    (new SearchController())->search();

} elseif ($uri === '/scores' && $method === 'POST') {
    require_once __DIR__ . '/../controllers/ScoreController.php';
    (new ScoreController())->submit();

} else {
    http_response_code(404);
}
