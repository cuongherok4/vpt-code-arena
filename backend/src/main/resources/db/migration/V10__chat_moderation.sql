ALTER TABLE chat_messages
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);

ALTER TABLE direct_messages
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);

CREATE TABLE IF NOT EXISTS message_reports (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_kind VARCHAR(20) NOT NULL,
    message_id   UUID NOT NULL,
    reported_by  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason       VARCHAR(500),
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_reports_message ON message_reports(message_kind, message_id);
CREATE INDEX IF NOT EXISTS idx_message_reports_user ON message_reports(reported_by, created_at);

CREATE TABLE IF NOT EXISTS chat_mutes (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    muted_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at    TIMESTAMP WITH TIME ZONE,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_chat_mutes_owner_muted UNIQUE(owner_id, muted_user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_mutes_owner ON chat_mutes(owner_id, expires_at);
