# Database Schema (PostgreSQL + Spring Data JPA)

> **Cách dùng**: Schema được quản lý bởi **Flyway** migration. File SQL migration nằm tại `backend/src/main/resources/db/migration/V1__init_schema.sql`.
> JPA Entity classes nằm tại `backend/src/main/java/com/vpt/arena/entity/`.

---

## Flyway Migration SQL — V1__init_schema.sql

```sql
-- ─────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────
CREATE TYPE role_type       AS ENUM ('USER', 'ADMIN');
CREATE TYPE difficulty_type AS ENUM ('EASY', 'MEDIUM', 'HARD');
CREATE TYPE judge_result    AS ENUM ('PENDING', 'AC', 'WA', 'TLE', 'RE', 'CE');
CREATE TYPE room_status     AS ENUM ('WAITING', 'IN_PROGRESS', 'FINISHED');
CREATE TYPE message_type    AS ENUM ('TEXT', 'SYSTEM');
CREATE TYPE friend_request_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- ─────────────────────────────────────────
-- USER MANAGEMENT
-- ─────────────────────────────────────────
CREATE TABLE users (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email             VARCHAR(255) NOT NULL UNIQUE,
    password_hash     VARCHAR(255),                       -- NULL nếu chỉ dùng OAuth
    name              VARCHAR(100) NOT NULL,
    avatar            TEXT,
    bio               TEXT,
    preferred_lang    VARCHAR(20),                        -- 'java' | 'python' | 'cpp' | 'javascript'
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    role              role_type NOT NULL DEFAULT 'USER',
    is_banned         BOOLEAN NOT NULL DEFAULT FALSE,
    oauth_provider    VARCHAR(20),                        -- 'google' | 'github' | NULL
    oauth_id          VARCHAR(255),                       -- ID từ provider
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
    group_name  VARCHAR(100) NOT NULL,    -- 'Basics', 'OOP', 'Collections'...
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE lessons (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id           UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    title                VARCHAR(255) NOT NULL,
    content              TEXT NOT NULL,                  -- HTML/Markdown
    "order"              INT NOT NULL,
    has_challenge        BOOLEAN NOT NULL DEFAULT FALSE,
    challenge_description TEXT,
    challenge_test_cases JSONB,                          -- [{input, expectedOutput}]
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
    description   TEXT NOT NULL,               -- Markdown
    difficulty    difficulty_type NOT NULL,
    topic         VARCHAR(100) NOT NULL,        -- 'Array', 'String', 'Tree'...
    test_cases    JSONB NOT NULL,              -- [{input, expectedOutput, isHidden}]
    time_limit    INT NOT NULL DEFAULT 2000,   -- ms
    memory_limit  INT NOT NULL DEFAULT 256,    -- MB
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
    language       VARCHAR(20) NOT NULL,        -- 'java' | 'python' | 'cpp' | 'javascript'
    result         judge_result NOT NULL DEFAULT 'PENDING',
    points         INT NOT NULL DEFAULT 0,
    execution_time INT,                         -- ms
    memory_used    INT,                         -- KB
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
    num_problems   INT NOT NULL,                -- 1–10
    time_limit_min INT NOT NULL,                -- 10–180 phút
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
    last_ac_time TIMESTAMP WITH TIME ZONE,       -- Tie-breaker
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
    room_id    UUID,               -- NULL = Global Chat; có giá trị = Room Chat (Battle)
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

-- ─────────────────────────────────────────
-- SOCIAL / FRIENDS (Phase 7)
-- ─────────────────────────────────────────
CREATE TABLE friend_requests (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status      friend_request_status NOT NULL DEFAULT 'PENDING',
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CHECK (sender_id <> receiver_id),
    UNIQUE(sender_id, receiver_id)
);

CREATE INDEX idx_friend_requests_receiver_status ON friend_requests(receiver_id, status);
CREATE INDEX idx_friend_requests_sender_status   ON friend_requests(sender_id, status);

CREATE TABLE friendships (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CHECK (user_id <> friend_id),
    UNIQUE(user_id, friend_id)
);

CREATE INDEX idx_friendships_user ON friendships(user_id);

CREATE TABLE battle_room_invites (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id     UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    sender_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status      VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    responded_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(room_id, receiver_id)
);

CREATE INDEX idx_battle_room_invites_receiver_status ON battle_room_invites(receiver_id, status);
```

---

## JPA Entity — Ví dụ key models

```java
// src/main/java/com/vpt/arena/entity/User.java
@Entity
@Table(name = "users")
@EntityListeners(AuditingEntityListener.class)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash")
    private String passwordHash; // NULL nếu chỉ dùng OAuth

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "role_type", nullable = false)
    @Type(PostgreSQLEnumType.class)
    private Role role = Role.USER;

    @Column(name = "is_email_verified", nullable = false)
    private boolean isEmailVerified = false;

    @Column(name = "is_banned", nullable = false)
    private boolean isBanned = false;

    @Column(name = "oauth_provider", length = 20)
    private String oauthProvider; // "google" | "github" | null

    @Column(name = "oauth_id", length = 255)
    private String oauthId;

    @Column(name = "created_at", updatable = false)
    @CreatedDate
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @LastModifiedDate
    private OffsetDateTime updatedAt;

    // Getters, setters, constructors...
}
```

```java
// src/main/java/com/vpt/arena/entity/Room.java
@Entity
@Table(name = "rooms")
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User creator;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "room_status", nullable = false)
    @Type(PostgreSQLEnumType.class)
    private RoomStatus status = RoomStatus.WAITING;

    @Column(name = "num_problems", nullable = false)
    private int numProblems;

    @Column(name = "time_limit_min", nullable = false)
    private int timeLimitMin;

    @Column(name = "start_time")
    private OffsetDateTime startTime;

    @Column(name = "end_time")
    private OffsetDateTime endTime;

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RoomMember> members = new ArrayList<>();

    // Getters, setters...
}
```

---

## Enums Java

```java
// src/main/java/com/vpt/arena/entity/enums/
public enum Role        { USER, ADMIN }
public enum Difficulty  { EASY, MEDIUM, HARD }
public enum JudgeResult { PENDING, AC, WA, TLE, RE, CE }
public enum RoomStatus  { WAITING, IN_PROGRESS, FINISHED }
public enum MessageType { TEXT, SYSTEM }
```

---

## Nguyên tắc thiết kế

| Quy tắc | Chi tiết |
|---|---|
| UUID làm PK | `gen_random_uuid()` ở DB; `@GeneratedValue(UUID)` ở JPA |
| Flyway migration | Mọi thay đổi schema → tạo file `V{n}__{mô_tả}.sql` mới, không sửa file cũ |
| `password_hash = NULL` | Cho user đăng nhập Google/GitHub không có mật khẩu |
| `chat_messages.room_id = NULL` | Quy ước Global Chat |
| `friendships` | Lưu 2 dòng cho mỗi quan hệ bạn bè để query danh sách bạn bè O(1) theo `user_id` |
| Host kick battle | Chỉ cho phép khi `rooms.status = WAITING`; member bị kick khỏi `room_members` |
| Soft delete | Dùng `is_banned` với User; không xóa submission và room_results |
| JSONB cho test_cases | Linh hoạt, query được qua PostgreSQL JSONB operators |

## Redis Cache Strategy

| Cache key | Nội dung | TTL |
|---|---|---|
| `leaderboard:exam:{problemId}:{lang}` | Top 100 Exam leaderboard (JSON) | 60s |
| `room:{roomId}:leaderboard` | Leaderboard real-time trong trận | Xóa khi FINISHED |
| `room:{roomId}:end_time` | Epoch ms của `end_time` để countdown | Xóa khi FINISHED |
| `session:refresh:{userId}` | Refresh token (rotate on use) | 7 ngày |
