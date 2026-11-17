<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/MailService.php';

class AuthController {
    private PDO $db;
    private MailService $mail;

    public function __construct() {
        $database   = new Database();
        $this->db   = $database->connect();
        $this->mail = new MailService();
    }

    public function register(): void {
        $data = json_decode(file_get_contents("php://input"), true);

        $username = trim($data['username'] ?? '');
        $email    = trim($data['email']    ?? '');
        $password =      $data['password'] ?? '';

        if (!$username || !$email || !$password) {
            http_response_code(400);
            echo json_encode(['error' => 'Minden mező kitöltése kötelező!']);
            return;
        }

        // Ellenőrizzük hogy létezik-e már
        $stmt = $this->db->prepare("SELECT id FROM users WHERE email = ? OR username = ?");
        $stmt->execute([$email, $username]);

        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => 'Ez az email vagy felhasználónév már foglalt!']);
            return;
        }

        $hashed = password_hash($password, PASSWORD_BCRYPT);

        $stmt = $this->db->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
        $stmt->execute([$username, $email, $hashed]);

        http_response_code(201);
        echo json_encode(['message' => 'Sikeres regisztráció!']);
    }

    public function login(): void {
        $data = json_decode(file_get_contents("php://input"), true);

        $email    = trim($data['email']    ?? '');
        $password =      $data['password'] ?? '';

        if (!$email || !$password) {
            http_response_code(400);
            echo json_encode(['error' => 'Email és jelszó megadása kötelező!']);
            return;
        }

        $stmt = $this->db->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || !password_verify($password, $user['password'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Hibás email vagy jelszó!']);
            return;
        }

        // JWT token generálás
        $token = $this->generateJWT($user['id'], $user['username']);

        echo json_encode([
            'token'    => $token,
            'user'     => [
                'id'       => (int) $user['id'],
                'username' => $user['username'],
                'email'    => $user['email'],
                'riot'     => !empty($user['riot_puuid'])
                    ? [
                        'name' => $user['riot_name'],
                        'tag'  => $user['riot_tag'],
                    ]
                    : null,
            ]
        ]);
    }

    public function forgotPassword(): void {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $email = strtolower(trim($data['email'] ?? ''));

        $generic = [
            'message' => 'Ha ez az email regisztrálva van, küldtünk egy jelszó-visszaállító linket.',
        ];

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['error' => 'Érvényes email cím megadása kötelező!']);
            return;
        }

        $stmt = $this->db->prepare('SELECT id, username, email FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            echo json_encode($generic);
            return;
        }

        $rawToken = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $rawToken);
        $expiresAt = (new DateTimeImmutable('+1 hour'))->format('Y-m-d H:i:s');

        $this->db->prepare('DELETE FROM password_resets WHERE user_id = ?')->execute([(int) $user['id']]);

        $insert = $this->db->prepare('
            INSERT INTO password_resets (user_id, token_hash, expires_at)
            VALUES (?, ?, ?)
        ');
        $insert->execute([(int) $user['id'], $tokenHash, $expiresAt]);

        $frontendUrl = rtrim(
            getenv('FRONTEND_URL') ?: ($_ENV['FRONTEND_URL'] ?? 'http://localhost:3000'),
            '/'
        );
        $resetUrl = $frontendUrl . '/reset-password?token=' . urlencode($rawToken);

        $subject = 'PlayerFinder — jelszó visszaállítás';
        $body = "Szia {$user['username']}!\n\n"
            . "Jelszó-visszaállítást kértél a PlayerFinder fiókodhoz.\n"
            . "A link 1 óráig érvényes:\n\n"
            . "{$resetUrl}\n\n"
            . "Ha nem te kérted, hagyd figyelmen kívül ezt az emailt.\n";

        try {
            $this->mail->send($user['email'], $subject, $body);
        } catch (Throwable $e) {
            error_log('Password reset email hiba: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Nem sikerült elküldeni az emailt. Próbáld újra később.']);
            return;
        }

        $response = $generic;
        $mailDriver = strtolower(trim((string) (getenv('MAIL_DRIVER') ?: ($_ENV['MAIL_DRIVER'] ?? 'log'))));
        if ($mailDriver === '' || $mailDriver === 'log') {
            $response['debug_reset_url'] = $resetUrl;
        }

        echo json_encode($response);
    }

    public function resetPassword(): void {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $token = trim($data['token'] ?? '');
        $password = $data['password'] ?? '';

        if ($token === '' || $password === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Token és új jelszó megadása kötelező!']);
            return;
        }

        if (strlen($password) < 6) {
            http_response_code(400);
            echo json_encode(['error' => 'A jelszónak legalább 6 karakternek kell lennie!']);
            return;
        }

        $tokenHash = hash('sha256', $token);
        $stmt = $this->db->prepare('
            SELECT id, user_id, expires_at, used_at
            FROM password_resets
            WHERE token_hash = ?
            LIMIT 1
        ');
        $stmt->execute([$tokenHash]);
        $reset = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$reset || $reset['used_at'] !== null) {
            http_response_code(400);
            echo json_encode(['error' => 'Érvénytelen vagy már felhasznált visszaállító link.']);
            return;
        }

        if (strtotime($reset['expires_at']) < time()) {
            http_response_code(400);
            echo json_encode(['error' => 'A visszaállító link lejárt. Kérj újat.']);
            return;
        }

        $hashed = password_hash($password, PASSWORD_BCRYPT);

        $this->db->beginTransaction();
        try {
            $updateUser = $this->db->prepare('UPDATE users SET password = ? WHERE id = ?');
            $updateUser->execute([$hashed, (int) $reset['user_id']]);

            $markUsed = $this->db->prepare('
                UPDATE password_resets
                SET used_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ');
            $markUsed->execute([(int) $reset['id']]);

            $this->db->prepare('DELETE FROM password_resets WHERE user_id = ? AND id <> ?')
                ->execute([(int) $reset['user_id'], (int) $reset['id']]);

            $this->db->commit();
        } catch (Throwable $e) {
            $this->db->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Nem sikerült frissíteni a jelszót.']);
            return;
        }

        echo json_encode(['message' => 'A jelszavad sikeresen frissült. Most már bejelentkezhetsz.']);
    }

    private function generateJWT(int $userId, string $username): string {
        $secret  = 'your-secret-key-change-this';
        $header  = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload = base64_encode(json_encode([
            'sub' => $userId,
            'username' => $username,
            'iat' => time(),
            'exp' => time() + (60 * 60 * 24) // 24 óra
        ]));

        $signature = base64_encode(hash_hmac('sha256', "$header.$payload", $secret, true));

        return "$header.$payload.$signature";
    }
}