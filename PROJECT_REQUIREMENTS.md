# PROJECT REQUIREMENTS — Danh sách chức năng & độ ưu tiên

> Tài liệu này gộp và loại bỏ trùng lặp giữa các checklist chức năng cũ. Chi tiết flow/UI của từng module lớn (Learn, Exam, Battle) nằm ở `docs/features/`; file này chỉ liệt kê **phạm vi chức năng** để tra cứu nhanh.

---

## I. Người dùng (User Management)

- Đăng ký (email + password), xác thực email, đăng nhập, quên/đặt lại mật khẩu, đăng xuất
- Hồ sơ cá nhân: tên, email, avatar, bio, ngôn ngữ lập trình ưa thích
- Thống kê cá nhân: tổng điểm, hạng, số bài AC/WA, tỉ lệ AC, ngôn ngữ yêu thích
- Lịch sử: bài học đã học, bài thi đã làm, trận đấu đã tham gia

## II. Learn Module

Xem chi tiết đầy đủ: `docs/features/learn-module.md`

- Cây menu chương trình học (nhóm lớn → bài học nhỏ, tuyến tính)
- Lock/unlock chương theo tiến độ
- Mini code editor "Try it Yourself" (chạy code trực tiếp trong bài)
- Code Challenge cuối chương, auto-grade, mở khóa chương tiếp theo khi pass
- Progress tracking: % hoàn thành, badge, thời gian học

## III. Exam Module (Ranked Practice)

Xem chi tiết đầy đủ: `docs/features/exam-module.md`

- Danh sách đề thi, filter theo độ khó/chủ đề
- Làm bài không giới hạn thời gian, submit nhiều lần, xem lại lịch sử submit
- Chấm điểm: AC = full điểm, WA/TLE/RE = 0 điểm
- Leaderboard riêng theo từng ngôn ngữ, sort điểm → thời gian submit
- Bộ đề dùng chung cho mọi trình độ (mix độ khó)

## IV. Battle Module (Thi đấu real-time)

Xem chi tiết đầy đủ: `docs/features/battle-module.md`

- Tạo phòng (tên, số bài, thời gian code, độ khó, công khai/riêng tư), tối đa 20 người
- Vòng đời phòng: `WAITING → IN_PROGRESS → FINISHED`
- Khóa phòng ngay khi bắt đầu, không cho join thêm
- Code editor real-time, submit → chấm → cập nhật leaderboard ngay
- Countdown timer đồng bộ server, tự đóng submit khi hết giờ
- Chấm điểm + tie-breaker theo thời gian (xem công thức chi tiết trong file module)
- Xử lý edge case: join muộn, disconnect, chủ phòng disconnect, quên bấm bắt đầu

## V. Messaging

Xem chi tiết đầy đủ: `docs/features/messaging.md`

- Global Chat: 1 kênh duy nhất toàn hệ thống, mute/block/report/admin moderate
- Private Message: chat 1-1, lịch sử, online status
- Room Chat: chat trong phòng Battle khi đang thi đấu

## VI. Chức năng bổ trợ

- **Leaderboard toàn hệ thống**: filter theo ngôn ngữ, theo loại (Exam/Battle), badge/achievement
- **Search & Filter**: bài tập, người dùng, phòng thi đấu (theo độ khó/chủ đề/ngôn ngữ)
- **Notification**: trận bắt đầu, có người join phòng, tin nhắn mới, hoàn thành chương
- **Settings**: đổi mật khẩu, ngôn ngữ hiển thị, bật/tắt thông báo, riêng tư profile, dark/light mode

## VII. Admin Panel

- Quản lý người dùng: ban/unban, xóa account, xem log
- Quản lý đề bài: tạo/sửa/xóa bài tập, test case, độ khó, chủ đề
- Moderation: xóa message, mute/ban spam, review report, log hoạt động
- Thống kê hệ thống: tổng user, tổng bài tập, tổng submission, active users

---

## Bảng độ ưu tiên

| Chức năng | Độ ưu tiên | Nhóm |
|-----------|:---:|---|
| Đăng ký / Đăng nhập | 🔴 Cao | Core |
| Learn Module | 🔴 Cao | Core |
| Exam Module | 🔴 Cao | Core |
| Battle Module | 🔴 Cao | Core |
| User Profile | 🟡 Trung | MVP |
| Leaderboard | 🟡 Trung | MVP |
| Global Chat / Private Message | 🟡 Trung | MVP |
| Admin Panel | 🟢 Thấp | Phase 2 |
| Dark mode | 🟢 Thấp | Phase 3 |

**Tổng kết theo giai đoạn:**
- **Core**: User + Learn + Exam + Battle + Chat cơ bản
- **MVP**: Profile + Leaderboard + Messaging
- **Phase 2**: Admin Panel + Moderation nâng cao
- **Phase 3**: Analytics + Achievements + Social features
