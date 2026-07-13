# Module: Messaging (Nhắn tin)

## 1. Global Chat (Chat toàn cầu)
- **1 kênh duy nhất** cho toàn hệ thống, mọi người dùng đều nhắn được (ví dụ dùng để mời người khác join phòng Battle).
- Timestamp cho mỗi tin nhắn, hỗ trợ @mention.
- Moderation: mute, block, report, admin delete message.

## 2. Private Message (Chat riêng)
- Chat 1-1 giữa 2 người dùng.
- Lưu lịch sử tin nhắn, hiển thị online status.
- Notification khi nhận tin nhắn mới.
- Entry point: nút "Send DM" từ trang hồ sơ người dùng.

## 3. Room Chat (Chat trong phòng Battle)
- Chat 1-N, chỉ hoạt động trong phạm vi 1 phòng Battle đang diễn ra.
- Công khai cho tất cả thành viên trong phòng, có timestamp.
- Tách biệt về mặt dữ liệu với Global Chat (xem quy ước `room_id` trong `database-schema.md`).

## Phạm vi API/Backend cần có
- Bảng `chat_messages` dùng chung cho Global Chat và Room Chat (phân biệt qua `room_id`); Private Message cân nhắc tách bảng riêng nếu cần tối ưu truy vấn hộp thư.
- WebSocket events để broadcast tin nhắn theo đúng phạm vi (global / room / 1-1).
- API report + admin xử lý report, mute/ban user spam ở Global Chat.
