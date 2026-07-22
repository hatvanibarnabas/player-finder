<?php
require_once __DIR__ . '/../middleware/Auth.php';
require_once __DIR__ . '/../services/MessageService.php';

class MessageController {
    private MessageService $messages;

    public function __construct() {
        $this->messages = new MessageService();
    }

    public function index(): void {
        $userId = AuthMiddleware::requireUserId();
        echo json_encode([
            'conversations' => $this->messages->listConversations($userId),
            'unread_total' => $this->messages->countUnreadTotal($userId),
        ]);
    }

    public function unreadCount(): void {
        $userId = AuthMiddleware::requireUserId();
        echo json_encode([
            'unread_total' => $this->messages->countUnreadTotal($userId),
        ]);
    }

    public function open(): void {
        $userId = AuthMiddleware::requireUserId();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $otherUserId = (int) ($data['user_id'] ?? 0);

        if ($otherUserId <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Hiányzó user_id!']);
            return;
        }

        try {
            $conversation = $this->messages->getOrCreateConversation($userId, $otherUserId);
            echo json_encode(['conversation' => $conversation]);
        } catch (InvalidArgumentException $e) {
            http_response_code(400);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    public function show(int $conversationId): void {
        $userId = AuthMiddleware::requireUserId();

        try {
            $conversation = $this->messages->getConversationForUser($conversationId, $userId);
            echo json_encode(['conversation' => $conversation]);
        } catch (InvalidArgumentException $e) {
            http_response_code(404);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    public function messages(int $conversationId): void {
        $userId = AuthMiddleware::requireUserId();
        $afterId = isset($_GET['after_id']) ? (int) $_GET['after_id'] : null;
        $markRead = !isset($_GET['mark_read']) || $_GET['mark_read'] !== '0';

        try {
            $list = $this->messages->listMessages(
                $conversationId,
                $userId,
                $afterId,
                $markRead
            );
            echo json_encode(['messages' => $list]);
        } catch (InvalidArgumentException $e) {
            http_response_code(404);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    public function markRead(int $conversationId): void {
        $userId = AuthMiddleware::requireUserId();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $messageId = isset($data['message_id']) ? (int) $data['message_id'] : null;

        try {
            $result = $this->messages->markRead($conversationId, $userId, $messageId);
            echo json_encode([
                'message' => 'Olvasottnak jelölve.',
                'data' => $result,
            ]);
        } catch (InvalidArgumentException $e) {
            http_response_code(400);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    public function send(int $conversationId): void {
        $userId = AuthMiddleware::requireUserId();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $body = (string) ($data['body'] ?? '');

        try {
            $message = $this->messages->sendMessage($conversationId, $userId, $body);
            http_response_code(201);
            echo json_encode([
                'message' => 'Üzenet elküldve!',
                'data' => $message,
            ]);
        } catch (InvalidArgumentException $e) {
            http_response_code(400);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}
