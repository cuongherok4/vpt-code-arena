CREATE TABLE IF NOT EXISTS user_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    total_points INT NOT NULL DEFAULT 0,
    rank INT,
    total_ac INT NOT NULL DEFAULT 0,
    total_wa INT NOT NULL DEFAULT 0,
    ac_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00
);

CREATE INDEX IF NOT EXISTS idx_user_stats_leaderboard
    ON user_stats(total_points DESC, total_ac DESC, ac_rate DESC);
