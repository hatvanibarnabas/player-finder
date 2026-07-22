CREATE DATABASE IF NOT EXISTS playerfinder;
USE playerfinder;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    riot_name VARCHAR(64) NULL,
    riot_tag VARCHAR(16) NULL,
    riot_puuid VARCHAR(128) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_users_riot_puuid (riot_puuid)
);

CREATE TABLE friendships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requester_id INT NOT NULL,
    addressee_id INT NOT NULL,
    status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_friendship_pair (requester_id, addressee_id),
    KEY idx_friendships_addressee (addressee_id, status),
    KEY idx_friendships_requester (requester_id, status),
    CONSTRAINT fk_friendships_requester
        FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_friendships_addressee
        FOREIGN KEY (addressee_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_friendships_not_self
        CHECK (requester_id <> addressee_id)
);

CREATE TABLE players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game VARCHAR(32) NOT NULL,
    riot_name VARCHAR(64) NOT NULL,
    riot_tag VARCHAR(16) NOT NULL,
    puuid VARCHAR(128) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_player (game, riot_name, riot_tag)
);

CREATE TABLE player_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player_id INT NOT NULL,
    user_id INT NOT NULL,
    skill TINYINT NOT NULL CHECK (skill BETWEEN 1 AND 5),
    teamwork TINYINT NOT NULL CHECK (teamwork BETWEEN 1 AND 5),
    communication TINYINT NOT NULL CHECK (communication BETWEEN 1 AND 5),
    reliability TINYINT NOT NULL CHECK (reliability BETWEEN 1 AND 5),
    attitude TINYINT NOT NULL CHECK (attitude BETWEEN 1 AND 5),
    comment VARCHAR(280) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_player (player_id, user_id),
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);