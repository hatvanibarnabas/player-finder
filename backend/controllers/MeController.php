<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/Auth.php';
require_once __DIR__ . '/../services/RiotApiClient.php';

class MeController {
    private PDO $db;
    private RiotApiClient $riot;

    public function __construct() {
        $database = new Database();
        $this->db = $database->connect();
        $this->riot = new RiotApiClient();
    }

    public function show(): void {
        $userId = AuthMiddleware::requireUserId();
        $user = $this->fetchUser($userId);

        if (!$user) {
            http_response_code(404);
            echo json_encode(['error' => 'Felhasználó nem található!']);
            return;
        }

        echo json_encode(['user' => $this->publicUser($user)]);
    }

    public function linkRiot(): void {
        $userId = AuthMiddleware::requireUserId();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $riotId = trim($data['riot_id'] ?? '');
        if ($riotId === '' && !empty($data['name']) && !empty($data['tag'])) {
            $riotId = trim($data['name']) . '#' . trim($data['tag']);
        }

        $parts = explode('#', $riotId);
        if (count($parts) !== 2 || trim($parts[0]) === '' || trim($parts[1]) === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Használj "Név#TAG" formátumot!']);
            return;
        }

        $name = trim($parts[0]);
        $tag  = trim($parts[1]);

        $account = $this->riot->getAccountByRiotId($name, $tag);
        if ($account === null) {
            $this->riot->emitLastError();
            return;
        }

        $puuid = $account['puuid'] ?? '';
        if ($puuid === '') {
            http_response_code(502);
            echo json_encode(['error' => 'A Riot válasz nem tartalmazott PUUID-t!']);
            return;
        }

        $gameName = $account['gameName'] ?? $name;
        $tagLine  = $account['tagLine'] ?? $tag;

        $taken = $this->db->prepare("
            SELECT id, username FROM users
            WHERE riot_puuid = ? AND id <> ?
            LIMIT 1
        ");
        $taken->execute([$puuid, $userId]);
        $other = $taken->fetch(PDO::FETCH_ASSOC);
        if ($other) {
            http_response_code(409);
            echo json_encode([
                'error' => 'Ez a Riot fiók már hozzá van kapcsolva egy másik felhasználóhoz!',
            ]);
            return;
        }

        $stmt = $this->db->prepare("
            UPDATE users
            SET riot_name = ?, riot_tag = ?, riot_puuid = ?
            WHERE id = ?
        ");
        $stmt->execute([$gameName, $tagLine, $puuid, $userId]);

        $user = $this->fetchUser($userId);
        echo json_encode([
            'message' => 'Riot fiók sikeresen hozzákapcsolva!',
            'user'    => $this->publicUser($user),
        ]);
    }

    public function unlinkRiot(): void {
        $userId = AuthMiddleware::requireUserId();

        $stmt = $this->db->prepare("
            UPDATE users
            SET riot_name = NULL, riot_tag = NULL, riot_puuid = NULL
            WHERE id = ?
        ");
        $stmt->execute([$userId]);

        $user = $this->fetchUser($userId);
        echo json_encode([
            'message' => 'Riot fiók leválasztva.',
            'user'    => $this->publicUser($user),
        ]);
    }

    private function fetchUser(int $userId): ?array {
        $stmt = $this->db->prepare("
            SELECT id, username, email, riot_name, riot_tag, riot_puuid, created_at
            FROM users
            WHERE id = ?
        ");
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ?: null;
    }

    private function publicUser(?array $user): ?array {
        if (!$user) {
            return null;
        }

        return [
            'id'       => (int) $user['id'],
            'username' => $user['username'],
            'email'    => $user['email'],
            'riot'     => $user['riot_puuid']
                ? [
                    'name' => $user['riot_name'],
                    'tag'  => $user['riot_tag'],
                ]
                : null,
        ];
    }
}
