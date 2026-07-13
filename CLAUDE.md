# CLAUDE.md — Tổng quan dự án: Web Thi Đấu Lập Trình

> File này là **entry point**. Đọc file này trước để nắm bức tranh toàn cảnh, sau đó đi sâu vào từng tài liệu con theo mục "Bản đồ tài liệu" bên dưới.

---

## 1. Mục tiêu dự án

Xây dựng nền tảng **luyện tập + thi đấu lập trình**, cho phép người dùng:
- Học lập trình theo lộ trình có cấu trúc (như W3Schools).
- Làm bài thi cá nhân, được chấm điểm và xếp hạng.
- Thi đấu real-time theo nhóm/phòng với người khác.

Sản phẩm gồm 3 module lõi (Learn / Exam / Battle), hệ thống người dùng, nhắn tin, leaderboard và admin panel.

---

## 2. Ba loại chức năng chính (bức tranh tổng)

| # | Module | Bản chất | Chấm điểm | Xếp hạng | Real-time? |
|---|--------|----------|-----------|----------|------------|
| 1 | **Learn** | Học lý thuyết + code thử, không thi đấu | Pass/Fail theo Code Challenge cuối chương | Không | Không |
| 2 | **Exam** (Ranked Practice) | Làm bài cá nhân, bất kỳ lúc nào, đề cố định dùng chung cho mọi người | AC + thời gian submit (1 bài duy nhất) | Có, **theo từng ngôn ngữ** | Không |
| 3 | **Battle** (Thi đấu nhóm) | Tạo/join phòng tối đa 20 người, thi đồng bộ | AC + tổng điểm + tie-breaker (xem chi tiết ở tài liệu con) | Có, đầy đủ 1–20/trận | **Có** (Socket.io) |

Chi tiết đầy đủ từng module nằm ở `docs/features/`.

---

## 3. Bản đồ tài liệu (Doc Map)

```
CLAUDE.md                              → Bạn đang ở đây (tổng quan)
PROJECT_REQUIREMENTS.md                → Checklist đầy đủ mọi chức năng + độ ưu tiên
docs/
├─ project-init/
│  ├─ README.md                        → Thứ tự đọc tài liệu
│  ├─ env-setup.md                     → Hướng dẫn setup môi trường + .env
│  └─ folder-structure.md              → Cấu trúc thư mục toàn bộ repo
├─ system-design/
│  ├─ tech-stack.md                    → Công nghệ dùng cho FE/BE/DevOps
│  ├─ database-schema.md               → Schema DB (Flyway SQL + JPA entities)
│  ├─ api-contracts.md                 → REST API endpoints đầy đủ
│  └─ websocket-events.md              → Socket.io events (Battle + Messaging)
├─ features/
│  ├─ learn-module.md                  → Chi tiết module Học
│  ├─ exam-module.md                   → Chi tiết module Thi (Ranked Practice)
│  ├─ battle-module.md                 → Chi tiết module Thi Đấu (real-time)
│  └─ messaging.md                     → Chat toàn cầu / riêng / trong phòng
├─ backend/
│  ├─ architecture.md                  → Cấu trúc Spring Boot (packages, modules)
│  ├─ auth-flow.md                     → Flow JWT + OAuth2 (Google/GitHub)
│  └─ judge-integration.md             → Tích hợp Judge0 self-hosted
├─ frontend/
│  ├─ architecture.md                  → Cấu trúc React + Zustand + Routing
│  └─ pages-and-components.md          → Danh sách pages/components theo module
├─ testing/
│  └─ test-strategy.md                 → Chiến lược test (unit/integration/E2E)
└─ deployment/
   └─ roadmap.md                       → Lộ trình 10 phase + checklist chi tiết
```

---

## 4. Trạng thái hiện tại (Progress Snapshot)

| Phase | Nội dung | Trạng thái | % |
|---|---|---|---|
| 1 | Setup & Infrastructure | 🔵 Đang làm | 40% |
| 2 | Learn Module | ⚪ Chưa bắt đầu | 0% |
| 3 | Exam Module | ⚪ Chưa bắt đầu | 0% |
| 4 | Battle Module | ⚪ Chưa bắt đầu | 0% |
| 5–10 | Auth, Messaging, Leaderboard, Polish, QA, Deploy | ⚪ Chưa bắt đầu | 0% |

Chi tiết lộ trình từng tuần và checklist task: xem `docs/deployment/roadmap.md`.

---

## 5. Nguyên tắc thiết kế cốt lõi cần nhớ

- **Learn** không tính giờ, không thi đấu — mục tiêu là hiểu bài.
- **Exam** dùng **1 bộ đề chung** cho tất cả (không tách theo trình độ), nhưng đề có cả câu dễ lẫn câu khó đan xen.
- **Battle** bắt buộc **đồng bộ**: chỉ khi chủ phòng bấm "Bắt đầu" thì `start_time` mới được ghi nhận, phòng **khóa ngay lập tức** (không ai join thêm được).
- Battle tối đa **20 người/phòng**.
- Tie-breaker luôn dựa trên **thời gian**, không bao giờ random.

---

## 6. Ngăn xếp công nghệ (rút gọn — xem đầy đủ ở tech-stack.md)

```
Frontend         : React 18 + TypeScript, Tailwind CSS, Monaco Editor, Socket.io-client
Backend (API)    : Java 21 + Spring Boot 3.x, PostgreSQL (JPA/Hibernate + Flyway), Redis
Auth             : Spring Security + JWT (JJWT) + OAuth2 (Google, GitHub)
WebSocket Service: Node.js 20 + Socket.io 4.x (microservice tách riêng)
Judge Service    : Node.js 20 + Judge0 self-hosted Docker + Bull queue
Hạ tầng         : Docker Compose, GitHub Actions CI/CD, AWS/DigitalOcean
```

**Kiến trúc 3 service:**
```
[Browser] ──REST──►  [Spring Boot :8080]  ──JDBC──► [PostgreSQL]
          ──WS──►    [Node WS :3001]      ──Redis──► [Redis :6379]
[Spring Boot] ──HTTP──► [Judge Service :3002] ──► [Judge0 Docker]
```

---

## 7. Team & Sprint

- Sprint 2 tuần, standup 10:00 hằng ngày, review/retro thứ Sáu 16:00.
- Team gợi ý: 1–2 FE, 1–2 BE (Java), 1 DevOps/Full-stack, 1 QA (từ tuần 15).
- Kênh làm việc: Slack (trao đổi), GitHub Issues/PR (task & review), Jira/Trello (sprint board).
