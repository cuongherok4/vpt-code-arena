ALTER TABLE rooms ADD COLUMN IF NOT EXISTS code VARCHAR(9);
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

WITH missing_codes AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) AS rn
    FROM rooms
    WHERE code IS NULL
)
UPDATE rooms r
SET code = ((800000 + missing_codes.rn)::TEXT)
FROM missing_codes
WHERE r.id = missing_codes.id;

CREATE UNIQUE INDEX IF NOT EXISTS ux_rooms_code ON rooms(code) WHERE code IS NOT NULL;
