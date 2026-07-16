<?php

class AuthMiddleware {
    private const SECRET = 'your-secret-key-change-this';

    public static function getUserIdFromRequest(): ?int {
        $header = self::getAuthorizationHeader();
        if (!str_starts_with($header, 'Bearer ')) {
            return null;
        }

        $token = trim(substr($header, 7));
        if ($token === '') {
            return null;
        }

        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$headerB64, $payloadB64, $signatureB64] = $parts;
        $expected = base64_encode(
            hash_hmac('sha256', "$headerB64.$payloadB64", self::SECRET, true)
        );

        if (!hash_equals($expected, $signatureB64)) {
            return null;
        }

        $payload = json_decode(base64_decode($payloadB64), true);
        if (!is_array($payload)) {
            return null;
        }

        if (($payload['exp'] ?? 0) < time()) {
            return null;
        }

        return isset($payload['sub']) ? (int) $payload['sub'] : null;
    }

    public static function requireUserId(): int {
        $userId = self::getUserIdFromRequest();
        if (!$userId) {
            http_response_code(401);
            echo json_encode(['error' => 'Bejelentkezés szükséges!']);
            exit;
        }

        return $userId;
    }

    private static function getAuthorizationHeader(): string {
        if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
            return $_SERVER['HTTP_AUTHORIZATION'];
        }

        if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            return $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }

        if (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            foreach ($headers as $key => $value) {
                if (strtolower($key) === 'authorization') {
                    return $value;
                }
            }
        }

        return '';
    }
}
