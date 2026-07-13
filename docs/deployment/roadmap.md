# Roadmap & Tiến độ dự án

## 1. Lộ trình 10 Phase

| Phase | Tuần | Nội dung | Deliverable | Trạng thái | % |
|---|---|---|---|---|---|
| 1 | 1–2 | Setup & Infrastructure (Git, structure, DB schema, Docker, CI/CD, hosting) | Môi trường dev sẵn sàng, CI/CD chạy được | 🔵 Đang làm | 40% |
| 2 | 3–4 | Learn Module (BE: lessons/progress API, mini code runner; FE: lesson page, Monaco, progress UI) | Learn module hoàn chỉnh | ⚪ Chưa bắt đầu | 0% |
| 3 | 5–6 | Exam Module (BE: Judge0/Docker, scoring, leaderboard API; FE: problem list, editor, leaderboard) | Exam module hoàn chỉnh | ⚪ Chưa bắt đầu | 0% |
| 4 | 7–9 | Battle Module (BE: Socket.io, room lifecycle, lock room, scoring + tie-breaker; FE: lobby, in-progress UI, real-time leaderboard) | Battle module hoàn chỉnh, real-time hoạt động | ⚪ Chưa bắt đầu | 0% |
| 5 | 10–11 | Auth & User Management (đăng ký, JWT, reset password, profile, stats) | Hệ thống user hoàn chỉnh | ⚪ Chưa bắt đầu | 0% |
| 6 | 12–13 | Messaging (Global Chat, Private Message, Room Chat, moderation) | Hệ thống nhắn tin hoàn chỉnh | ⚪ Chưa bắt đầu | 0% |
| 7 | 14–15 | Leaderboard & Analytics (global/language/type leaderboard, history, badges) | Leaderboard & thống kê hoàn chỉnh | ⚪ Chưa bắt đầu | 0% |
| 8 | 16–17 | UI/UX Polish & Optimization (responsive, dark mode, code splitting, a11y) | UI mượt, tối ưu performance | ⚪ Chưa bắt đầu | 0% |
| 9 | 18–19 | Testing & QA (unit, integration, E2E, security, load testing) | Test coverage > 80%, bug đã fix | ⚪ Chưa bắt đầu | 0% |
| 10 | 20 | Documentation & Deployment (API docs, hướng dẫn, go-live) | Deploy production, tài liệu đầy đủ | ⚪ Chưa bắt đầu | 0% |

## 2. Quy trình Sprint

- Sprint 2 tuần. Daily standup 15 phút lúc 10:00 (hôm nay/hôm qua/blocker).
- Sprint Planning: Thứ Hai 9:00. Sprint Review/Retro: Thứ Sáu 16:00.
- Kênh: Slack (trao đổi nhanh), GitHub Issues/PR (task & review), Jira/Trello (sprint board), Confluence (tài liệu), Zoom (họp).

### Mẫu task ngày (rút gọn)
Mỗi ngày, mỗi role (Backend/Frontend/DevOps) liệt kê task theo độ ưu tiên, kèm estimate giờ và dependency. Cuối ngày checklist: task xong hoặc dời sang ngày sau kèm lý do, code đã push + PR tạo review, CI/CD pass, blocker ghi vào Slack, cập nhật board.

## 3. Team

```
Frontend (1–2)  : React components, UI/UX, Socket.io client, performance
Backend (1–2)   : API, DB, code execution engine, Socket.io server
DevOps/Full-stack (1) : Docker/AWS, CI/CD, DB management, monitoring
QA (1, từ tuần 15+)   : Manual + automated testing, bug tracking
```

## 4. Rủi ro chính cần theo dõi

| Rủi ro | Tác động | Xác suất | Giảm thiểu |
|---|---|---|---|
| Judge0 không ổn định | Cao | Trung bình | Chuẩn bị sẵn phương án Docker sandbox tự build |
| Lỗi đồng bộ real-time (Socket.io) khi đông người | Cao | Trung bình | Load test, có fallback polling |
| DB chậm khi tải cao | Cao | Thấp | Cache Redis, đánh index đúng chỗ (xem database-schema.md) |
| Thành viên team vắng | Trung bình | Thấp | Chia sẻ kiến thức, giữ tài liệu luôn cập nhật |
| Scope creep | Cao | Cao | Bám sát độ ưu tiên trong PROJECT_REQUIREMENTS.md, kỷ luật sprint |
| Lỗ hổng bảo mật | Nghiêm trọng | Trung bình | Security audit trước khi go-live |

## 5. Checklist trước khi launch

- [ ] Cả 10 phase hoàn thành
- [ ] Test coverage > 80%
- [ ] Audit performance + security đạt
- [ ] Tài liệu người dùng hoàn chỉnh
- [ ] Monitoring & alerting đã bật
- [ ] Backup & disaster recovery đã kiểm thử
- [ ] Go-live checklist đã ký duyệt
