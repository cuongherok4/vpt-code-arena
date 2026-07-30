ALTER TABLE users
    ADD COLUMN IF NOT EXISTS public_id VARCHAR(10);

WITH numbered_users AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) AS row_num
    FROM users
    WHERE public_id IS NULL OR public_id = ''
)
UPDATE users u
SET public_id = LPAD((1000000000 + numbered_users.row_num)::TEXT, 10, '0')
FROM numbered_users
WHERE u.id = numbered_users.id;

ALTER TABLE users
    ALTER COLUMN public_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_users_public_id ON users(public_id);
