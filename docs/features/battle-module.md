# Module 3: Battle (Thi đấu — Real-time Sync)

## Nguyên tắc cốt lõi
- Người dùng **tạo phòng** hoặc **join phòng** có sẵn để thi đấu trực tiếp.
- **Tối đa 20 người/phòng.**
- Vòng đời phòng gồm 3 trạng thái: `WAITING → IN_PROGRESS → FINISHED`.
- Bắt buộc **Real-time Sync Start**: mọi người chỉ bắt đầu code khi chủ phòng bấm **[Bắt đầu]**.

---

## 1. Cấu hình phòng (do người tạo thiết lập)

| Trường | Ghi chú |
|---|---|
| Tên phòng | — |
| Số bài | 1–10 |
| Thời gian code | 10–180 phút |
| Độ khó | Easy / Medium / Hard / Random |
| Chủ đề bài | Chọn cụ thể hoặc random |
| Công khai / riêng tư | Mặc định **riêng tư** |

Hệ thống auto-generate đề bài theo cấu hình này.

---

## 2. Vòng đời phòng (Room Lifecycle)

### Trạng thái 1 — WAITING (Chờ bắt đầu)
- **Bất kỳ ai cũng có thể JOIN** khi phòng ở trạng thái này.
- Chủ phòng: nút [🟢 Bắt đầu], [⚙️ Cấu hình], [❌ Hủy phòng].
- Thành viên khác: nút [✓ Sẵn sàng] / [Hủy].
- Hiển thị số người sẵn sàng, ví dụ: "3/5 sẵn sàng".

```
┌─────────────────────────────────────┐
│ Java Challenge — ⏳ Chờ bắt đầu      │
│ 👥 Thành viên: 4/20                 │
│ • User_Admin (Bạn) ✓ Sẵn sàng       │
│ • User_A ✓ Sẵn sàng                 │
│ • User_B ⏳ Chờ join                │
│ • User_C ✓ Sẵn sàng                 │
│ [🟢 Bắt đầu] [⚙️ Cấu hình]          │
└─────────────────────────────────────┘
```

### Trạng thái 2 — IN_PROGRESS (Đang thi đấu)
Khi chủ phòng bấm **[Bắt đầu]**:
1. Server ghi `start_time = now()`.
2. Server tính `end_time = start_time + thời gian code`.
3. Status chuyển sang `IN_PROGRESS`.
4. **🔒 Khóa phòng ngay lập tức** — không ai join thêm được nữa.
5. Mở khóa code editor cho tất cả thành viên hiện tại, phát đề bài, bắt đầu countdown.

Mỗi lần submit lưu: `(user_id, problem_id, result, submission_time, points, timestamp)`. Leaderboard cập nhật real-time.

```
┌─────────────────────────────────────┐
│ Java Challenge — Đang thi           │
│ ⏱️ Thời gian còn: 45:30              │
│ Bài 1: Tính tổng 2 số  [✅ AC] 10:25 │
│ Bài 2: Sắp xếp mảng   [Đang giải...] │
│ Bài 3: Cây nhị phân   [Chưa mở]      │
│ Điểm hiện tại: 5/15 — Hạng: 2/4     │
│ 🏆 Leaderboard real-time             │
│ [🏳️ Đầu hàng] [💬 Chat]             │
└─────────────────────────────────────┘
```

### Trạng thái 3 — FINISHED (Kết thúc)
- Countdown = 0:00 → phòng tự đóng, **không ai submit được nữa**.
- Server tính điểm cuối cùng & xếp hạng đầy đủ 1–20.

```
┌─────────────────────────────────────┐
│ Java Challenge — KẾT THÚC           │
│ 1. User_A   15pts  25:30            │
│ 2. User_C   10pts  38:45            │
│ 3. Bạn       5pts  10:25            │
│ 4. User_B     0pts  -:--            │
│ [📊 Chi tiết] [💾 Lưu kết quả]      │
│ [🏠 Quay lại sảnh]                   │
└─────────────────────────────────────┘
```

---

## 3. Chấm điểm & xếp hạng

### Khi trận chỉ có 1 bài
- AC = 100 điểm; WA/TLE/RE = 0 điểm.
- **Tie-breaker**: so thời gian submit (ai submit đúng trước xếp hạng cao hơn).

### Khi trận có ≥ 2 bài
- Điểm mỗi bài = `100 / số_bài` (ví dụ 3 bài → 5 điểm/bài; AC = full điểm bài đó, WA/TLE/RE = 0).
- **Xếp hạng chính**: tổng điểm (cao → thấp).
- **Tie-breaker 1**: thời gian AC bài cuối cùng (ai hoàn thành tất cả các bài nhanh hơn).
- **Tie-breaker 2** (vẫn bằng sau tie-breaker 1): công bố đồng hạng, hoặc thêm 1 đề phụ.
- Xếp hạng cuối trận công bố **đầy đủ 1–20**, không chỉ 1 người thắng. Có thể xem lại chi tiết (ai AC bài nào lúc mấy giờ, bao nhiêu điểm).

---

## 4. Edge Cases bắt buộc xử lý

| Tình huống | Xử lý |
|---|---|
| Có người cố join sau khi trận đã start | ❌ Từ chối, hiển thị lỗi: "Trận đã bắt đầu, không thể tham gia. Trận sẽ kết thúc lúc HH:MM" |
| Thành viên disconnect giữa chừng | Chọn 1 trong 2 chính sách: (A) cho quay lại trong 5 phút, hoặc (B) ghi nhận kết quả đến lúc disconnect và loại khỏi bảng xếp hạng cuối |
| **Chủ phòng** disconnect | ✅ Phòng vẫn tiếp tục chạy bình thường, countdown không dừng, người khác vẫn code/submit; chỉ kết thúc khi hết giờ |
| Chủ phòng quên bấm [Bắt đầu] | Popup nhắc sau 5 phút chờ; auto-start nếu chờ > 10 phút và có ≥ 1 người sẵn sàng |

> Quyết định chọn chính sách (A) hay (B) cho disconnect cần chốt trước khi implement Phase 4 (xem roadmap.md).

---

## 5. Phạm vi API/Backend cần có
- Bảng `rooms`, `room_members`, `battle_submissions`, `room_results` (xem `database-schema.md`).
- WebSocket server (Socket.io): namespace/room theo `room_id`, events cho join/start/submit/leaderboard-update/countdown-tick.
- Cơ chế khóa phòng ngay khi `start_time` được ghi (tránh race condition khi nhiều người submit "Sẵn sàng"/"Join" cùng lúc trước khi khóa).
- Job scheduler (node-cron/Bull) để tự động đóng phòng khi `end_time` đến, kể cả khi không có client nào đang kết nối để trigger.
- Logic tính điểm + tie-breaker chạy phía server, không tin dữ liệu từ client.
