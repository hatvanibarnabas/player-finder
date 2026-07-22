USE playerfinder;

ALTER TABLE users
    ADD COLUMN riot_name VARCHAR(64) NULL AFTER password,
    ADD COLUMN riot_tag VARCHAR(16) NULL AFTER riot_name,
    ADD COLUMN riot_puuid VARCHAR(128) NULL AFTER riot_tag,
    ADD UNIQUE KEY uq_users_riot_puuid (riot_puuid);

CREATE TABLE IF NOT EXISTS friendships (
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
