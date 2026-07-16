<?php
require_once __DIR__ . '/../middleware/Auth.php';
require_once __DIR__ . '/../services/ScoreService.php';

class ScoreController {
    private ScoreService $scores;

    public function __construct() {
        $this->scores = new ScoreService();
    }

    public function submit(): void {
        $userId = AuthMiddleware::requireUserId();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $game = trim($data['game'] ?? '');
        $name = trim($data['name'] ?? '');
        $tag  = trim($data['tag'] ?? '');

        if (!$game || !$name || !$tag) {
            http_response_code(400);
            echo json_encode(['error' => 'Hiányzó paraméterek! (game, name, tag)']);
            return;
        }

        if (!in_array($game, ['lol', 'teamfight-tactics'], true)) {
            http_response_code(400);
            echo json_encode(['error' => 'Ismeretlen játék!']);
            return;
        }

        try {
            $scorecard = $this->scores->submitScore(
                $game,
                $name,
                $tag,
                $userId,
                $data,
                $data['comment'] ?? null
            );

            echo json_encode([
                'message'   => 'Értékelés mentve!',
                'scorecard' => $scorecard,
            ]);
        } catch (InvalidArgumentException $e) {
            http_response_code(400);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}
