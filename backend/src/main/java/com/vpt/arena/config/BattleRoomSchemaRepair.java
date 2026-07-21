package com.vpt.arena.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
@Profile("!test")
@RequiredArgsConstructor
public class BattleRoomSchemaRepair {

    private final JdbcTemplate jdbcTemplate;

    @Bean
    ApplicationRunner repairBattleRoomSchema() {
        return args -> {
            jdbcTemplate.execute("ALTER TABLE rooms ADD COLUMN IF NOT EXISTS code VARCHAR(9)");
            jdbcTemplate.execute("ALTER TABLE rooms ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)");
            jdbcTemplate.execute("""
                WITH missing_codes AS (
                    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) AS rn
                    FROM rooms
                    WHERE code IS NULL
                )
                UPDATE rooms r
                SET code = ((900000000 - missing_codes.rn)::TEXT)
                FROM missing_codes
                WHERE r.id = missing_codes.id
                """);
            jdbcTemplate.execute("CREATE UNIQUE INDEX IF NOT EXISTS ux_rooms_code ON rooms(code)");
        };
    }
}
