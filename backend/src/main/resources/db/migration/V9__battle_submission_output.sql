ALTER TABLE battle_submissions
    ADD COLUMN IF NOT EXISTS output TEXT,
    ADD COLUMN IF NOT EXISTS error_output TEXT;
