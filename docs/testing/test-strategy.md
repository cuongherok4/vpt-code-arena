# Test Strategy — Chiến lược kiểm thử

> **Target**: Code coverage > 80% cho backend; E2E coverage cho happy paths của mỗi module.

---

## 1. Tổng quan 3 tầng test

```
         ┌─────────────────────────────────┐
         │        E2E Tests (Playwright)    │  ← Ít nhất, chạy chậm
         │    Happy path mỗi module        │
         ├─────────────────────────────────┤
         │   Integration Tests             │  ← Vừa phải
         │   (SpringBootTest + TestContainers) │
         ├─────────────────────────────────┤
         │        Unit Tests               │  ← Nhiều nhất, chạy nhanh
         │   (JUnit 5 + Mockito / Vitest)  │
         └─────────────────────────────────┘
```

---

## 2. Backend — Unit Tests (JUnit 5 + Mockito)

### Setup

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
    <!-- Đã include: JUnit 5, Mockito, AssertJ, MockMvc -->
</dependency>
```

### Ví dụ: Test BattleService

```java
// src/test/java/com/vpt/arena/service/BattleServiceTest.java
@ExtendWith(MockitoExtension.class)
class BattleServiceTest {

    @Mock private RoomRepository roomRepository;
    @Mock private RoomMemberRepository roomMemberRepository;
    @Mock private JudgeService judgeService;
    @Mock private RedisService redisService;
    @InjectMocks private BattleService battleService;

    @Test
    void startRoom_shouldThrow_whenNotOwner() {
        // Given
        UUID roomId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        UUID otherId = UUID.randomUUID();
        Room room = Room.builder().id(roomId).createdBy(ownerId).status(RoomStatus.WAITING).build();
        when(roomRepository.findById(roomId)).thenReturn(Optional.of(room));

        // When & Then
        assertThatThrownBy(() -> battleService.startRoom(roomId, otherId))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("NOT_ROOM_OWNER");
    }

    @Test
    void startRoom_shouldSetStatusToInProgress_whenOwnerStarts() {
        // Given
        UUID roomId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        Room room = Room.builder()
            .id(roomId).createdBy(ownerId)
            .status(RoomStatus.WAITING).timeLimitMin(60)
            .build();
        when(roomRepository.findById(roomId)).thenReturn(Optional.of(room));
        when(roomRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // When
        battleService.startRoom(roomId, ownerId);

        // Then
        assertThat(room.getStatus()).isEqualTo(RoomStatus.IN_PROGRESS);
        assertThat(room.getStartTime()).isNotNull();
        assertThat(room.getEndTime()).isEqualTo(room.getStartTime().plusMinutes(60));
        verify(redisService).saveRoomEndTime(eq(roomId), any());
    }

    @Test
    void joinRoom_shouldThrow_whenRoomAlreadyStarted() {
        UUID roomId = UUID.randomUUID();
        Room room = Room.builder().id(roomId).status(RoomStatus.IN_PROGRESS).build();
        when(roomRepository.findById(roomId)).thenReturn(Optional.of(room));

        assertThatThrownBy(() -> battleService.joinRoom(roomId, UUID.randomUUID()))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("ROOM_ALREADY_STARTED");
    }
}
```

### Ví dụ: Test Scoring Logic

```java
@Test
void calculatePoints_singleProblem_acGets100() {
    int points = battleService.calculatePoints(1, JudgeResult.AC, 1);
    assertThat(points).isEqualTo(100);
}

@Test
void calculatePoints_threeProblems_acGets33() {
    int points = battleService.calculatePoints(3, JudgeResult.AC, 1);
    assertThat(points).isEqualTo(33);
}

@Test
void calculatePoints_waGets0() {
    int points = battleService.calculatePoints(3, JudgeResult.WA, 1);
    assertThat(points).isEqualTo(0);
}
```

### Ví dụ: Test JwtService

```java
@Test
void generateAndValidateToken_shouldWork() {
    User user = User.builder().id(UUID.randomUUID()).email("test@test.com").role(Role.USER).build();

    String token = jwtService.generateAccessToken(user);
    Claims claims = jwtService.validateAndExtract(token);

    assertThat(claims.getSubject()).isEqualTo(user.getId().toString());
    assertThat(claims.get("role")).isEqualTo("USER");
}

@Test
void expiredToken_shouldThrowJwtException() {
    String expiredToken = generateExpiredToken();
    assertThatThrownBy(() -> jwtService.validateAndExtract(expiredToken))
        .isInstanceOf(JwtException.class);
}
```

---

## 3. Backend — Integration Tests (SpringBootTest + TestContainers)

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>postgresql</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>junit-jupiter</artifactId>
    <scope>test</scope>
</dependency>
```

```java
// src/test/java/com/vpt/arena/controller/BattleControllerIT.java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
class BattleControllerIT {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
        .withDatabaseName("vpt_test")
        .withUsername("test")
        .withPassword("test");

    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine")
        .withExposedPorts(6379);

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
    }

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @Test
    void createRoom_thenJoin_thenStart_happyPath() throws Exception {
        // 1. Register & login user (host)
        String hostToken = registerAndLogin("host@test.com", "Pass123!");

        // 2. Create room
        var createResponse = mockMvc.perform(post("/api/v1/battle/rooms")
            .header("Authorization", "Bearer " + hostToken)
            .contentType(APPLICATION_JSON)
            .content("""
                {"name":"Test Room","numProblems":1,"timeLimitMin":10,
                 "difficulty":"EASY","isPublic":true,"maxMembers":20}
                """))
            .andExpect(status().isCreated())
            .andReturn();

        String roomId = extractRoomId(createResponse);

        // 3. Join with another user
        String userToken = registerAndLogin("user@test.com", "Pass123!");
        mockMvc.perform(post("/api/v1/battle/rooms/{id}/join", roomId)
            .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk());

        // 4. Start room (host only)
        mockMvc.perform(post("/api/v1/battle/rooms/{id}/start", roomId)
            .header("Authorization", "Bearer " + hostToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.startTime").isNotEmpty())
            .andExpect(jsonPath("$.endTime").isNotEmpty());
    }

    @Test
    void startRoom_shouldReturn403_whenNotOwner() throws Exception {
        // ... setup
        mockMvc.perform(post("/api/v1/battle/rooms/{id}/start", roomId)
            .header("Authorization", "Bearer " + nonOwnerToken))
            .andExpect(status().isForbidden());
    }
}
```

---

## 4. Frontend — Unit Tests (Vitest + React Testing Library)

```bash
# Setup
npm install -D vitest @testing-library/react @testing-library/user-event jsdom
```

```typescript
// src/__tests__/components/ResultBadge.test.tsx
import { render, screen } from '@testing-library/react';
import { ResultBadge } from '@/components/common/ResultBadge';

test('shows green for AC', () => {
  render(<ResultBadge result="AC" />);
  const badge = screen.getByText('AC');
  expect(badge).toHaveClass('text-green-500');
});

test('shows red for WA', () => {
  render(<ResultBadge result="WA" />);
  expect(screen.getByText('WA')).toHaveClass('text-red-500');
});
```

```typescript
// src/__tests__/store/battleStore.test.ts
import { useBattleStore } from '@/store/battleStore';

test('tick reduces remainingSeconds by 1', () => {
  useBattleStore.setState({ remainingSeconds: 100 });
  useBattleStore.getState().tick();
  expect(useBattleStore.getState().remainingSeconds).toBe(99);
});

test('tick does not go below 0', () => {
  useBattleStore.setState({ remainingSeconds: 0 });
  useBattleStore.getState().tick();
  expect(useBattleStore.getState().remainingSeconds).toBe(0);
});
```

---

## 5. E2E Tests (Playwright)

### Setup

```bash
npx playwright install --with-deps chromium
```

### Happy Paths cần cover

| Test Suite | Scenarios |
|---|---|
| **Auth** | Đăng ký → verify email → login; OAuth redirect flow |
| **Learn** | Vào bài học → chạy Try it → nộp Challenge → mở khóa chương tiếp |
| **Exam** | Vào bài thi → nộp code Java → nhận AC → xem leaderboard |
| **Battle** | User A tạo phòng → User B join → A start → cả 2 submit → xem kết quả |

```typescript
// e2e/exam.spec.ts
import { test, expect } from '@playwright/test';

test('submit exam problem and get AC', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', 'testuser@test.com');
  await page.fill('[data-testid="password-input"]', 'Test123!');
  await page.click('[data-testid="login-btn"]');
  await expect(page).toHaveURL('/');

  // Vào bài thi
  await page.goto('/exam');
  await page.click('[data-testid="problem-row"]:first-child');

  // Nhập code
  await page.click('.monaco-editor');
  await page.keyboard.type(`
public class Main {
  public static void main(String[] args) {
    System.out.println(1 + 2);
  }
}
  `);

  // Submit
  await page.click('[data-testid="submit-btn"]');

  // Chờ kết quả
  await expect(page.locator('[data-testid="result-badge"]')).toHaveText('AC', { timeout: 30_000 });
});
```

---

## 6. CI/CD Test Pipelines

```yaml
# .github/workflows/backend-ci.yml
name: Backend CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: '21', distribution: 'temurin' }
      - name: Run unit + integration tests
        run: cd backend && ./mvnw test
      - name: Check coverage (min 80%)
        run: cd backend && ./mvnw jacoco:check
```

```yaml
# .github/workflows/frontend-ci.yml
name: Frontend CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd frontend && npm ci
      - run: cd frontend && npm run test
      - run: cd frontend && npm run build  # Verify build không lỗi
```

---

## 7. Coverage Requirements

| Layer | Tool | Target |
|---|---|---|
| Backend service/logic | JaCoCo | > 80% line coverage |
| Backend controller | MockMvc integration tests | Mọi endpoint có ít nhất 1 test |
| Frontend components | Vitest | > 70% cho shared components |
| E2E | Playwright | 100% happy paths của 4 module chính |

### Chạy coverage báo cáo

```bash
# Backend
cd backend && ./mvnw test jacoco:report
# Xem báo cáo: backend/target/site/jacoco/index.html

# Frontend
cd frontend && npm run test -- --coverage
```

---

## 8. Test Data Strategy

- **Unit tests**: dùng builder/fixture, không động DB
- **Integration tests**: TestContainers tạo DB fresh mỗi test class, Flyway migrate tự động
- **E2E tests**: Seed data cố định bằng script `scripts/seed-test-data.ts`, chạy trước E2E
- **Không share state** giữa test cases — mỗi test tự setup và teardown
