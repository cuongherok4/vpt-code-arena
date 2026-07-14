# Roadmap & Tiến độ dự án

---

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

## 2. Branch Strategy & Naming Convention

```
main
 └── develop
      └── feature/<phase>-<feature-name>    ← làm việc ở đây
```

**Quy tắc:**
- Tất cả feature branch checkout từ `develop`
- Mỗi feature branch tương ứng 1 nhóm công việc có thể review độc lập
- Sau khi branch hoàn thành → mở **Pull Request** vào `develop`
- Sau khi Phase hoàn thành → merge `develop` vào `main` + tag phiên bản

**Lệnh cơ bản:**
```bash
# Tạo feature branch
git checkout develop
git checkout -b feature/<phase>-<feature-name>

# Commit và push
git add .
git commit -m "feat(<scope>): <mô tả>"
git push origin feature/<phase>-<feature-name>

# Sau khi merge xong → xoá branch local
git branch -d feature/<phase>-<feature-name>
```

---

## 3. Checklist chi tiết theo Phase & Feature Branch

---

### Phase 1 — Setup & Infrastructure (Tuần 1–2) ✅ 100%

> Tất cả branch Phase 1 đã merge vào `develop`.

| Feature Branch | Nội dung | Trạng thái |
|---|---|---|
| `feature/p1-devops-setup` | GitHub repo, docker-compose, CI/CD workflow | 🟢 Done |
| `feature/p1-backend-init` | Spring Boot init, Entities, Repositories, Security cơ bản | 🟢 Done |
| `feature/p1-websocket-init` | WebSocket service setup, Redis connect | 🟢 Done |
| `feature/p1-judge-service` | Judge Service, Bull queue, test Judge0 API | 🟢 Done |
| `feature/p1-frontend-init` | Vite + React setup, Monaco, routing, Navbar skeleton | 🟢 Done |

---

### Phase 2 — Learn Module (Tuần 3–4) ⚪ 0%

| # | Feature Branch | Nội dung | Trạng thái |
|---|---|---|---|
| 2.1 | `feature/p2-learn-backend-domain` | Entities (Chapter, Lesson, UserProgress), Repository, Flyway `V2__seed_learn_data.sql` | ⚪ Chưa bắt đầu |
| 2.2 | `feature/p2-learn-backend-api` | `LearnController`, `ChapterService`, `LessonService`, `ProgressService`, endpoint `/learn/run-code` | ⚪ Chưa bắt đầu |
| 2.3 | `feature/p2-learn-backend-tests` | Unit tests `ProgressService`, Integration test `LearnController` | ⚪ Chưa bắt đầu |
| 2.4 | `feature/p2-learn-frontend-pages` | `LearnPage`, `LessonPage`, `ChapterTree` component | ⚪ Chưa bắt đầu |
| 2.5 | `feature/p2-learn-frontend-editor` | `TryItEditor`, `CodeChallenge`, `ProgressBar`, `learn.api.ts`, Zustand/React Query | ⚪ Chưa bắt đầu |

**Thứ tự thực hiện:** 2.1 → 2.2 → 2.3 (song song với 2.4) → 2.5 → merge `develop`

---

### Phase 3 — Exam Module (Tuần 5–6) ⚪ 0%

| # | Feature Branch | Nội dung | Trạng thái |
|---|---|---|---|
| 3.1 | `feature/p3-exam-backend-domain` | Problem entity nếu cần mở rộng, Flyway `V3__seed_problems.sql` (5–10 đề mẫu) | ⚪ Chưa bắt đầu |
| 3.2 | `feature/p3-exam-backend-submit` | `ExamController`, `SubmissionService`, async submit flow (PENDING → Judge → callback), `POST /internal/judge-result` | ⚪ Chưa bắt đầu |
| 3.3 | `feature/p3-exam-backend-leaderboard` | `LeaderboardService`, `GET /exam/leaderboard` với Redis cache TTL 60s | ⚪ Chưa bắt đầu |
| 3.4 | `feature/p3-exam-backend-tests` | Unit tests LeaderboardService, Integration tests submit flow (mock Judge) | ⚪ Chưa bắt đầu |
| 3.5 | `feature/p3-exam-frontend-list` | `ExamListPage`, `ProblemStatement` component, `exam.api.ts` | ⚪ Chưa bắt đầu |
| 3.6 | `feature/p3-exam-frontend-problem` | `ExamProblemPage`, `SubmitPanel`, `SubmissionHistory`, `ExamLeaderboard`, polling / WS notification | ⚪ Chưa bắt đầu |

**Thứ tự thực hiện:** 3.1 → 3.2 → 3.3 → 3.4 (song song với 3.5) → 3.6 → merge `develop`

---

### Phase 4 — Battle Module (Tuần 7–9) ⚪ 0%

| # | Feature Branch | Nội dung | Trạng thái |
|---|---|---|---|
| 4.1 | `feature/p4-battle-backend-room` | `BattleController` (CRUD phòng), `BattleService` (createRoom, joinRoom, startRoom), edge cases (join sau start, submit hết giờ) | ⚪ Chưa bắt đầu |
| 4.2 | `feature/p4-battle-backend-scoring` | `JudgeCallbackService`, scoring logic, `BattleScheduler` (@Scheduled check hết giờ → finishRoom) | ⚪ Chưa bắt đầu |
| 4.3 | `feature/p4-battle-backend-tests` | Unit tests BattleService (start, join, scoring), Integration tests battle lifecycle | ⚪ Chưa bắt đầu |
| 4.4 | `feature/p4-battle-websocket` | `/battle` namespace, JWT middleware, handlers (`battle:join/ready/leave`), server events, Redis pub/sub, countdown tick | ⚪ Chưa bắt đầu |
| 4.5 | `feature/p4-battle-frontend-lobby` | `BattleLobbyPage`, `BattleRoomPage` (member list, ready toggle, start button), `battle.api.ts` | ⚪ Chưa bắt đầu |
| 4.6 | `feature/p4-battle-frontend-arena` | `BattleArenaPage`, `useBattleSocket` hook, `CountdownTimer`, `RealTimeLeaderboard`, `FinalResultModal` | ⚪ Chưa bắt đầu |

**Thứ tự thực hiện:** 4.1 → 4.2 → 4.4 (song song) → 4.3 → 4.5 → 4.6 → merge `develop`

---

### Phase 5 — Auth & User Management (Tuần 10–11) ⚪ 0%

| # | Feature Branch | Nội dung | Trạng thái |
|---|---|---|---|
| 5.1 | `feature/p5-auth-jwt` | JWT filter, `CustomUserDetails`, `AuthController` (register, login, refresh, logout), `authStore.ts` cơ bản | ⚪ Chưa bắt đầu |
| 5.2 | `feature/p5-auth-oauth2` | Spring Security OAuth2 Google + GitHub, `OAuth2SuccessHandler` (upsert user, issue JWT, redirect FE), `OAuthCallbackPage` | ⚪ Chưa bắt đầu |
| 5.3 | `feature/p5-auth-email` | Email service: xác thực email, forgot/reset password, endpoints `verify-email`, `forgot-password`, `reset-password` | ⚪ Chưa bắt đầu |
| 5.4 | `feature/p5-auth-security` | Rate limiting (Bucket4j login 5 lần/phút/IP), security hardening, Unit tests AuthService/JwtService/OAuth2Service | ⚪ Chưa bắt đầu |
| 5.5 | `feature/p5-user-profile` | `UserController` (GET/PUT /users/me, history), `ProfilePage`, `LoginPage`, `RegisterPage`, `ForgotPasswordPage`, Axios interceptor auto-refresh | ⚪ Chưa bắt đầu |

**Thứ tự thực hiện:** 5.1 → 5.2 → 5.3 → 5.4 (song song với 5.5) → merge `develop`

---

### Phase 6 — Messaging (Tuần 12–13) ⚪ 0%

| # | Feature Branch | Nội dung | Trạng thái |
|---|---|---|---|
| 6.1 | `feature/p6-chat-backend` | `ChatController` (history global/room/dm/conversations), lưu tin nhắn từ WS pub/sub, API report/delete/mute | ⚪ Chưa bắt đầu |
| 6.2 | `feature/p6-chat-websocket` | `/chat` namespace, handlers (global/room/dm send), online status Redis Set, broadcast `user:online/offline` | ⚪ Chưa bắt đầu |
| 6.3 | `feature/p6-chat-frontend` | `GlobalChatPanel`, `RoomChatPanel`, `DMChatWindow`, `DMConversationList`, `OnlineIndicator`, `useChatSocket` hook | ⚪ Chưa bắt đầu |

**Thứ tự thực hiện:** 6.1 → 6.2 (song song) → 6.3 → merge `develop`

---

### Phase 7 — Leaderboard & Analytics (Tuần 14–15) ⚪ 0%

| # | Feature Branch | Nội dung | Trạng thái |
|---|---|---|---|
| 7.1 | `feature/p7-leaderboard-backend` | `LeaderboardController` (GET /leaderboard/global, filter type/language), update `UserStats` async sau AC, Redis cache TTL 5 phút | ⚪ Chưa bắt đầu |
| 7.2 | `feature/p7-leaderboard-frontend` | `LeaderboardPage` với filter tabs, `StatsCard`, `ActivityCalendar` trong ProfilePage | ⚪ Chưa bắt đầu |

**Thứ tự thực hiện:** 7.1 → 7.2 → merge `develop`

---

### Phase 8 — UI/UX Polish (Tuần 16–17) ⚪ 0%

| # | Feature Branch | Nội dung | Trạng thái |
|---|---|---|---|
| 8.1 | `feature/p8-responsive` | Responsive design toàn bộ pages, mobile-friendly breakpoints | ⚪ Chưa bắt đầu |
| 8.2 | `feature/p8-darkmode` | Dark mode toggle (Tailwind `dark:`), persist localStorage | ⚪ Chưa bắt đầu |
| 8.3 | `feature/p8-ux-enhancement` | Loading skeleton, Error boundary + fallback UI, Code splitting (React.lazy + Suspense) | ⚪ Chưa bắt đầu |
| 8.4 | `feature/p8-performance` | Lighthouse audit, tối ưu bundle size, lazy load images, đạt score > 80 | ⚪ Chưa bắt đầu |

**Thứ tự thực hiện:** 8.1 || 8.2 || 8.3 → 8.4 → merge `develop`

---

### Phase 9 — Testing & QA (Tuần 18–19) ⚪ 0%

| # | Feature Branch | Nội dung | Trạng thái |
|---|---|---|---|
| 9.1 | `feature/p9-backend-coverage` | Bổ sung unit/integration tests để đạt JaCoCo > 80%, fix các gap | ⚪ Chưa bắt đầu |
| 9.2 | `feature/p9-e2e-playwright` | E2E Playwright: happy paths cho 4 module (Learn, Exam, Battle, Auth) | ⚪ Chưa bắt đầu |
| 9.3 | `feature/p9-load-test` | Load test k6/Artillery: 20 users cùng vào 1 phòng Battle, 100 concurrent users | ⚪ Chưa bắt đầu |
| 9.4 | `feature/p9-security-audit` | OWASP Top 10 checklist, fix tất cả bugs từ QA, security hardening | ⚪ Chưa bắt đầu |

**Thứ tự thực hiện:** 9.1 || 9.2 || 9.3 → 9.4 → merge `develop`

---

### Phase 10 — Deploy & Documentation (Tuần 20) ⚪ 0%

| # | Feature Branch | Nội dung | Trạng thái |
|---|---|---|---|
| 10.1 | `feature/p10-docker-prod` | `docker-compose.prod.yml`, Nginx config (`infrastructure/nginx/nginx.conf`) | ⚪ Chưa bắt đầu |
| 10.2 | `feature/p10-ci-cd-deploy` | GitHub Actions deploy to AWS/DigitalOcean, domain + HTTPS (Let's Encrypt) | ⚪ Chưa bắt đầu |
| 10.3 | `feature/p10-monitoring` | Spring Actuator + Prometheus + Grafana dashboard, alerting | ⚪ Chưa bắt đầu |
| 10.4 | `feature/p10-docs-final` | README.md hoàn chỉnh, API docs public (Swagger), go-live checklist | ⚪ Chưa bắt đầu |

**Thứ tự thực hiện:** 10.1 → 10.2 → 10.3 → 10.4 → merge `develop` → merge `main` + tag `v1.0.0`

---

## 4. Quy trình Sprint

- Sprint 2 tuần. Daily standup 15 phút lúc 10:00 (hôm nay/hôm qua/blocker).
- Sprint Planning: Thứ Hai 9:00. Sprint Review/Retro: Thứ Sáu 16:00.
- Kênh: Slack (trao đổi nhanh), GitHub Issues/PR (task & review), Jira/Trello (sprint board).

---

## 5. Rủi ro chính cần theo dõi

| Rủi ro | Tác động | Xác suất | Giảm thiểu |
|---|---|---|---|
| Judge0 không ổn định | Cao | Trung bình | Self-hosted Docker; test kỹ trước Phase 3 |
| Lỗi đồng bộ real-time (Socket.io) khi đông người | Cao | Trung bình | Load test 20 user, có fallback polling |
| DB chậm khi tải cao | Cao | Thấp | Cache Redis, index đúng chỗ (xem database-schema.md) |
| Spring Security + OAuth2 config phức tạp | Trung bình | Cao | Làm Phase 5 riêng, test kỹ từng flow |
| Scope creep | Cao | Cao | Bám sát độ ưu tiên trong PROJECT_REQUIREMENTS.md |

---

## 6. Checklist trước khi launch

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
