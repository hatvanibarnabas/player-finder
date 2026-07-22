<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/FriendService.php';

class MessageService {
    private PDO $db;
    private FriendService $friends;

    public function __construct() {
        $database = new Database();
        $this->db = $database->connect();
        $this->friends = new FriendService();
    }

    public function listConversations(int $userId): array {
        $stmt = $this->db->prepare("
            SELECT
                c.id,
                c.updated_at,
                other.id AS other_id,
                other.username AS other_username,
                other.riot_name AS other_riot_name,
                other.riot_tag AS other_riot_tag,
                COALESCE(cr.last_read_message_id, 0) AS last_read_message_id,
                (
                    SELECT m.body
                    FROM messages m
                    WHERE m.conversation_id = c.id
                    ORDER BY m.id DESC
                    LIMIT 1
                ) AS last_body,
                (
                    SELECT m.created_at
                    FROM messages m
                    WHERE m.conversation_id = c.id
                    ORDER BY m.id DESC
                    LIMIT 1
                ) AS last_at,
                (
                    SELECT m.sender_id
                    FROM messages m
                    WHERE m.conversation_id = c.id
                    ORDER BY m.id DESC
                    LIMIT 1
                ) AS last_sender_id,
                (
                    SELECT COUNT(*)
                    FROM messages m
                    WHERE m.conversation_id = c.id
                      AND m.sender_id <> ?
                      AND m.id > COALESCE(cr.last_read_message_id, 0)
                ) AS unread_count
            FROM conversations c
            JOIN users other ON other.id = IF(c.user_low_id = ?, c.user_high_id, c.user_low_id)
            LEFT JOIN conversation_reads cr
                ON cr.conversation_id = c.id AND cr.user_id = ?
            WHERE c.user_low_id = ? OR c.user_high_id = ?
            ORDER BY COALESCE(
                (
                    SELECT m.created_at
                    FROM messages m
                    WHERE m.conversation_id = c.id
                    ORDER BY m.id DESC
                    LIMIT 1
                ),
                c.updated_at
            ) DESC
        ");
        $stmt->execute([$userId, $userId, $userId, $userId, $userId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return array_map(static function (array $row): array {
            return [
                'id' => (int) $row['id'],
                'updated_at' => $row['updated_at'],
                'unread_count' => (int) $row['unread_count'],
                'other_user' => [
                    'id' => (int) $row['other_id'],
                    'username' => $row['other_username'],
                    'riot_name' => $row['other_riot_name'],
                    'riot_tag' => $row['other_riot_tag'],
                ],
                'last_message' => $row['last_body'] !== null
                    ? [
                        'body' => $row['last_body'],
                        'created_at' => $row['last_at'],
                        'sender_id' => (int) $row['last_sender_id'],
                    ]
                    : null,
            ];
        }, $rows);
    }

    public function countUnreadTotal(int $userId): int {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) AS unread_total
            FROM messages m
            JOIN conversations c ON c.id = m.conversation_id
            LEFT JOIN conversation_reads cr
                ON cr.conversation_id = c.id AND cr.user_id = ?
            WHERE (c.user_low_id = ? OR c.user_high_id = ?)
              AND m.sender_id <> ?
              AND m.id > COALESCE(cr.last_read_message_id, 0)
        ");
        $stmt->execute([$userId, $userId, $userId, $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return (int) ($row['unread_total'] ?? 0);
    }

    public function getOrCreateConversation(int $userId, int $otherUserId): array {
        if ($userId === $otherUserId) {
            throw new InvalidArgumentException('Saját magaddal nem beszélgethetsz!');
        }

        if (!$this->friends->areFriends($userId, $otherUserId)) {
            throw new InvalidArgumentException('Csak barátokkal üzenhetsz!');
        }

        $low = min($userId, $otherUserId);
        $high = max($userId, $otherUserId);

        $find = $this->db->prepare("
            SELECT id FROM conversations
            WHERE user_low_id = ? AND user_high_id = ?
            LIMIT 1
        ");
        $find->execute([$low, $high]);
        $existing = $find->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            return $this->getConversationForUser((int) $existing['id'], $userId);
        }

        $insert = $this->db->prepare("
            INSERT INTO conversations (user_low_id, user_high_id)
            VALUES (?, ?)
        ");
        $insert->execute([$low, $high]);

        return $this->getConversationForUser((int) $this->db->lastInsertId(), $userId);
    }

    public function getConversationForUser(int $conversationId, int $userId): array {
        $stmt = $this->db->prepare("
            SELECT
                c.id,
                c.updated_at,
                other.id AS other_id,
                other.username AS other_username,
                other.riot_name AS other_riot_name,
                other.riot_tag AS other_riot_tag,
                (
                    SELECT COUNT(*)
                    FROM messages m
                    LEFT JOIN conversation_reads cr
                        ON cr.conversation_id = c.id AND cr.user_id = ?
                    WHERE m.conversation_id = c.id
                      AND m.sender_id <> ?
                      AND m.id > COALESCE(cr.last_read_message_id, 0)
                ) AS unread_count
            FROM conversations c
            JOIN users other ON other.id = IF(c.user_low_id = ?, c.user_high_id, c.user_low_id)
            WHERE c.id = ?
              AND (c.user_low_id = ? OR c.user_high_id = ?)
            LIMIT 1
        ");
        $stmt->execute([$userId, $userId, $userId, $conversationId, $userId, $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            throw new InvalidArgumentException('A beszélgetés nem található!');
        }

        $otherId = (int) $row['other_id'];
        if (!$this->friends->areFriends($userId, $otherId)) {
            throw new InvalidArgumentException('Csak barátokkal üzenhetsz!');
        }

        return [
            'id' => (int) $row['id'],
            'updated_at' => $row['updated_at'],
            'unread_count' => (int) $row['unread_count'],
            'other_user' => [
                'id' => $otherId,
                'username' => $row['other_username'],
                'riot_name' => $row['other_riot_name'],
                'riot_tag' => $row['other_riot_tag'],
            ],
        ];
    }

    public function listMessages(int $conversationId, int $userId, ?int $afterId = null, bool $markRead = true): array {
        $this->getConversationForUser($conversationId, $userId);

        if ($afterId !== null && $afterId > 0) {
            $stmt = $this->db->prepare("
                SELECT id, conversation_id, sender_id, body, created_at
                FROM messages
                WHERE conversation_id = ? AND id > ?
                ORDER BY id ASC
                LIMIT 200
            ");
            $stmt->execute([$conversationId, $afterId]);
        } else {
            $stmt = $this->db->prepare("
                SELECT id, conversation_id, sender_id, body, created_at
                FROM messages
                WHERE conversation_id = ?
                ORDER BY id ASC
                LIMIT 200
            ");
            $stmt->execute([$conversationId]);
        }

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if ($markRead) {
            $latestId = $this->latestMessageId($conversationId);
            if ($latestId > 0) {
                $this->markRead($conversationId, $userId, $latestId);
            }
        }

        return array_map(static function (array $row): array {
            return [
                'id' => (int) $row['id'],
                'conversation_id' => (int) $row['conversation_id'],
                'sender_id' => (int) $row['sender_id'],
                'body' => $row['body'],
                'created_at' => $row['created_at'],
            ];
        }, $rows);
    }

    public function markRead(int $conversationId, int $userId, ?int $messageId = null): array {
        $this->getConversationForUser($conversationId, $userId);

        $targetId = $messageId;
        if ($targetId === null || $targetId <= 0) {
            $targetId = $this->latestMessageId($conversationId);
        }

        if ($targetId < 0) {
            $targetId = 0;
        }

        $stmt = $this->db->prepare("
            INSERT INTO conversation_reads (conversation_id, user_id, last_read_message_id)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE
                last_read_message_id = GREATEST(last_read_message_id, VALUES(last_read_message_id)),
                updated_at = CURRENT_TIMESTAMP
        ");
        $stmt->execute([$conversationId, $userId, $targetId]);

        return [
            'conversation_id' => $conversationId,
            'last_read_message_id' => $targetId,
            'unread_count' => 0,
        ];
    }

    public function sendMessage(int $conversationId, int $senderId, string $body): array {
        $this->getConversationForUser($conversationId, $senderId);

        $body = trim($body);
        if ($body === '') {
            throw new InvalidArgumentException('Az üzenet nem lehet üres!');
        }

        if (mb_strlen($body) > 2000) {
            throw new InvalidArgumentException('Az üzenet legfeljebb 2000 karakter lehet!');
        }

        $stmt = $this->db->prepare("
            INSERT INTO messages (conversation_id, sender_id, body)
            VALUES (?, ?, ?)
        ");
        $stmt->execute([$conversationId, $senderId, $body]);
        $messageId = (int) $this->db->lastInsertId();

        $touch = $this->db->prepare("
            UPDATE conversations
            SET updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ");
        $touch->execute([$conversationId]);

        // A küldő saját üzenetét azonnal olvasottnak jelöljük.
        $this->markRead($conversationId, $senderId, $messageId);

        $fetch = $this->db->prepare("
            SELECT id, conversation_id, sender_id, body, created_at
            FROM messages
            WHERE id = ?
        ");
        $fetch->execute([$messageId]);
        $row = $fetch->fetch(PDO::FETCH_ASSOC);

        return [
            'id' => (int) $row['id'],
            'conversation_id' => (int) $row['conversation_id'],
            'sender_id' => (int) $row['sender_id'],
            'body' => $row['body'],
            'created_at' => $row['created_at'],
        ];
    }

    private function latestMessageId(int $conversationId): int {
        $stmt = $this->db->prepare("
            SELECT MAX(id) AS max_id
            FROM messages
            WHERE conversation_id = ?
        ");
        $stmt->execute([$conversationId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return (int) ($row['max_id'] ?? 0);
    }
}
