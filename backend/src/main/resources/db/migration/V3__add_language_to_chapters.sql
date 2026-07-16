-- V3__add_language_to_chapters.sql
ALTER TABLE chapters ADD COLUMN language VARCHAR(20) DEFAULT 'java';
UPDATE chapters SET language = 'java' WHERE language IS NULL;
ALTER TABLE chapters ALTER COLUMN language SET NOT NULL;
