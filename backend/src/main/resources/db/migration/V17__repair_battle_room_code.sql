ALTER TABLE rooms ADD COLUMN IF NOT EXISTS code VARCHAR(9);

WITH missing_codes AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) AS rn
    FROM rooms
    WHERE code IS NULL
)
UPDATE rooms r
SET code = ((700000 + missing_codes.rn)::TEXT)
FROM missing_codes
WHERE r.id = missing_codes.id;

ALTER TABLE rooms ALTER COLUMN code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_rooms_code ON rooms(code);
