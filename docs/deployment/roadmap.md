# Roadmap & Tiến độ dự án

## 1. Lộ trình 10 Phase

| Phase | Tuần | Nội dung | Deliverable | Trạng thái | % |
|---|---|---|---|---|---|
| 1 | 1–2 | Setup & Infrastructure | Môi trường dev sẵn sàng, CI/CD chạy được | 🟢 Hoàn thành | 100% |
| 2 | 3–4 | Learn Module | Learn module hoàn chỉnh | ⚪ Chưa bắt đầu | 0% |
| 3 | 5–6 | Exam Module | Exam module hoàn chỉnh | ⚪ Chưa bắt đầu | 0% |
| 4 | 7–9 | Battle Module | Battle module hoàn chỉnh, real-time hoạt động | ⚪ Chưa bắt đầu | 0% |
| 5 | 10–11 | Auth & User Management | Hệ thống user hoàn chỉnh | ⚪ Chưa bắt đầu | 0% |
| 6 | 12–13 | Messaging | Hệ thống nhắn tin hoàn chỉnh | ⚪ Chưa bắt đầu | 0% |
| 7 | 14–15 | Leaderboard & Analytics | Leaderboard & thống kê hoàn chỉnh | ⚪ Chưa bắt đầu | 0% |
| 8 | 16–17 | UI/UX Polish & Optimization | UI mượt, tối ưu performance | ⚪ Chưa bắt đầu | 0% |
| 9 | 18–19 | Testing & QA | Coverage > 80%, bug đã fix | ⚪ Chưa bắt đầu | 0% |
| 10 | 20 | Documentation & Deployment | Deploy production, tài liệu đầy đủ | ⚪ Chưa bắt đầu | 0% |

---

## 2. Checklist chi tiết theo Phase

### Phase 1 — Setup & Infrastructure (Tuần 1–2)

**DevOps / Infrastructure**
- [x] Tạo GitHub repo, branch strategy (main/develop/feature/*)
- [x] Tạo `infrastructure/docker-compose.dev.yml` (PostgreSQL, Redis, Judge0)
- [x] Verify Judge0 chạy được: `curl http://localhost:2358/system_info`
- [x] Setup GitHub Actions: workflow backend-ci.yml + frontend-ci.yml
- [x] Tạo `.gitignore` đầy đủ cho Java, Node.js, React

**Backend (Spring Boot)**
- [x] Khởi tạo project bằng [Spring Initializr](https://start.spring.io) với dependencies trong `tech-stack.md`
- [x] Cấu hình `application.yml` + `application-local.yml`
- [x] Viết `V1__init_schema.sql` (copy từ `database-schema.md`), chạy `./mvnw flyway:migrate`
- [ ] Tạo tất cả JPA Entities + Enums (xem `database-schema.md`)
- [ ] Tạo tất cả Repository interfaces
- [ ] Setup Spring Security cơ bản (permit all để test, lock down sau)
- [ ] Setup SwaggerDoc — verify `http://localhost:8080/swagger-ui.html`
- [ ] Setup Spring Boot Actuator — verify `http://localhost:8080/actuator/health`
- [ ] CI chạy `./mvnw test` pass

**WebSocket Service**
- [x] `npm init` + cài dependencies (socket.io, typescript, ts-node-dev, axios, ioredis)
- [x] Setup TypeScript config
- [x] Entry point `src/index.ts` với health endpoint
- [x] Kết nối Redis

**Judge Service**
- [x] `npm init` + cài dependencies (bull, axios, express, typescript)
- [x] Setup Bull queue cơ bản
- [ ] Test gọi Judge0 API với submission đơn giản

**Frontend**
- [x] `npm create vite@latest frontend -- --template react-ts`
- [x] Cài Tailwind CSS, Shadcn/ui, React Router, Zustand, Axios, React Query
- [x] Cài Monaco Editor (`@monaco-editor/react`)
- [x] Cài Socket.io-client
- [x] Setup Vite proxy (forward `/api` tới Spring Boot để tránh CORS dev)
- [x] Tạo `router/index.tsx` với routes cơ bản
- [x] Tạo Navbar skeleton
- [x] Build pass (`npm run build`)

---

### Phase 2 — Learn Module (Tuần 3–4)

**Backend**
- [ ] `LearnController` với endpoints: GET /chapters, GET /lessons/:id, POST /lessons/:id/complete, POST /lessons/:id/challenge
- [ ] `ChapterService`, `LessonService`, `ProgressService`
- [ ] `ChapterRepository`, `LessonRepository`, `UserProgressRepository`
- [ ] Endpoint `/learn/run-code` — gọi Judge Service (sync, không queue)
- [ ] Seed data: 1 chapter với 5 lessons mẫu (file `V2__seed_learn_data.sql`)
- [ ] Unit tests cho ProgressService (lock/unlock logic)
- [ ] Integration test cho LearnController (GET chapters, POST complete)

**Frontend**
- [ ] `LearnPage` — danh sách chương với sidebar tree
- [ ] `LessonPage` — hiển thị nội dung HTML/Markdown
- [ ] `ChapterTree` component — lock/unlock state
- [ ] `TryItEditor` component (Monaco + [Chạy] button)
- [ ] `CodeChallenge` component (submit + feedback Correct/Wrong)
- [ ] `ProgressBar` component
- [ ] `learn.api.ts` — tất cả API calls
- [ ] Zustand hoặc React Query để cache chapter list

**Verification**
- [ ] Có thể đọc bài học
- [ ] Chạy code và thấy output
- [ ] Nộp challenge → nhận feedback → chương tiếp mở khóa

---

### Phase 3 — Exam Module (Tuần 5–6)

**Backend**
- [ ] `ExamController`: GET /problems, GET /problems/:id, POST /problems/:id/submit, GET /submissions/:id
- [ ] `ExamService`, `SubmissionService`, `LeaderboardService`
- [ ] Async submit: nhận → tạo Submission(PENDING) → gửi Judge Service → return 202
- [ ] Internal callback: `POST /internal/judge-result` cập nhật Submission, invalidate Redis cache
- [ ] `GET /exam/leaderboard?problemId=&language=` với Redis cache (TTL 60s)
- [ ] Seed data: 5–10 đề bài mẫu (dễ/trung bình) (`V3__seed_problems.sql`)
- [ ] Unit tests: LeaderboardService (sort điểm + tie-breaker)
- [ ] Integration tests: submit flow (mock Judge Service)

**Frontend**
- [ ] `ExamListPage` — bảng danh sách + filter + search
- [ ] `ExamProblemPage` — 2-column layout (đề + editor)
- [ ] `ProblemStatement` component (render Markdown)
- [ ] `SubmitPanel` component (CodeEditor + Submit btn + result display)
- [ ] `SubmissionHistory` component
- [ ] `ExamLeaderboard` component (tabs theo ngôn ngữ)
- [ ] Polling kết quả submission mỗi 2s (hoặc nhận qua WebSocket notification)
- [ ] `exam.api.ts`

**Verification**
- [ ] Submit code Java → nhận AC/WA
- [ ] Leaderboard hiển thị đúng thứ tự
- [ ] Submit nhiều lần, lịch sử hiển thị đúng

---

### Phase 4 — Battle Module (Tuần 7–9)

**Backend**
- [ ] `BattleController`: POST /rooms, GET /rooms, POST /rooms/:id/join, POST /rooms/:id/ready, POST /rooms/:id/start, POST /rooms/:id/submit, GET /rooms/:id/leaderboard
- [ ] `BattleService`: createRoom, joinRoom (check WAITING + not full), startRoom (lock + set Redis timer), submitCode (check IN_PROGRESS + not expired)
- [ ] `BattleScheduler`: `@Scheduled(fixedRate=30000)` kiểm tra phòng hết giờ → finishRoom
- [ ] `JudgeCallbackService`: xử lý kết quả Battle submission → tính leaderboard → notify WS Service
- [ ] Xử lý edge case: join sau khi start (403), submit sau khi hết giờ (403)
- [ ] Scoring logic: 100/numProblems per problem, tie-breaker lastAcTime
- [ ] Unit tests cho BattleService (start, join, scoring)
- [ ] Integration tests cho battle lifecycle

**WebSocket Service**
- [ ] `/battle` namespace
- [ ] JWT middleware validate
- [ ] Handlers: `battle:join`, `battle:ready`, `battle:leave`
- [ ] Server events: `battle:started`, `battle:tick`, `battle:leaderboard-update`, `battle:submission-result`, `battle:finished`, `battle:member-joined/left`
- [ ] Redis pub/sub để nhận trigger từ Spring Boot (broadcast leaderboard update, finished)
- [ ] Countdown tick: setInterval mỗi 1s, dừng khi nhận `battle:finished`

**Frontend**
- [ ] `BattleLobbyPage` — danh sách phòng + tạo phòng modal
- [ ] `BattleRoomPage` — member list + ready toggle + start button
- [ ] `BattleArenaPage` — countdown + problem tabs + editor + real-time leaderboard + chat
- [ ] `useBattleSocket` hook (xem `architecture.md`)
- [ ] `CountdownTimer` (đổi màu đỏ khi < 5 phút)
- [ ] `RealTimeLeaderboard` (update khi nhận `battle:leaderboard-update`)
- [ ] `FinalResultModal` (hiện khi `battle:finished`)
- [ ] `battle.api.ts`

**Verification**
- [ ] 2 browser tab: A tạo phòng → B join → A start → cả 2 thấy đề → submit → leaderboard cập nhật → hết giờ → kết quả cuối hiện
- [ ] Join sau khi start → nhận lỗi
- [ ] Disconnect và reconnect → vẫn vào được trận

---

### Phase 5 — Auth & User Management (Tuần 10–11)

**Backend**
- [ ] `AuthController`: register, verify-email, login, refresh, logout, forgot-password, reset-password
- [ ] Spring Security OAuth2: Google + GitHub (xem `auth-flow.md`)
- [ ] `OAuth2SuccessHandler`: upsert user, issue JWT, redirect FE
- [ ] JWT filter, CustomUserDetails
- [ ] Email service: xác thực email, reset password
- [ ] Rate limiting: login 5 lần/phút/IP (Bucket4j)
- [ ] `UserController`: GET /users/me, PUT /users/me, PUT /users/me/password, GET /users/:id, GET /users/me/history
- [ ] Unit tests: AuthService, JwtService, OAuth2Service

**Frontend**
- [ ] `LoginPage` với form + social buttons
- [ ] `RegisterPage`
- [ ] `OAuthCallbackPage` (nhận token từ URL params, lưu store)
- [ ] `ForgotPasswordPage`, `ResetPasswordPage`
- [ ] `ProfilePage` (stats, lịch sử, edit form)
- [ ] Axios interceptor auto refresh token
- [ ] `authStore.ts` hoàn chỉnh

---

### Phase 6 — Messaging (Tuần 12–13)

**Backend**
- [ ] `ChatController`: GET /chat/global, GET /chat/room/:roomId, GET /chat/dm/:userId, GET /chat/dm/conversations
- [ ] Lưu tin nhắn vào DB khi nhận từ WebSocket Service (pub/sub)
- [ ] API report message, admin delete, mute user

**WebSocket Service**
- [ ] `/chat` namespace
- [ ] Handlers: `chat:global:send`, `chat:room:send`, `chat:dm:send`
- [ ] Online status: track connected users trong Redis Set
- [ ] Broadcast `user:online/offline`

**Frontend**
- [ ] `GlobalChatPanel` (collapsible, show khi hover icon)
- [ ] `RoomChatPanel` (trong BattleArenaPage)
- [ ] `DMChatWindow`, `DMConversationList`
- [ ] `OnlineIndicator` component
- [ ] `useChatSocket` hook

---

### Phase 7 — Leaderboard & Analytics (Tuần 14–15)

- [ ] `LeaderboardController`: GET /leaderboard/global (filter type, language)
- [ ] Update `UserStats` sau mỗi submission AC (async)
- [ ] `LeaderboardPage` (React) với filter tabs
- [ ] `StatsCard` + `ActivityCalendar` trong ProfilePage
- [ ] Redis cache leaderboard global (TTL 5 phút)

---

### Phase 8 — UI/UX Polish (Tuần 16–17)

- [ ] Responsive design (mobile-friendly)
- [ ] Dark mode toggle (Tailwind dark:)
- [ ] Loading skeleton cho mọi fetch
- [ ] Error boundary + fallback UI
- [ ] Code splitting (React.lazy + Suspense)
- [ ] Lighthouse performance score > 80

---

### Phase 9 — Testing & QA (Tuần 18–19)

- [ ] Backend coverage báo cáo JaCoCo > 80%
- [ ] Viết thêm test cho các gap
- [ ] E2E Playwright: happy paths cho 4 module
- [ ] Load test: 20 users cùng vào 1 phòng Battle (k6 hoặc Artillery)
- [ ] Security audit: OWASP Top 10 checklist
- [ ] Fix tất cả bugs từ QA

---

### Phase 10 — Deploy & Documentation (Tuần 20)

- [ ] `infrastructure/docker-compose.prod.yml` (full stack)
- [ ] Nginx config (`infrastructure/nginx/nginx.conf`)
- [ ] GitHub Actions deploy to AWS/DigitalOcean
- [ ] Setup domain + HTTPS (Let's Encrypt)
- [ ] Monitoring: Spring Actuator + Prometheus + Grafana
- [ ] README.md hoàn chỉnh (cài đặt, sử dụng)
- [ ] API docs public (Swagger)
- [ ] Go-live checklist bên dưới

---

## 3. Quy trình Sprint

- Sprint 2 tuần. Daily standup 15 phút lúc 10:00 (hôm nay/hôm qua/blocker).
- Sprint Planning: Thứ Hai 9:00. Sprint Review/Retro: Thứ Sáu 16:00.
- Kênh: Slack (trao đổi nhanh), GitHub Issues/PR (task & review), Jira/Trello (sprint board).

---

## 4. Rủi ro chính cần theo dõi

| Rủi ro | Tác động | Xác suất | Giảm thiểu |
|---|---|---|---|
| Judge0 không ổn định | Cao | Trung bình | Self-hosted Docker; test kỹ trước Phase 3 |
| Lỗi đồng bộ real-time (Socket.io) khi đông người | Cao | Trung bình | Load test 20 user, có fallback polling |
| DB chậm khi tải cao | Cao | Thấp | Cache Redis, index đúng chỗ (xem database-schema.md) |
| Spring Security + OAuth2 config phức tạp | Trung bình | Cao | Làm Phase 5 riêng, test kỹ từng flow |
| Scope creep | Cao | Cao | Bám sát độ ưu tiên trong PROJECT_REQUIREMENTS.md |

---

## 5. Checklist trước khi launch

- [ ] Cả 10 phase hoàn thành
- [ ] Test coverage > 80% (backend) + E2E pass
- [ ] Load test: 100 concurrent users không crash
- [ ] Security audit: không có lỗ hổng CRITICAL/HIGH
- [ ] HTTPS bật, không có HTTP endpoint nào exposed
- [ ] Backup PostgreSQL đã setup và test restore
- [ ] Monitoring & alerting đã bật (Grafana dashboard)
- [ ] README.md hoàn chỉnh
- [ ] API docs public
- [ ] Go-live checklist đã ký duyệt
