# Backend Architecture — Java Spring Boot

> **Framework**: Spring Boot 3.x | **Java**: 21 (LTS)
> **Entry point**: `backend/src/main/java/com/vpt/arena/VptArenaApplication.java`

---

## 1. Tổng quan kiến trúc

```
[HTTP Request]
      │
      ▼
[JwtAuthFilter]  ──── validate JWT ────► [JwtService]
      │
      ▼
[Controller Layer]   ── @RestController, @RequestMapping
      │
      ▼
[Service Layer]      ── Business logic, @Service, @Transactional
      │
      ├──► [Repository Layer]  ── Spring Data JPA, query DB
      │         │
      │         ▼
      │    [PostgreSQL]
      │
      ├──► [RedisService]      ── Cache leaderboard, room state
      │         │
      │         ▼
      │    [Redis]
      │
      └──► [JudgeCallbackService] ── nhận kết quả từ Judge Service
                │
                ▼
           [WebSocket Service] ── thông báo kết quả cho client
```

---

## 2. Packages chính

### `config/` — Cấu hình Spring

```java
// SecurityConfig.java — Quan trọng nhất
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
          .csrf(csrf -> csrf.disable())
          .sessionManagement(sm -> sm.sessionCreationPolicy(STATELESS))
          .authorizeHttpRequests(auth -> auth
              .requestMatchers("/api/v1/auth/**").permitAll()
              .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
              .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
              .anyRequest().authenticated()
          )
          .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
          .oauth2Login(oauth2 -> oauth2
              .successHandler(oAuth2SuccessHandler)
          );
        return http.build();
    }
}
```

### `entity/` — JPA Entities
Mapping trực tiếp từ `database-schema.md`. Xem chi tiết cấu trúc entity trong file đó.

### `repository/` — Spring Data JPA

```java
// SubmissionRepository.java
public interface SubmissionRepository extends JpaRepository<Submission, UUID> {

    // Leaderboard Exam: AC đầu tiên theo ngôn ngữ, sort điểm → thời gian
    @Query("""
        SELECT s FROM Submission s
        WHERE s.problem.id = :problemId
          AND s.language = :language
          AND s.result = 'AC'
        ORDER BY s.points DESC, s.submittedAt ASC
        """)
    Page<Submission> findLeaderboard(
        @Param("problemId") UUID problemId,
        @Param("language") String language,
        Pageable pageable
    );

    // Lịch sử submit của 1 user cho 1 bài
    List<Submission> findByUserIdAndProblemIdOrderBySubmittedAtDesc(UUID userId, UUID problemId);
}
```

```java
// BattleSubmissionRepository.java
public interface BattleSubmissionRepository extends JpaRepository<BattleSubmission, UUID> {

    // Tính leaderboard real-time trong trận
    @Query("""
        SELECT bs.userId,
               SUM(bs.points) as totalPoints,
               MAX(CASE WHEN bs.result = 'AC' THEN bs.submittedAt END) as lastAcTime
        FROM BattleSubmission bs
        WHERE bs.roomId = :roomId
          AND bs.result = 'AC'
        GROUP BY bs.userId
        ORDER BY totalPoints DESC, lastAcTime ASC
        """)
    List<BattleLeaderboardRow> calcLeaderboard(@Param("roomId") UUID roomId);
}
```

### `service/` — Business Logic

#### `auth/AuthService.java`
- `register()` → hash password, tạo User, gửi email xác thực
- `login()` → verify password, tạo JWT access + refresh
- `refreshToken()` → validate refresh token (Redis), issue access token mới
- `logout()` → xóa refresh token khỏi Redis
- `forgotPassword()` / `resetPassword()` → tạo/validate reset token

#### `auth/OAuth2Service.java`
- Extends `DefaultOAuth2UserService`
- Sau khi OAuth2 thành công: tạo/cập nhật User, issue JWT, redirect FE kèm token

#### `battle/BattleService.java`
- `createRoom()` → tạo Room, auto-generate đề bài theo cấu hình
- `joinRoom()` → kiểm tra status = WAITING, số người < maxMembers
- `startRoom()` → set start_time, end_time, status = IN_PROGRESS, lưu vào Redis, publish event tới WebSocket Service
- `submitCode()` → kiểm tra room IN_PROGRESS + chưa hết giờ, tạo BattleSubmission, gửi tới Judge Service

#### `battle/BattleScheduler.java`
```java
@Component
public class BattleScheduler {

    // Chạy mỗi 30 giây để kiểm tra phòng hết giờ
    @Scheduled(fixedRate = 30_000)
    public void checkExpiredRooms() {
        List<Room> expiredRooms = roomRepository.findByStatusAndEndTimeBefore(
            RoomStatus.IN_PROGRESS, OffsetDateTime.now()
        );
        expiredRooms.forEach(this::finishRoom);
    }

    private void finishRoom(Room room) {
        // 1. Tính điểm + xếp hạng từ BattleSubmission
        // 2. Lưu RoomResult
        // 3. Set room.status = FINISHED
        // 4. Gọi WebSocket Service để broadcast battle:finished
        // 5. Xóa Redis cache của phòng
    }
}
```

#### `judge/JudgeCallbackService.java`
Nhận kết quả từ Judge Service (HTTP callback), cập nhật Submission/BattleSubmission, thông báo WebSocket Service.

### `controller/` — REST Controllers

```java
// BattleController.java — ví dụ pattern
@RestController
@RequestMapping("/api/v1/battle")
@RequiredArgsConstructor
public class BattleController {

    private final BattleService battleService;

    @PostMapping("/rooms")
    @ResponseStatus(HttpStatus.CREATED)
    public RoomResponse createRoom(
        @RequestBody @Valid CreateRoomRequest request,
        @AuthenticationPrincipal CustomUserDetails user
    ) {
        return battleService.createRoom(request, user.getId());
    }

    @PostMapping("/rooms/{roomId}/start")
    public StartRoomResponse startRoom(
        @PathVariable UUID roomId,
        @AuthenticationPrincipal CustomUserDetails user
    ) {
        return battleService.startRoom(roomId, user.getId());
    }
}
```

### `dto/` — Data Transfer Objects

```java
// Tách hoàn toàn khỏi Entity — không expose Entity ra controller
public record CreateRoomRequest(
    @NotBlank String name,
    @Min(1) @Max(10) int numProblems,
    @Min(10) @Max(180) int timeLimitMin,
    Difficulty difficulty,
    String topic,
    boolean isPublic,
    @Max(20) int maxMembers
) {}

public record RoomResponse(
    UUID id, String name, RoomStatus status,
    int memberCount, int maxMembers, ...
) {}
```

### `exception/` — Error Handling

```java
// ErrorCode.java
public enum ErrorCode {
    USER_NOT_FOUND("USER_001"),
    EMAIL_ALREADY_EXISTS("USER_002"),
    INVALID_PASSWORD("AUTH_001"),
    TOKEN_EXPIRED("AUTH_002"),
    ROOM_NOT_FOUND("BATTLE_001"),
    ROOM_ALREADY_STARTED("BATTLE_002"),
    ROOM_FULL("BATTLE_003"),
    NOT_ROOM_OWNER("BATTLE_004"),
    SUBMISSION_CLOSED("BATTLE_005");
    // ...
}

// GlobalExceptionHandler.java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(BusinessException ex) {
        return ResponseEntity.status(ex.getHttpStatus())
            .body(new ErrorResponse(ex.getCode(), ex.getMessage()));
    }
}
```

---

## 3. Spring Boot Dependencies (pom.xml)

```xml
<dependencies>
    <!-- Core -->
    <dependency>spring-boot-starter-web</dependency>
    <dependency>spring-boot-starter-data-jpa</dependency>
    <dependency>spring-boot-starter-security</dependency>
    <dependency>spring-boot-starter-oauth2-client</dependency>
    <dependency>spring-boot-starter-validation</dependency>
    <dependency>spring-boot-starter-mail</dependency>
    <dependency>spring-boot-starter-data-redis</dependency>
    <dependency>spring-boot-starter-actuator</dependency>

    <!-- Database -->
    <dependency>org.postgresql:postgresql</dependency>
    <dependency>org.flywaydb:flyway-core</dependency>
    <dependency>org.flywaydb:flyway-database-postgresql</dependency>

    <!-- JWT -->
    <dependency>io.jsonwebtoken:jjwt-api:0.12.x</dependency>
    <dependency>io.jsonwebtoken:jjwt-impl:0.12.x</dependency>
    <dependency>io.jsonwebtoken:jjwt-jackson:0.12.x</dependency>

    <!-- API Docs -->
    <dependency>org.springdoc:springdoc-openapi-starter-webmvc-ui:2.x</dependency>

    <!-- Rate Limiting -->
    <dependency>com.bucket4j:bucket4j-core:8.x</dependency>
    <dependency>com.bucket4j:bucket4j-redis:8.x</dependency>

    <!-- Utility -->
    <dependency>org.projectlombok:lombok</dependency>

    <!-- Test -->
    <dependency>spring-boot-starter-test</dependency>
    <dependency>org.mockito:mockito-core</dependency>
</dependencies>
```

---

## 4. application.yml (cấu hình chính)

```yaml
spring:
  datasource:
    url: ${DATABASE_URL}
    username: ${DATABASE_USERNAME}
    password: ${DATABASE_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate  # Flyway quản lý schema, JPA chỉ validate
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
  flyway:
    enabled: true
    locations: classpath:db/migration
  data:
    redis:
      host: ${REDIS_HOST}
      port: ${REDIS_PORT}
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID}
            client-secret: ${GOOGLE_CLIENT_SECRET}
            scope: email, profile
          github:
            client-id: ${GITHUB_CLIENT_ID}
            client-secret: ${GITHUB_CLIENT_SECRET}
            scope: user:email

server:
  port: 8080

jwt:
  secret: ${JWT_SECRET}
  access-expiry-seconds: ${JWT_ACCESS_EXPIRY_SECONDS:900}
  refresh-expiry-days: ${JWT_REFRESH_EXPIRY_DAYS:7}

springdoc:
  api-docs:
    path: /v3/api-docs
  swagger-ui:
    path: /swagger-ui.html
```
