ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS battle_room_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_chat_messages_battle_room'
          AND table_name = 'chat_messages'
    ) THEN
        ALTER TABLE chat_messages
            ADD CONSTRAINT fk_chat_messages_battle_room
            FOREIGN KEY (battle_room_id) REFERENCES rooms(id) ON DELETE SET NULL;
    END IF;
END $$;

