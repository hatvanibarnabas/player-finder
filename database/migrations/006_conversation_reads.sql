USE playerfinder;

CREATE TABLE IF NOT EXISTS conversation_reads (
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
