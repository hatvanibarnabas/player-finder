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

CREATE TABLE conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_low_id INT NOT NULL,
    user_high_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_conversation_pair (user_low_id, user_high_id),
    KEY idx_conversations_updated (updated_at),
    CONSTRAINT fk_conversations_user_low
        FOREIGN KEY (user_low_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_conversations_user_high
        FOREIGN KEY (user_high_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_conversations_ordered
        CHECK (user_low_id < user_high_id)
);

CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    body VARCHAR(2000) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_messages_conversation_created (conversation_id, id),
    CONSTRAINT fk_messages_conversation
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    CONSTRAINT fk_messages_sender
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE conversation_reads (
    conversation_id INT NOT NULL,
    user_id INT NOT NULL,
    last_read_message_id INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (conversation_id, user_id),
    CONSTRAINT fk_conversation_reads_conversation
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    CONSTRAINT fk_conversation_reads_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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