<?php
require_once __DIR__ . '/../config/database.php';

class FriendService {
    private PDO $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->connect();
    }

    public function getLinkedUserByPuuid(string $puuid): ?array {
        $stmt = $this->db->prepare("
            SELECT id, username, riot_name, riot_tag
            FROM users
            WHERE riot_puuid = ?
            LIMIT 1
        ");
        $stmt->execute([$puuid]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ?: null;
    }

    public function getFriendshipStatus(int $viewerId, int $otherUserId): array {
        if ($viewerId === $otherUserId) {
            return [
                'status' => 'self',
                'friendship_id' => null,
            ];
        }

        $stmt = $this->db->prepare("
            SELECT id, requester_id, addressee_id, status
            FROM friendships
            WHERE
                (requester_id = ? AND addressee_id = ?)
                OR (requester_id = ? AND addressee_id = ?)
            ORDER BY
                FIELD(status, 'accepted', 'pending', 'rejected'),
                updated_at DESC
            LIMIT 1
        ");
        $stmt->execute([$viewerId, $otherUserId, $otherUserId, $viewerId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return [
                'status' => 'none',
                'friendship_id' => null,
            ];
        }

        $status = $row['status'];
        if ($status === 'accepted') {
            return [
                'status' => 'friends',
                'friendship_id' => (int) $row['id'],
            ];
        }

        if ($status === 'pending') {
            $direction = ((int) $row['requester_id'] === $viewerId)
                ? 'pending_sent'
                : 'pending_received';

            return [
                'status' => $direction,
                'friendship_id' => (int) $row['id'],
            ];
        }

        return [
            'status' => 'none',
            'friendship_id' => (int) $row['id'],
        ];
    }

    public function sendRequest(int $requesterId, int $addresseeId): array {
        if ($requesterId === $addresseeId) {
            throw new InvalidArgumentException('Saját magadat nem jelölheted be!');
        }

        if (!$this->userExists($addresseeId)) {
            throw new InvalidArgumentException('A felhasználó nem található!');
        }

        $existing = $this->findPair($requesterId, $addresseeId);
        if ($existing) {
            if ($existing['status'] === 'accepted') {
                throw new InvalidArgumentException('Már barátok vagytok!');
            }

            if ($existing['status'] === 'pending') {
                throw new InvalidArgumentException('Már van függőben lévő jelölés!');
            }

            // rejected → újra pending, requester mindig az aktuális küldő
            $stmt = $this->db->prepare("
                UPDATE friendships
                SET requester_id = ?, addressee_id = ?, status = 'pending', updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ");
            $stmt->execute([$requesterId, $addresseeId, $existing['id']]);

            return $this->formatFriendship((int) $existing['id']);
        }

        $stmt = $this->db->prepare("
            INSERT INTO friendships (requester_id, addressee_id, status)
            VALUES (?, ?, 'pending')
        ");
        $stmt->execute([$requesterId, $addresseeId]);

        return $this->formatFriendship((int) $this->db->lastInsertId());
    }

    public function respond(int $userId, int $friendshipId, string $action): array {
        if (!in_array($action, ['accept', 'reject'], true)) {
            throw new InvalidArgumentException('Érvénytelen művelet!');
        }

        $stmt = $this->db->prepare("
            SELECT id, requester_id, addressee_id, status
            FROM friendships
            WHERE id = ?
            LIMIT 1
        ");
        $stmt->execute([$friendshipId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            throw new InvalidArgumentException('A jelölés nem található!');
        }

        if ((int) $row['addressee_id'] !== $userId) {
            throw new InvalidArgumentException('Csak a címzett válaszolhat a jelölésre!');
        }

        if ($row['status'] !== 'pending') {
            throw new InvalidArgumentException('Ez a jelölés már nincs függőben!');
        }

        $newStatus = $action === 'accept' ? 'accepted' : 'rejected';
        $update = $this->db->prepare("
            UPDATE friendships
            SET status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ");
        $update->execute([$newStatus, $friendshipId]);

        return $this->formatFriendship($friendshipId);
    }

    public function remove(int $userId, int $friendshipId): void {
        $stmt = $this->db->prepare("
            SELECT id, requester_id, addressee_id, status
            FROM friendships
            WHERE id = ?
            LIMIT 1
        ");
        $stmt->execute([$friendshipId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            throw new InvalidArgumentException('A kapcsolat nem található!');
        }

        $isParticipant =
            (int) $row['requester_id'] === $userId
            || (int) $row['addressee_id'] === $userId;

        if (!$isParticipant) {
            throw new InvalidArgumentException('Nincs jogosultságod ehhez a kapcsolathoz!');
        }

        $delete = $this->db->prepare("DELETE FROM friendships WHERE id = ?");
        $delete->execute([$friendshipId]);
    }

    public function listForUser(int $userId): array {
        $friends = $this->db->prepare("
            SELECT
                f.id AS friendship_id,
                f.updated_at,
                u.id AS user_id,
                u.username,
                u.riot_name,
                u.riot_tag
            FROM friendships f
            JOIN users u ON u.id = IF(f.requester_id = ?, f.addressee_id, f.requester_id)
            WHERE f.status = 'accepted'
              AND (f.requester_id = ? OR f.addressee_id = ?)
            ORDER BY u.username ASC
        ");
        $friends->execute([$userId, $userId, $userId]);

        $incoming = $this->db->prepare("
            SELECT
                f.id AS friendship_id,
                f.created_at,
                u.id AS user_id,
                u.username,
                u.riot_name,
                u.riot_tag
            FROM friendships f
            JOIN users u ON u.id = f.requester_id
            WHERE f.addressee_id = ? AND f.status = 'pending'
            ORDER BY f.created_at DESC
        ");
        $incoming->execute([$userId]);

        $outgoing = $this->db->prepare("
            SELECT
                f.id AS friendship_id,
                f.created_at,
                u.id AS user_id,
                u.username,
                u.riot_name,
                u.riot_tag
            FROM friendships f
            JOIN users u ON u.id = f.addressee_id
            WHERE f.requester_id = ? AND f.status = 'pending'
            ORDER BY f.created_at DESC
        ");
        $outgoing->execute([$userId]);

        return [
            'friends'  => array_map([$this, 'mapListedUser'], $friends->fetchAll(PDO::FETCH_ASSOC)),
            'incoming' => array_map([$this, 'mapListedUser'], $incoming->fetchAll(PDO::FETCH_ASSOC)),
            'outgoing' => array_map([$this, 'mapListedUser'], $outgoing->fetchAll(PDO::FETCH_ASSOC)),
        ];
    }

    private function mapListedUser(array $row): array {
        return [
            'friendship_id' => (int) $row['friendship_id'],
            'user' => [
                'id'        => (int) $row['user_id'],
                'username'  => $row['username'],
                'riot_name' => $row['riot_name'],
                'riot_tag'  => $row['riot_tag'],
            ],
            'created_at' => $row['created_at'] ?? $row['updated_at'] ?? null,
        ];
    }

    private function formatFriendship(int $id): array {
        $stmt = $this->db->prepare("
            SELECT id, requester_id, addressee_id, status, created_at, updated_at
            FROM friendships
            WHERE id = ?
        ");
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return [
            'id'           => (int) $row['id'],
            'requester_id' => (int) $row['requester_id'],
            'addressee_id' => (int) $row['addressee_id'],
            'status'       => $row['status'],
            'created_at'   => $row['created_at'],
            'updated_at'   => $row['updated_at'],
        ];
    }

    private function findPair(int $userA, int $userB): ?array {
        $stmt = $this->db->prepare("
            SELECT id, requester_id, addressee_id, status
            FROM friendships
            WHERE
                (requester_id = ? AND addressee_id = ?)
                OR (requester_id = ? AND addressee_id = ?)
            LIMIT 1
        ");
        $stmt->execute([$userA, $userB, $userB, $userA]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ?: null;
    }

    private function userExists(int $userId): bool {
        $stmt = $this->db->prepare("SELECT id FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        return (bool) $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
