<?php
require_once __DIR__ . '/../config/database.php';

class SearchController {

    private string $riotApiKey;

    public function __construct() {
        $this->riotApiKey = getenv('RIOT_API_KEY') ?: $_ENV['RIOT_API_KEY'] ?? $_SERVER['RIOT_API_KEY'] ?? '';
    }

    public function search(): void {
        $game     = $_GET['game'] ?? '';
        $name     = $_GET['name'] ?? '';
        $tag      = $_GET['tag']  ?? '';

        if (!$game || !$name || !$tag) {
            http_response_code(400);
            echo json_encode(['error' => 'Hiányzó paraméterek! (game, name, tag)']);
            return;
        }

        match($game) {
            'lol'               => $this->searchLoL($name, $tag),
            'teamfight-tactics' => $this->searchTFT($name, $tag),
            default             => $this->notFound("Ismeretlen játék: $game")
        };
    }

    // ─── League of Legends ───────────────────────────────────────

    private function searchLoL(string $name, string $tag): void {
        $encodedName = rawurlencode(urldecode($name));
        $encodedTag  = rawurlencode(urldecode($tag));
    
        // 1. PUUID lekérés
        $account = $this->riotRequest(
            "https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{$encodedName}/{$encodedTag}"
        );
        if (!$account) return;
    
        $puuid = $account['puuid'];
    
        // 2. Summoner adatok
        $summoner = $this->riotRequest(
            "https://eun1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/{$puuid}"
        );
        if (!$summoner) return;
    
        // 3. Rank adatok PUUID alapján
        $ranks = $this->riotRequest(
            "https://eun1.api.riotgames.com/lol/league/v4/entries/by-puuid/{$puuid}"
        ) ?? [];
    
        echo json_encode([
            'game'    => 'League of Legends',
            'name'    => $account['gameName'],
            'tag'     => $account['tagLine'],
            'level'   => $summoner['summonerLevel'],
            'icon_id' => $summoner['profileIconId'],
            'ranks'   => $this->formatLoLRanks(is_array($ranks) ? $ranks : []),
        ]);
    }

    private function formatLoLRanks(array $ranks): array {
        $result = [];
        foreach ($ranks as $rank) {
            $result[] = [
                'queue'   => $this->formatQueue($rank['queueType']),
                'tier'    => $rank['tier'],
                'rank'    => $rank['rank'],
                'lp'      => $rank['leaguePoints'],
                'wins'    => $rank['wins'],
                'losses'  => $rank['losses'],
                'winrate' => round($rank['wins'] / ($rank['wins'] + $rank['losses']) * 100) . '%',
            ];
        }
        return $result;
    }

    private function formatQueue(string $queue): string {
        return match($queue) {
            'RANKED_SOLO_5x5' => 'Ranked Solo/Duo',
            'RANKED_FLEX_SR'  => 'Ranked Flex',
            default           => $queue
        };
    }

    // ─── Teamfight Tactics ───────────────────────────────────────

    private function searchTFT(string $name, string $tag): void {
        $encodedName = rawurlencode(urldecode($name));
        $encodedTag  = rawurlencode(urldecode($tag));

        $account = $this->riotRequest(
            "https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{$encodedName}/{$encodedTag}"
        );
        if (!$account) return;

        $puuid = $account['puuid'];

        $summoner = $this->riotRequest(
            "https://eun1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/{$puuid}"
        );
        if (!$summoner) return;

        $tftRanks = $this->riotRequest(
            "https://eun1.api.riotgames.com/tft/league/v1/by-puuid/{$puuid}"
        ) ?? [];

        echo json_encode([
            'game'    => 'Teamfight Tactics',
            'name'    => $account['gameName'],
            'tag'     => $account['tagLine'],
            'level'   => $summoner['summonerLevel'],
            'icon_id' => $summoner['profileIconId'],
            'ranks'   => $this->formatTFTRanks($tftRanks),
        ]);
    }

    private function formatTFTRanks(array $ranks): array {
        $result = [];
        foreach ($ranks as $rank) {
            $result[] = [
                'queue'   => $this->formatTFTQueue($rank['queueType']),
                'tier'    => $rank['tier'],
                'rank'    => $rank['rank'],
                'lp'      => $rank['leaguePoints'],
                'wins'    => $rank['wins'],
                'losses'  => $rank['losses'],
                'winrate' => round($rank['wins'] / ($rank['wins'] + $rank['losses']) * 100) . '%',
            ];
        }
        return $result;
    }

    private function formatTFTQueue(string $queue): string {
        return match($queue) {
            'RANKED_TFT'           => 'Ranked TFT',
            'RANKED_TFT_TURBO'     => 'Hyper Roll',
            'RANKED_TFT_DOUBLE_UP' => 'Double Up',
            default                => $queue
        };
    }

    // ─── Segédfüggvények ─────────────────────────────────────────

    private function riotRequest(string $url): ?array {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_TIMEOUT        => 10,
            CURLOPT_HTTPHEADER     => ["X-Riot-Token: {$this->riotApiKey}"],
        ]);
    
        $response  = curl_exec($ch);
        $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
    
        if ($httpCode !== 200) {
            http_response_code($httpCode);
            echo json_encode(['error' => $this->riotError($httpCode)]);
            return null;
        }
    
        return json_decode($response, true);
    }

    private function riotError(int $code): string {
        return match($code) {
            400 => 'Hibás kérés!',
            401 => 'Érvénytelen API kulcs!',
            403 => 'Hozzáférés megtagadva!',
            404 => 'Játékos nem található!',
            429 => 'Túl sok kérés, próbáld újra később!',
            500 => 'Riot API szerver hiba!',
            default => "Ismeretlen hiba: $code"
        };
    }

    private function notFound(string $msg): void {
        http_response_code(404);
        echo json_encode(['error' => $msg]);
    }
}