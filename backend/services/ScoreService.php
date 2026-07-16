<?php
require_once __DIR__ . '/../config/database.php';

class ScoreService {
    private PDO $db;

    private const TRAITS = [
        'skill'         => ['label' => 'Játéktudás',    'icon' => '⚔️', 'weight' => 0.10],
        'teamwork'      => ['label' => 'Csapatmunka',   'icon' => '🤝', 'weight' => 0.25],
        'communication' => ['label' => 'Kommunikáció',  'icon' => '💬', 'weight' => 0.20],
        'reliability'   => ['label' => 'Megbízhatóság', 'icon' => '🎯', 'weight' => 0.30],
        'attitude'      => ['label' => 'Mentalitás',    'icon' => '🧠', 'weight' => 0.15],
    ];

    public function __construct() {
        $database = new Database();
        $this->db = $database->connect();
    }

    public function getScorecard(string $game, string $name, string $tag, ?int $userId = null): array {
        $playerId = $this->findPlayerId($game, $name, $tag);

        if (!$playerId) {
            return $this->emptyScorecard($userId);
        }

        $stmt = $this->db->prepare("
            SELECT
                ROUND(AVG(skill), 1) AS skill,
                ROUND(AVG(teamwork), 1) AS teamwork,
                ROUND(AVG(communication), 1) AS communication,
                ROUND(AVG(reliability), 1) AS reliability,
                ROUND(AVG(attitude), 1) AS attitude,
                COUNT(*) AS rating_count
            FROM player_scores
            WHERE player_id = ?
        ");
        $stmt->execute([$playerId]);
        $aggregates = $stmt->fetch(PDO::FETCH_ASSOC);

        $ratingCount = (int) ($aggregates['rating_count'] ?? 0);
        if ($ratingCount === 0) {
            return $this->emptyScorecard($userId, $playerId);
        }

        $traits = [];
        $weightedSum = 0.0;

        foreach (self::TRAITS as $key => $meta) {
            $avg = (float) $aggregates[$key];
            $traits[$key] = [
                'label' => $meta['label'],
                'icon'  => $meta['icon'],
                'avg'   => $avg,
                'stars' => round($avg),
            ];
            $weightedSum += $avg * $meta['weight'];
        }

        $trustScore = (int) round($weightedSum * 20);
        $badge = $this->resolveBadge($trustScore);

        $userRating = null;
        if ($userId) {
            $userRating = $this->getUserRating($playerId, $userId);
        }

        return [
            'trust_score'  => $trustScore,
            'badge'        => $badge,
            'rating_count' => $ratingCount,
            'traits'       => $traits,
            'user_rating'  => $userRating,
        ];
    }

    public function submitScore(
        string $game,
        string $name,
        string $tag,
        int $userId,
        array $scores,
        ?string $comment = null
    ): array {
        $playerId = $this->ensurePlayer($game, $name, $tag);

        $values = [];
        foreach (array_keys(self::TRAITS) as $trait) {
            $value = (int) ($scores[$trait] ?? 0);
            if ($value < 1 || $value > 5) {
                throw new InvalidArgumentException("Érvénytelen érték: $trait");
            }
            $values[$trait] = $value;
        }

        $comment = $comment !== null ? trim($comment) : null;
        if ($comment === '') {
            $comment = null;
        }

        $stmt = $this->db->prepare("
            INSERT INTO player_scores
                (player_id, user_id, skill, teamwork, communication, reliability, attitude, comment)
            VALUES
                (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                skill = VALUES(skill),
                teamwork = VALUES(teamwork),
                communication = VALUES(communication),
                reliability = VALUES(reliability),
                attitude = VALUES(attitude),
                comment = VALUES(comment),
                updated_at = CURRENT_TIMESTAMP
        ");

        $stmt->execute([
            $playerId,
            $userId,
            $values['skill'],
            $values['teamwork'],
            $values['communication'],
            $values['reliability'],
            $values['attitude'],
            $comment,
        ]);

        return $this->getScorecard($game, $name, $tag, $userId);
    }

    private function ensurePlayer(string $game, string $name, string $tag): int {
        $existing = $this->findPlayerId($game, $name, $tag);
        if ($existing) {
            return $existing;
        }

        $stmt = $this->db->prepare("
            INSERT INTO players (game, riot_name, riot_tag)
            VALUES (?, ?, ?)
        ");
        $stmt->execute([$game, $name, $tag]);

        return (int) $this->db->lastInsertId();
    }

    private function findPlayerId(string $game, string $name, string $tag): ?int {
        $stmt = $this->db->prepare("
            SELECT id FROM players
            WHERE game = ? AND riot_name = ? AND riot_tag = ?
        ");
        $stmt->execute([$game, $name, $tag]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ? (int) $row['id'] : null;
    }

    private function getUserRating(int $playerId, int $userId): ?array {
        $stmt = $this->db->prepare("
            SELECT skill, teamwork, communication, reliability, attitude, comment
            FROM player_scores
            WHERE player_id = ? AND user_id = ?
        ");
        $stmt->execute([$playerId, $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return null;
        }

        return [
            'skill'         => (int) $row['skill'],
            'teamwork'      => (int) $row['teamwork'],
            'communication' => (int) $row['communication'],
            'reliability'   => (int) $row['reliability'],
            'attitude'      => (int) $row['attitude'],
            'comment'       => $row['comment'],
        ];
    }

    private function emptyScorecard(?int $userId, ?int $playerId = null): array {
        $traits = [];
        foreach (self::TRAITS as $key => $meta) {
            $traits[$key] = [
                'label' => $meta['label'],
                'icon'  => $meta['icon'],
                'avg'   => 0,
                'stars' => 0,
            ];
        }

        $userRating = null;
        if ($userId && $playerId) {
            $userRating = $this->getUserRating($playerId, $userId);
        }

        return [
            'trust_score'  => 0,
            'badge'        => [
                'label' => 'Még nincs értékelés',
                'emoji' => '🆕',
                'tier'  => 'none',
            ],
            'rating_count' => 0,
            'traits'       => $traits,
            'user_rating'  => $userRating,
        ];
    }

    private function resolveBadge(int $trustScore): array {
        return match (true) {
            $trustScore >= 85 => ['label' => 'Arany partner',  'emoji' => '🥇', 'tier' => 'gold'],
            $trustScore >= 70 => ['label' => 'Megbízható',     'emoji' => '✅', 'tier' => 'trusted'],
            $trustScore >= 55 => ['label' => 'Közepes',        'emoji' => '⚖️', 'tier' => 'average'],
            $trustScore >= 40 => ['label' => 'Vegyes',         'emoji' => '⚠️', 'tier' => 'mixed'],
            default           => ['label' => 'Óvatosság',      'emoji' => '🚨', 'tier' => 'caution'],
        };
    }
}
