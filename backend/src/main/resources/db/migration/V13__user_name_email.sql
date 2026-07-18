UPDATE users
SET name = email
WHERE email IS NOT NULL
  AND name <> email;
