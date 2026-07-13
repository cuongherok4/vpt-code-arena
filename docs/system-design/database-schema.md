# Database Schema (PostgreSQL)

> Danh sách bảng chính và mục đích. Chi tiết cột đầy đủ sẽ bổ sung khi vào Phase implementation của từng module (xem `docs/05-deployment/roadmap.md`).

| Bảng | Mục đích | Liên quan module |
|---|---|---|
| `users` | Thông tin tài khoản: id, email, password (hash), name, avatar, created_at | User Management |
| `user_stats` | Thống kê tổng hợp: user_id, total_points, rank, total_ac | User / Leaderboard |
| `lessons` | Bài học: id, title, content, order, chapter_id | Learn |
| `problems` | Đề bài dùng chung cho Exam & Battle: id, title, description, difficulty, topic | Exam / Battle |
| `submissions` | Bài nộp ở module Exam: id, user_id, problem_id, code, result, time_submit | Exam |
| `rooms` | Phòng Battle: id, created_by, name, status, start_time, end_time, config | Battle |
| `room_members` | Thành viên phòng: id, room_id, user_id, ready, joined_at | Battle |
| `battle_submissions` | Bài nộp trong trận Battle: id, room_id, user_id, problem_id, result, time_submit | Battle |
| `room_results` | Kết quả cuối trận: id, room_id, user_id, total_points, rank, result_time | Battle |
| `chat_messages` | Tin nhắn: id, user_id, message, room_id (nullable = global chat), type, created_at | Messaging |

## Nguyên tắc thiết kế

- `problems` dùng chung schema cho cả Exam và Battle để tránh trùng lặp dữ liệu đề bài; phân biệt qua bảng submission tương ứng (`submissions` vs `battle_submissions`).
- `rooms.status` chỉ nhận 1 trong 3 giá trị: `WAITING`, `IN_PROGRESS`, `FINISHED`.
- `chat_messages.room_id = NULL` quy ước là Global Chat; có giá trị → Room Chat trong Battle. Private Message cần bảng riêng (`direct_messages`, bổ sung ở Phase 6) nếu tách biệt khỏi `chat_messages`.
- Index bắt buộc: `submissions(user_id, problem_id)`, `battle_submissions(room_id, user_id)`, `room_members(room_id)` — phục vụ tính leaderboard real-time.
- Redis dùng để cache leaderboard (Exam theo ngôn ngữ, Battle real-time trong trận) và lưu trạng thái countdown timer, tránh query PostgreSQL liên tục.
