CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages (conversation_id);

CREATE INDEX IF NOT EXISTS idx_messages_session ON messages (session_id);

CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages (sent_timestamp);

CREATE INDEX IF NOT EXISTS idx_sessions_contact ON sessions (contact_id);

CREATE INDEX IF NOT EXISTS idx_conversations_contact ON conversations (contact_id);

CREATE INDEX IF NOT EXISTS idx_skipped_keys_session ON skipped_message_keys (session_id);

CREATE INDEX IF NOT EXISTS idx_devices_contact ON devices (contact_id);

CREATE TRIGGER IF NOT EXISTS user_updated_at AFTER
UPDATE ON user BEGIN
UPDATE user SET updated_at = datetime ('now', 'localtime') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS contacts_updated_at AFTER
UPDATE ON contacts BEGIN
UPDATE contacts SET updated_at = datetime ('now', 'localtime') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS sessions_updated_at AFTER
UPDATE ON sessions BEGIN
UPDATE sessions SET updated_at = datetime ('now', 'localtime') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS conversations_updated_at AFTER
UPDATE ON conversations BEGIN
UPDATE conversations SET updated_at = datetime ('now', 'localtime') WHERE id = NEW.id;
END;
