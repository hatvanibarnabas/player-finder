USE playerfinder;

CREATE TABLE IF NOT EXISTS players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game VARCHAR(32) NOT NULL,
    riot_name VARCHAR(64) NOT NULL,
    riot_tag VARCHAR(16) NOT NULL,
    puuid VARCHAR(128) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_player (game, riot_name, riot_tag)
);

CREATE TABLE IF NOT EXISTS player_scores (
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
