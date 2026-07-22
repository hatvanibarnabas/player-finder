<?php

class RiotApiClient {
    private string $apiKey;
    private ?int $lastHttpCode = null;
    private ?string $lastError = null;

    public function __construct(?string $apiKey = null) {
        $this->apiKey = $apiKey
            ?? (getenv('RIOT_API_KEY') ?: null)
            ?? ($_ENV['RIOT_API_KEY'] ?? null)
            ?? ($_SERVER['RIOT_API_KEY'] ?? null)
            ?? '';
    }

    public function getAccountByRiotId(string $name, string $tag): ?array {
        $encodedName = rawurlencode($name);
        $encodedTag  = rawurlencode($tag);

        return $this->request(
            "https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{$encodedName}/{$encodedTag}"
        );
    }

    public function request(string $url): ?array {
        $this->lastHttpCode = null;
        $this->lastError = null;

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_TIMEOUT        => 10,
            CURLOPT_HTTPHEADER     => ["X-Riot-Token: {$this->apiKey}"],
        ]);
        $response = curl_exec($ch);
        $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $this->lastHttpCode = $httpCode;

        if ($httpCode !== 200) {
            $this->lastError = $this->errorMessage($httpCode);
            return null;
        }

        $decoded = json_decode($response, true);
        return is_array($decoded) ? $decoded : null;
    }

    public function emitLastError(): void {
        $code = $this->lastHttpCode ?? 500;
        http_response_code($code);
        echo json_encode(['error' => $this->lastError ?? $this->errorMessage($code)]);
    }

    public function errorMessage(int $code): string {
        return match ($code) {
            400 => 'Hibás kérés!',
            401 => 'Érvénytelen API kulcs!',
            403 => 'Hozzáférés megtagadva!',
            404 => 'Játékos nem található!',
            429 => 'Túl sok kérés, próbáld újra később!',
            500 => 'Riot API szerver hiba!',
            default => "Ismeretlen hiba: $code",
        };
    }
}
