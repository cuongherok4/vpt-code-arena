-- ─────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────
CREATE TYPE role_type       AS ENUM ('USER', 'ADMIN');
CREATE TYPE difficulty_type AS ENUM ('EASY', 'MEDIUM', 'HARD');
CREATE TYPE judge_result    AS ENUM ('PENDING', 'AC', 'WA', 'TLE', 'RE', 'CE');
CREATE TYPE room_status     AS ENUM ('WAITING', 'IN_PROGRESS', 'FINISHED');
CREATE TYPE message_type    AS ENUM ('TEXT', 'SYSTEM');

-- ─────────────────────────────────────────
-- USER MANAGEMENT
-- ─────────────────────────────────────────
CREATE TABLE users (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email             VARCHAR(255) NOT NULL UNIQUE,
    password_hash     VARCHAR(255),
    name              VARCHAR(100) NOT NULL,
    avatar            TEXT,
    bio               TEXT,
    preferred_lang    VARCHAR(20),
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    role              role_type NOT NULL DEFAULT 'USER',
    is_banned         BOOLEAN NOT NULL DEFAULT FALSE,
    oauth_provider    VARCHAR(20),
    oauth_id          VARCHAR(255),
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE user_stats (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    total_points INT NOT NULL DEFAULT 0,
    rank         INT,
    total_ac     INT NOT NULL DEFAULT 0,
    total_wa     INT NOT NULL DEFAULT 0,
    ac_rate      NUMERIC(5,2) NOT NULL DEFAULT 0.00
);

CREATE TABLE password_reset_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at    TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE email_verify_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- LEARN MODULE
-- ─────────────────────────────────────────
CREATE TABLE chapters (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    "order"     INT NOT NULL,
    group_name  VARCHAR(100) NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE lessons (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id           UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    title                VARCHAR(255) NOT NULL,
    content              TEXT NOT NULL,
    "order"              INT NOT NULL,
    has_challenge        BOOLEAN NOT NULL DEFAULT FALSE,
    challenge_description TEXT,
    challenge_test_cases JSONB,
    created_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE user_progress (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id        UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    chapter_id       UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    completed        BOOLEAN NOT NULL DEFAULT FALSE,
    challenge_passed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at     TIMESTAMP WITH TIME ZONE,
    time_spent_sec   INT NOT NULL DEFAULT 0,
    UNIQUE(user_id, lesson_id)
);

CREATE INDEX idx_user_progress_user_chapter ON user_progress(user_id, chapter_id);

-- ─────────────────────────────────────────
-- PROBLEMS (dùng chung Exam + Battle)
-- ─────────────────────────────────────────
CREATE TABLE problems (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title         VARCHAR(255) NOT NULL,
    description   TEXT NOT NULL,
    difficulty    difficulty_type NOT NULL,
    topic         VARCHAR(100) NOT NULL,
    test_cases    JSONB NOT NULL,
    time_limit    INT NOT NULL DEFAULT 2000,
    memory_limit  INT NOT NULL DEFAULT 256,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- EXAM MODULE
-- ─────────────────────────────────────────
CREATE TABLE submissions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id     UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    code           TEXT NOT NULL,
    language       VARCHAR(20) NOT NULL,
    result         judge_result NOT NULL DEFAULT 'PENDING',
    points         INT NOT NULL DEFAULT 0,
    execution_time INT,
    memory_used    INT,
    error_output   TEXT,
    submitted_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_submissions_user_problem  ON submissions(user_id, problem_id);
CREATE INDEX idx_submissions_leaderboard   ON submissions(problem_id, language, result, submitted_at);

-- ─────────────────────────────────────────
-- BATTLE MODULE
-- ─────────────────────────────────────────
CREATE TABLE rooms (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by     UUID NOT NULL REFERENCES users(id),
    name           VARCHAR(255) NOT NULL,
    status         room_status NOT NULL DEFAULT 'WAITING',
    is_public      BOOLEAN NOT NULL DEFAULT FALSE,
    max_members    INT NOT NULL DEFAULT 20,
    num_problems   INT NOT NULL,
    time_limit_min INT NOT NULL,
    difficulty     difficulty_type,
    topic          VARCHAR(100),
    start_time     TIMESTAMP WITH TIME ZONE,
    end_time       TIMESTAMP WITH TIME ZONE,
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE room_members (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id   UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_ready  BOOLEAN NOT NULL DEFAULT FALSE,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

CREATE INDEX idx_room_members_room ON room_members(room_id);

CREATE TABLE battle_room_problems (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id    UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id),
    "order"    INT NOT NULL,
    UNIQUE(room_id, "order")
);

CREATE TABLE battle_submissions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id        UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id     UUID NOT NULL REFERENCES problems(id),
    code           TEXT NOT NULL,
    language       VARCHAR(20) NOT NULL,
    result         judge_result NOT NULL DEFAULT 'PENDING',
    points         INT NOT NULL DEFAULT 0,
    execution_time INT,
    submitted_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_battle_submissions_room_user ON battle_submissions(room_id, user_id);
CREATE INDEX idx_battle_submissions_room_user_problem ON battle_submissions(room_id, user_id, problem_id);

CREATE TABLE room_results (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id     UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_points INT NOT NULL,
    rank        INT NOT NULL,
    last_ac_time TIMESTAMP WITH TIME ZONE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

CREATE INDEX idx_room_results_rank ON room_results(room_id, rank);

-- ─────────────────────────────────────────
-- MESSAGING
-- ─────────────────────────────────────────
CREATE TABLE chat_messages (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message    TEXT NOT NULL,
    room_id    UUID,
    type       message_type NOT NULL DEFAULT 'TEXT',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_room_time   ON chat_messages(room_id, created_at);
CREATE INDEX idx_chat_messages_global_time ON chat_messages(created_at) WHERE room_id IS NULL;

CREATE TABLE direct_messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message     TEXT NOT NULL,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_direct_messages_conversation ON direct_messages(sender_id, receiver_id, created_at);
CREATE INDEX idx_direct_messages_unread        ON direct_messages(receiver_id, is_read);
