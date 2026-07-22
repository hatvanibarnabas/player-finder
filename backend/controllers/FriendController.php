<?php
require_once __DIR__ . '/../middleware/Auth.php';
require_once __DIR__ . '/../services/FriendService.php';

class FriendController {
    private FriendService $friends;

    public function __construct() {
        $this->friends = new FriendService();
    }

    public function index(): void {
        $userId = AuthMiddleware::requireUserId();
        echo json_encode($this->friends->listForUser($userId));
    }

    public function request(): void {
        $userId = AuthMiddleware::requireUserId();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $targetId = (int) ($data['user_id'] ?? 0);

        if ($targetId <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Hiányzó user_id!']);
            return;
        }

        try {
            $friendship = $this->friends->sendRequest($userId, $targetId);
            http_response_code(201);
            echo json_encode([
                'message'    => 'Jelölés elküldve!',
                'friendship' => $friendship,
            ]);
        } catch (InvalidArgumentException $e) {
            http_response_code(400);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    public function respond(): void {
        $userId = AuthMiddleware::requireUserId();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $friendshipId = (int) ($data['friendship_id'] ?? 0);
        $action = trim($data['action'] ?? '');

        if ($friendshipId <= 0 || $action === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Hiányzó friendship_id vagy action!']);
            return;
        }

        try {
            $friendship = $this->friends->respond($userId, $friendshipId, $action);
            $message = $action === 'accept'
                ? 'Jelölés elfogadva!'
                : 'Jelölés elutasítva!';

            echo json_encode([
                'message'    => $message,
                'friendship' => $friendship,
            ]);
        } catch (InvalidArgumentException $e) {
            http_response_code(400);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    public function remove(): void {
        $userId = AuthMiddleware::requireUserId();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $friendshipId = (int) ($data['friendship_id'] ?? $_GET['friendship_id'] ?? 0);

        if ($friendshipId <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Hiányzó friendship_id!']);
            return;
        }

        try {
            $this->friends->remove($userId, $friendshipId);
            echo json_encode(['message' => 'Kapcsolat törölve.']);
        } catch (InvalidArgumentException $e) {
            http_response_code(400);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}
