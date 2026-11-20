<?php
class Database {
    private $host;
    private $dbname;
    private $user;
    private $pass;
    private $pdo;

    public function __construct() {
        require_once __DIR__ . '/env.php';
        loadEnvFile();

        $this->host   = env('DB_HOST', 'db') ?? 'db';
        $this->dbname = env('DB_NAME', 'playerfinder') ?? 'playerfinder';
        $this->user   = env('DB_USER', 'root') ?? 'root';
        $this->pass   = env('DB_PASS', 'secret') ?? 'secret';
    }

    public function connect(): PDO {
        if ($this->pdo) return $this->pdo;

        $this->pdo = new PDO(
            "mysql:host={$this->host};dbname={$this->dbname};charset=utf8",
            $this->user,
            $this->pass,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        return $this->pdo;
    }
}