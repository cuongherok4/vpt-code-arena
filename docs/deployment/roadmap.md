# Roadmap & Tiến độ dự án

---

## 1. Lộ trình 10 Phase

| Phase | Tuần | Nội dung | Deliverable | Trạng thái | % |
|---|---|---|---|---|---|
| 1 | 1–2 | Setup & Infrastructure | Môi trường dev sẵn sàng, CI/CD chạy được | 🟢 Hoàn thành | 100% |
| 2 | 3–4 | Learn Module | Learn module hoàn chỉnh | 🟡 Đang làm | 40% |
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

| Feature Branch | Nội dung | Kết quả đạt được | Trạng thái |
|---|---|---|---|
| `feature/p1-devops-setup` | GitHub repo, docker-compose, CI/CD workflow | Repo chuẩn, `docker-compose up` chạy được toàn bộ stack, CI lint/build tự động | 🟢 Done |
| `feature/p1-backend-init` | Spring Boot init, Entities, Repositories, Security cơ bản | Ứng dụng Spring Boot khởi động, kết nối DB, toàn bộ Entity đã map | 🟢 Done |
| `feature/p1-websocket-init` | WebSocket service setup, Redis connect | WebSocket server kết nối được, Redis pub/sub hoạt động | 🟢 Done |
| `feature/p1-judge-service` | Judge Service, Bull queue, test Judge0 API | Submit code → nhận kết quả từ Judge0, queue xử lý được | 🟢 Done |
| `feature/p1-frontend-init` | Vite + React setup, Monaco, routing, Navbar skeleton | FE chạy được, Monaco Editor render, routing điều hướng đúng | 🟢 Done |

**✅ Phase 1 hoàn thành — Hệ thống có thể:**
- Khởi động toàn bộ stack (DB, Redis, Backend, Frontend) bằng 1 lệnh
- Chạy code và nhận kết quả từ Judge0
- Điều hướng cơ bản trên giao diện

---

### Phase 2 — Learn Module (Tuần 3–4) 🟡 40%

| # | Feature Branch | Nội dung | Kết quả đạt được | Trạng thái |
|---|---|---|---|---|
| 2.1 | `feature/p2-learn-backend-domain` | Entities (Chapter, Lesson, UserProgress), Repository, Flyway `V2__seed_learn_data.sql` | Schema DB đầy đủ, seed data có sẵn để test, query cơ bản hoạt động | 🟢 Done |
| 2.2 | `feature/p2-learn-backend-api` | `LearnController`, `ChapterService`, `LessonService`, `ProgressService`, endpoint `/learn/run-code` | 5 endpoint REST hoạt động, progress user được lưu, code chạy qua Judge0, không N+1 query | 🟢 Done |
| 2.3 | `feature/p2-learn-backend-tests` | Unit tests `ProgressService`, Integration test `LearnController` | **Hoàn thành:** Coverage >90% cho Learn module, security mock được xử lý | 🟢 Done |
| 2.4 | `feature/p2-learn-frontend-pages` | `LearnPage`, `LessonPage`, `ChapterTree` component | **Hoàn thành:** Danh sách chapter/lesson, progress bar, điều hướng bài học, mark complete, lazy loading | 🟢 Done |
| 2.5 | `feature/p2-learn-frontend-editor` | `TryItEditor`, `CodeChallenge`, `ProgressBar`, `learn.api.ts`, Zustand/React Query | User chạy code trực tiếp, submit challenge, tiến độ hiển thị real-time | ⚪ Chưa bắt đầu |

**Thứ tự thực hiện:** 2.1 → 2.2 → 2.3 (song song với 2.4) → 2.5 → merge `develop`

**🎯 Phase 2 hoàn thành — Hệ thống có thể:**
- Hiển thị danh sách bài học có phân nhóm theo chương
- Theo dõi tiến độ học từng bài của user
- Chạy code thử (Try It) và submit challenge với auto-grading
- Đánh dấu bài học là "đã hoàn thành"

---

### Phase 3 — Exam Module (Tuần 5–6) ⚪ 0%

| # | Feature Branch | Nội dung | Kết quả đạt được | Trạng thái |
|---|---|---|---|---|
| 3.1 | `feature/p3-exam-backend-domain` | Problem entity nếu cần mở rộng, Flyway `V3__seed_problems.sql` (5–10 đề mẫu) | DB có sẵn 5–10 bài thi, có thể query và filter được | ⚪ Chưa bắt đầu |
| 3.2 | `feature/p3-exam-backend-submit` | `ExamController`, `SubmissionService`, async submit flow (PENDING → Judge → callback), `POST /internal/judge-result` | Submit code → chờ Judge0 → cập nhật kết quả tự động, không block request | ⚪ Chưa bắt đầu |
| 3.3 | `feature/p3-exam-backend-leaderboard` | `LeaderboardService`, `GET /exam/leaderboard` với Redis cache TTL 60s | Leaderboard trả về < 100ms nhờ Redis cache, tự động invalidate | ⚪ Chưa bắt đầu |
| 3.4 | `feature/p3-exam-backend-tests` | Unit tests LeaderboardService, Integration tests submit flow (mock Judge) | Submit flow test được end-to-end với mock, không cần Judge0 thật | ⚪ Chưa bắt đầu |
| 3.5 | `feature/p3-exam-frontend-list` | `ExamListPage`, `ProblemStatement` component, `exam.api.ts` | User thấy danh sách đề thi, đọc đề bài rõ ràng | ⚪ Chưa bắt đầu |
| 3.6 | `feature/p3-exam-frontend-problem` | `ExamProblemPage`, `SubmitPanel`, `SubmissionHistory`, `ExamLeaderboard`, polling / WS notification | User submit code, xem kết quả ngay, thấy lịch sử submit và bảng xếp hạng | ⚪ Chưa bắt đầu |

**Thứ tự thực hiện:** 3.1 → 3.2 → 3.3 → 3.4 (song song với 3.5) → 3.6 → merge `develop`

**🎯 Phase 3 hoàn thành — Hệ thống có thể:**
- Hiển thị danh sách bài tập lập trình
- Submit code → nhận kết quả Accepted/Wrong Answer tự động qua Judge0
- Xem bảng xếp hạng theo bài thi, tự động refresh
- Xem lịch sử các lần submit của bản thân

---

### Phase 4 — Battle Module (Tuần 7–9) ⚪ 0%

| # | Feature Branch | Nội dung | Kết quả đạt được | Trạng thái |
|---|---|---|---|---|
| 4.1 | `feature/p4-battle-backend-room` | `BattleController` (CRUD phòng), `BattleService` (createRoom, joinRoom, startRoom), edge cases (join sau start, submit hết giờ) | Tạo/join/start phòng được, các edge case xử lý đúng | ⚪ Chưa bắt đầu |
| 4.2 | `feature/p4-battle-backend-scoring` | `JudgeCallbackService`, scoring logic, `BattleScheduler` (@Scheduled check hết giờ → finishRoom) | Điểm tính đúng theo thứ tự AC, phòng tự kết thúc sau timeout | ⚪ Chưa bắt đầu |
| 4.3 | `feature/p4-battle-backend-tests` | Unit tests BattleService (start, join, scoring), Integration tests battle lifecycle | Toàn bộ vòng đời battle (create → join → start → finish) test được tự động | ⚪ Chưa bắt đầu |
| 4.4 | `feature/p4-battle-websocket` | `/battle` namespace, JWT middleware, handlers (`battle:join/ready/leave`), server events, Redis pub/sub, countdown tick | Real-time sync trạng thái phòng giữa tất cả client, countdown chạy đồng bộ | ⚪ Chưa bắt đầu |
| 4.5 | `feature/p4-battle-frontend-lobby` | `BattleLobbyPage`, `BattleRoomPage` (member list, ready toggle, start button), `battle.api.ts` | User tạo/join phòng, thấy danh sách thành viên real-time, toggle ready | ⚪ Chưa bắt đầu |
| 4.6 | `feature/p4-battle-frontend-arena` | `BattleArenaPage`, `useBattleSocket` hook, `CountdownTimer`, `RealTimeLeaderboard`, `FinalResultModal` | User code trong phòng thi, thấy đồng hồ đếm ngược, bảng xếp hạng live, kết quả cuối | ⚪ Chưa bắt đầu |

**Thứ tự thực hiện:** 4.1 → 4.2 → 4.4 (song song) → 4.3 → 4.5 → 4.6 → merge `develop`

**🎯 Phase 4 hoàn thành — Hệ thống có thể:**
- Tạo phòng battle, mời bạn join bằng code phòng
- Thi đấu real-time: đồng hồ đếm ngược, bảng xếp hạng cập nhật tức thì
- Tự động kết thúc phòng sau timeout, hiện kết quả và xếp hạng cuối cùng
- Hỗ trợ 20+ users đồng thời trong 1 phòng

---

### Phase 5 — Auth & User Management (Tuần 10–11) ⚪ 0%

| # | Feature Branch | Nội dung | Kết quả đạt được | Trạng thái |
|---|---|---|---|---|
| 5.1 | `feature/p5-auth-jwt` | JWT filter, `CustomUserDetails`, `AuthController` (register, login, refresh, logout), `authStore.ts` cơ bản | Đăng ký/đăng nhập bằng email+password, token tự refresh, logout revoke token | ⚪ Chưa bắt đầu |
| 5.2 | `feature/p5-auth-oauth2` | Spring Security OAuth2 Google + GitHub, `OAuth2SuccessHandler` (upsert user, issue JWT, redirect FE), `OAuthCallbackPage` | Đăng nhập bằng Google/GitHub 1 click, tự tạo account nếu lần đầu | ⚪ Chưa bắt đầu |
| 5.3 | `feature/p5-auth-email` | Email service: xác thực email, forgot/reset password, endpoints `verify-email`, `forgot-password`, `reset-password` | Email xác thực gửi được, flow reset password hoàn chỉnh | ⚪ Chưa bắt đầu |
| 5.4 | `feature/p5-auth-security` | Rate limiting (Bucket4j login 5 lần/phút/IP), security hardening, Unit tests AuthService/JwtService/OAuth2Service | Login bị chặn sau 5 lần sai, không có lỗ hổng auth cơ bản | ⚪ Chưa bắt đầu |
| 5.5 | `feature/p5-user-profile` | `UserController` (GET/PUT /users/me, history), `ProfilePage`, `LoginPage`, `RegisterPage`, `ForgotPasswordPage`, Axios interceptor auto-refresh | User xem/sửa profile, thấy lịch sử submit, token tự refresh không cần re-login | ⚪ Chưa bắt đầu |

**Thứ tự thực hiện:** 5.1 → 5.2 → 5.3 → 5.4 (song song với 5.5) → merge `develop`

**🎯 Phase 5 hoàn thành — Hệ thống có thể:**
- Đăng ký/đăng nhập bằng email hoặc OAuth2 (Google/GitHub)
- Xác thực email, reset password qua email
- Xem và chỉnh sửa profile, lịch sử hoạt động
- Bảo vệ endpoint theo role, chặn brute-force login

---

### Phase 6 — Messaging (Tuần 12–13) ⚪ 0%

| # | Feature Branch | Nội dung | Kết quả đạt được | Trạng thái |
|---|---|---|---|---|
| 6.1 | `feature/p6-chat-backend` | `ChatController` (history global/room/dm/conversations), lưu tin nhắn từ WS pub/sub, API report/delete/mute | API lấy lịch sử chat hoạt động, tin nhắn được lưu DB, có thể report/xóa | ⚪ Chưa bắt đầu |
| 6.2 | `feature/p6-chat-websocket` | `/chat` namespace, handlers (global/room/dm send), online status Redis Set, broadcast `user:online/offline` | Nhắn tin real-time không delay, online indicator hiển thị đúng | ⚪ Chưa bắt đầu |
| 6.3 | `feature/p6-chat-frontend` | `GlobalChatPanel`, `RoomChatPanel`, `DMChatWindow`, `DMConversationList`, `OnlineIndicator`, `useChatSocket` hook | UI chat đầy đủ: global/phòng/DM, biết ai đang online | ⚪ Chưa bắt đầu |

**Thứ tự thực hiện:** 6.1 → 6.2 (song song) → 6.3 → merge `develop`

**🎯 Phase 6 hoàn thành — Hệ thống có thể:**
- Chat global với tất cả người dùng online
- Chat riêng trong phòng battle
- Nhắn tin trực tiếp (DM) 1-1
- Thấy ai đang online, lịch sử tin nhắn

---

### Phase 7 — Leaderboard & Analytics (Tuần 14–15) ⚪ 0%

| # | Feature Branch | Nội dung | Kết quả đạt được | Trạng thái |
|---|---|---|---|---|
| 7.1 | `feature/p7-leaderboard-backend` | `LeaderboardController` (GET /leaderboard/global, filter type/language), update `UserStats` async sau AC, Redis cache TTL 5 phút | Leaderboard global trả về < 100ms, tự cập nhật sau mỗi AC submission | ⚪ Chưa bắt đầu |
| 7.2 | `feature/p7-leaderboard-frontend` | `LeaderboardPage` với filter tabs, `StatsCard`, `ActivityCalendar` trong ProfilePage | User thấy bảng xếp hạng, filter theo ngôn ngữ/loại, thấy calendar hoạt động của bản thân | ⚪ Chưa bắt đầu |

**Thứ tự thực hiện:** 7.1 → 7.2 → merge `develop`

**🎯 Phase 7 hoàn thành — Hệ thống có thể:**
- Hiển thị bảng xếp hạng toàn server, filter được theo ngôn ngữ/loại bài
- Tự cập nhật thống kê sau mỗi submission AC
- Hiển thị activity calendar (GitHub-style) trên trang profile

---

### Phase 8 — UI/UX Polish (Tuần 16–17) ⚪ 0%

| # | Feature Branch | Nội dung | Kết quả đạt được | Trạng thái |
|---|---|---|---|---|
| 8.1 | `feature/p8-responsive` | Responsive design toàn bộ pages, mobile-friendly breakpoints | Giao diện dùng được trên mobile/tablet, không bị overflow | ⚪ Chưa bắt đầu |
| 8.2 | `feature/p8-darkmode` | Dark mode toggle (Tailwind `dark:`), persist localStorage | Chuyển dark/light mode 1 click, nhớ lựa chọn sau khi reload | ⚪ Chưa bắt đầu |
| 8.3 | `feature/p8-ux-enhancement` | Loading skeleton, Error boundary + fallback UI, Code splitting (React.lazy + Suspense) | Không còn blank screen khi load, lỗi hiển thị thân thiện thay vì crash | ⚪ Chưa bắt đầu |
| 8.4 | `feature/p8-performance` | Lighthouse audit, tối ưu bundle size, lazy load images, đạt score > 80 | Lighthouse Performance > 80, bundle < 500KB gzipped | ⚪ Chưa bắt đầu |

**Thứ tự thực hiện:** 8.1 || 8.2 || 8.3 → 8.4 → merge `develop`

**🎯 Phase 8 hoàn thành — Hệ thống có thể:**
- Dùng tốt trên mọi thiết bị (desktop/tablet/mobile)
- Chuyển dark/light mode
- Tải nhanh, Lighthouse score > 80
- Xử lý lỗi graceful, không crash trắng màn hình

---

### Phase 9 — Testing & QA (Tuần 18–19) ⚪ 0%

| # | Feature Branch | Nội dung | Kết quả đạt được | Trạng thái |
|---|---|---|---|---|
| 9.1 | `feature/p9-backend-coverage` | Bổ sung unit/integration tests để đạt JaCoCo > 80%, fix các gap | JaCoCo report ≥ 80% line coverage, không còn uncovered critical path | ⚪ Chưa bắt đầu |
| 9.2 | `feature/p9-e2e-playwright` | E2E Playwright: happy paths cho 4 module (Learn, Exam, Battle, Auth) | 4 happy path test chạy xanh hoàn toàn trên CI | ⚪ Chưa bắt đầu |
| 9.3 | `feature/p9-load-test` | Load test k6/Artillery: 20 users cùng vào 1 phòng Battle, 100 concurrent users | P95 latency < 500ms, không crash dưới 100 concurrent users | ⚪ Chưa bắt đầu |
| 9.4 | `feature/p9-security-audit` | OWASP Top 10 checklist, fix tất cả bugs từ QA, security hardening | Không còn lỗ hổng CRITICAL/HIGH theo OWASP checklist | ⚪ Chưa bắt đầu |

**Thứ tự thực hiện:** 9.1 || 9.2 || 9.3 → 9.4 → merge `develop`

**🎯 Phase 9 hoàn thành — Hệ thống có thể:**
- Vượt 80% test coverage backend
- E2E test tự động chạy xanh trên CI
- Chịu tải 100 concurrent users không crash
- Không có lỗ hổng bảo mật nghiêm trọng

---

### Phase 10 — Deploy & Documentation (Tuần 20) ⚪ 0%

| # | Feature Branch | Nội dung | Kết quả đạt được | Trạng thái |
|---|---|---|---|---|
| 10.1 | `feature/p10-docker-prod` | `docker-compose.prod.yml`, Nginx config (`infrastructure/nginx/nginx.conf`) | Stack production chạy được bằng 1 lệnh, Nginx reverse proxy đúng | ⚪ Chưa bắt đầu |
| 10.2 | `feature/p10-ci-cd-deploy` | GitHub Actions deploy to AWS/DigitalOcean, domain + HTTPS (Let's Encrypt) | Push lên `main` → tự động deploy, HTTPS bật, không có HTTP exposed | ⚪ Chưa bắt đầu |
| 10.3 | `feature/p10-monitoring` | Spring Actuator + Prometheus + Grafana dashboard, alerting | Dashboard Grafana hiển thị CPU/RAM/request rate, alert khi có sự cố | ⚪ Chưa bắt đầu |
| 10.4 | `feature/p10-docs-final` | README.md hoàn chỉnh, API docs public (Swagger), go-live checklist | README đủ để người mới setup được, Swagger public truy cập được | ⚪ Chưa bắt đầu |

**Thứ tự thực hiện:** 10.1 → 10.2 → 10.3 → 10.4 → merge `develop` → merge `main` + tag `v1.0.0`

**🎯 Phase 10 hoàn thành — Hệ thống có thể:**
- Deploy production tự động qua CI/CD khi push lên `main`
- Truy cập qua domain thật với HTTPS
- Theo dõi health/performance qua Grafana
- Onboard developer mới chỉ bằng README

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
