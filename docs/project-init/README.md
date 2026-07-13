# Hướng dẫn đọc tài liệu dự án

## Thứ tự đọc khuyến nghị (người mới hoặc AI tham gia dự án)

1. `/CLAUDE.md` — tổng quan dự án, bức tranh toàn cảnh, doc map, kiến trúc 3 service.
2. `/PROJECT_REQUIREMENTS.md` — danh sách đầy đủ chức năng + độ ưu tiên.
3. `/docs/system-design/tech-stack.md` — stack công nghệ (Spring Boot, React, Node.js WebSocket).
4. `/docs/system-design/database-schema.md` — Flyway SQL schema + JPA Entity examples.
5. `/docs/system-design/api-contracts.md` — tất cả REST API endpoints.
6. `/docs/system-design/websocket-events.md` — Socket.io events cho Battle + Messaging.
7. `/docs/features/*.md` — chi tiết nghiệp vụ từng module (Learn, Exam, Battle, Messaging).
8. `/docs/backend/architecture.md` — cấu trúc Spring Boot packages, config, patterns.
9. `/docs/backend/auth-flow.md` — JWT + OAuth2 flow.
10. `/docs/backend/judge-integration.md` — Judge0 + Bull queue.
11. `/docs/frontend/architecture.md` — React, Zustand, routing, WebSocket hooks.
12. `/docs/frontend/pages-and-components.md` — danh sách pages/components theo module.
13. `/docs/testing/test-strategy.md` — chiến lược test + ví dụ code.
14. `/docs/deployment/roadmap.md` — lộ trình 10 phase với **checklist task cụ thể**.

## Bắt đầu làm việc

Sau khi đọc xong tài liệu, bước đầu tiên là setup môi trường:

→ Xem **`/docs/project-init/env-setup.md`** để cài đặt và khởi động tất cả services.
→ Xem **`/docs/project-init/folder-structure.md`** để biết code cần viết vào đâu.
→ Tick các task trong **`/docs/deployment/roadmap.md`** theo từng Phase.
