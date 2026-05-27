<?php
require_once __DIR__ . '/../config/database.php';

class AuthController {
    private PDO $db;

    public function __construct() {
        $database   = new Database();
        $this->db   = $database->connect();
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
                'id'       => $user['id'],
                'username' => $user['username'],
                'email'    => $user['email'],
            ]
        ]);
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