USE playerfinder;

DROP TABLE IF EXISTS player_scores;

CREATE TABLE player_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player_id INT NOT NULL,
    reviewer_id VARCHAR(36) NOT NULL,
    skill TINYINT NOT NULL CHECK (skill BETWEEN 1 AND 5),
    teamwork TINYINT NOT NULL CHECK (teamwork BETWEEN 1 AND 5),
    communication TINYINT NOT NULL CHECK (communication BETWEEN 1 AND 5),
    reliability TINYINT NOT NULL CHECK (reliability BETWEEN 1 AND 5),
    attitude TINYINT NOT NULL CHECK (attitude BETWEEN 1 AND 5),
    comment VARCHAR(280) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_reviewer_player (player_id, reviewer_id),
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);
