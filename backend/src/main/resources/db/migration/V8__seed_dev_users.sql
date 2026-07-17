-- Dev users used before Phase 5 Auth is implemented.
INSERT INTO users (id, email, name, is_email_verified, role, created_at, updated_at)
VALUES
    ('3fa85f64-5717-4562-b3fc-2c963f66afa6', 'dev1@vpt-arena.local', 'Dev Player 1', true, 'USER', NOW(), NOW()),
    ('4fa85f64-5717-4562-b3fc-2c963f66afa6', 'dev2@vpt-arena.local', 'Dev Player 2', true, 'USER', NOW(), NOW())
ON CONFLICT (id) DO UPDATE
SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    is_email_verified = EXCLUDED.is_email_verified,
    updated_at = NOW();
