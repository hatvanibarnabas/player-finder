<?php

require_once __DIR__ . '/../middleware/Auth.php';
require_once __DIR__ . '/../services/ScoreService.php';
require_once __DIR__ . '/../services/FriendService.php';
require_once __DIR__ . '/../services/RiotApiClient.php';

class SearchController {
    private RiotApiClient $riot;
    private ScoreService $scores;
    private FriendService $friends;

    public function __construct() {
        $this->riot = new RiotApiClient();
        $this->scores = new ScoreService();
        $this->friends = new FriendService();
    }

    public function search(): void {
        $game = $_GET['game'] ?? '';
        $name = $_GET['name'] ?? '';
        $tag  = $_GET['tag']  ?? '';

        if (!$game || !$name || !$tag) {
            http_response_code(400);
            echo json_encode(['error' => 'Hiányzó paraméterek! (game, name, tag)']);
            return;
        }

        $result = match ($game) {
            'lol'               => $this->searchLoL($name, $tag),
            'teamfight-tactics' => $this->searchTFT($name, $tag),
            default             => null,
        };

        if ($result === null) {
            $this->notFound("Ismeretlen játék: $game");
            return;
        }

        if ($result === false) {
            $this->riot->emitLastError();
            return;
        }

        $userId = AuthMiddleware::getUserIdFromRequest();
        $result['scorecard'] = $this->scores->getScorecard(
            $game,
            $result['name'],
            $result['tag'],
            $userId
        );

        $puuid = $result['puuid'] ?? null;
        unset($result['puuid']);

        $result['linked_user'] = null;
        $result['friendship'] = null;

        if ($puuid) {
            $linked = $this->friends->getLinkedUserByPuuid($puuid);
            if ($linked) {
                $result['linked_user'] = [
                    'id'        => (int) $linked['id'],
                    'username'  => $linked['username'],
                    'riot_name' => $linked['riot_name'],
                    'riot_tag'  => $linked['riot_tag'],
                ];

                if ($userId) {
                    $result['friendship'] = $this->friends->getFriendshipStatus(
                        $userId,
                        (int) $linked['id']
                    );
                }
            }
        }

        echo json_encode($result);
    }

    private function searchLoL(string $name, string $tag): array|false {
        $account = $this->riot->getAccountByRiotId(
            urldecode($name),
            urldecode($tag)
        );

        if (!$account) {
            return false;
        }

        $puuid = $account['puuid'];
        $summoner = $this->riot->request(
            "https://eun1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/{$puuid}"
        );

        if (!$summoner) {
            return false;
        }

        $ranks = $this->riot->request(
            "https://eun1.api.riotgames.com/lol/league/v4/entries/by-puuid/{$puuid}"
        );

        return [
            'game'    => 'League of Legends',
            'name'    => $account['gameName'],
            'tag'     => $account['tagLine'],
            'puuid'   => $puuid,
            'level'   => $summoner['summonerLevel'],
            'icon_id' => $summoner['profileIconId'],
            'ranks'   => $this->formatLoLRanks(is_array($ranks) ? $ranks : []),
        ];
    }

    private function formatLoLRanks(array $ranks): array {
        $result = [];
        foreach ($ranks as $rank) {
            $wins = (int) ($rank['wins'] ?? 0);
            $losses = (int) ($rank['losses'] ?? 0);
            $total = $wins + $losses;
            $result[] = [
                'queue'   => $this->formatQueue($rank['queueType'] ?? ''),
                'tier'    => $rank['tier'] ?? '',
                'rank'    => $rank['rank'] ?? '',
                'lp'      => $rank['leaguePoints'] ?? 0,
                'wins'    => $wins,
                'losses'  => $losses,
                'winrate' => ($total > 0 ? round($wins / $total * 100) : 0) . '%',
            ];
        }
        return $result;
    }

    private function formatQueue(string $queue): string {
        return match ($queue) {
            'RANKED_SOLO_5x5' => 'Ranked Solo/Duo',
            'RANKED_FLEX_SR'  => 'Ranked Flex',
            default           => $queue,
        };
    }

    private function searchTFT(string $name, string $tag): array|false {
        $account = $this->riot->getAccountByRiotId(
            urldecode($name),
            urldecode($tag)
        );

        if (!$account) {
            return false;
        }

        $puuid = $account['puuid'];

        $summoner = $this->riot->request(
            "https://eun1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/{$puuid}"
        );
        if (!$summoner) {
            return false;
        }

        $tftRanks = $this->riot->request(
            "https://eun1.api.riotgames.com/tft/league/v1/by-puuid/{$puuid}"
        );

        return [
            'game'    => 'Teamfight Tactics',
            'name'    => $account['gameName'],
            'tag'     => $account['tagLine'],
            'puuid'   => $puuid,
            'level'   => $summoner['summonerLevel'],
            'icon_id' => $summoner['profileIconId'],
            'ranks'   => $this->formatTFTRanks(is_array($tftRanks) ? $tftRanks : []),
        ];
    }

    private function formatTFTRanks(array $ranks): array {
        $result = [];
        foreach ($ranks as $rank) {
            $wins = (int) ($rank['wins'] ?? 0);
            $losses = (int) ($rank['losses'] ?? 0);
            $total = $wins + $losses;
            $result[] = [
                'queue'   => $this->formatTFTQueue($rank['queueType'] ?? ''),
                'tier'    => $rank['tier'] ?? '',
                'rank'    => $rank['rank'] ?? '',
                'lp'      => $rank['leaguePoints'] ?? 0,
                'wins'    => $wins,
                'losses'  => $losses,
                'winrate' => ($total > 0 ? round($wins / $total * 100) : 0) . '%',
            ];
        }
        return $result;
    }

    private function formatTFTQueue(string $queue): string {
        return match ($queue) {
            'RANKED_TFT'           => 'Ranked TFT',
            'RANKED_TFT_TURBO'     => 'Hyper Roll',
            'RANKED_TFT_DOUBLE_UP' => 'Double Up',
            default                => $queue,
        };
    }

    private function notFound(string $msg): void {
        http_response_code(404);
        echo json_encode(['error' => $msg]);
    }
}
