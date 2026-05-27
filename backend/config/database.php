<?php
class Database {
    private $host;
    private $dbname;
    private $user;
    private $pass;
    private $pdo;

    public function __construct() {
        $this->host   = getenv('DB_HOST') ?: 'db';
        $this->dbname = getenv('DB_NAME') ?: 'playerfinder';
        $this->user   = getenv('DB_USER') ?: 'root';
        $this->pass   = getenv('DB_PASS') ?: 'secret';
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