# Module 2: Exam (Thi / Ranked Practice)

## Nguyên tắc cốt lõi
- Đề bài **cố định**, nhưng **không giới hạn khung giờ** — người dùng vào làm bất kỳ lúc nào.
- **Bộ đề dùng chung** cho tất cả mọi người (không tách theo trình độ), nhưng trong bộ đề có **cả câu dễ và câu khó đan xen** — người mới vẫn làm được câu dễ, người giỏi thử câu khó để ăn điểm cao hơn.
- Tính chất **cá nhân**: không cần tạo/join nhóm, ai cũng có thể vào thi độc lập.

## Danh sách đề (Exam List)
- Hiển thị tất cả đề có sẵn.
- Filter theo độ khó (Easy/Medium/Hard) và theo chủ đề (Array, String, Tree...).
- Xem chi tiết đề (số bài, giới hạn thời gian nếu có) trước khi bấm [Làm bài].

## Trang làm bài (Exam Page)
- Code editor online, test case hiển thị công khai.
- Submit code → nhận kết quả AC/WA/TLE/RE.
- Lưu lịch sử submit (được submit nhiều lần), xem lại bài sau khi nộp.

## Chấm điểm
- Chạy code với nhiều test case.
- **Tiêu chí chấm chính**: tốc độ + thời gian chạy code của **1 bài** (không cộng dồn nhiều bài).
- AC = full điểm; WA/TLE/RE = 0 điểm.
- Ghi nhận `submission_time` (thời điểm submit).

## Tie-breaker (khi bằng điểm)
- So sánh **thời gian submit**: ai submit đúng trước thì xếp hạng cao hơn.

## Leaderboard
- Xếp hạng **riêng theo từng ngôn ngữ lập trình** (ví dụ: bảng xếp hạng Java, bảng xếp hạng Python...).
- Hiển thị: Rank, Tên, Điểm, Submission Time.
- Sort: Điểm (cao → thấp) → Submission Time (nhanh → chậm).
- Cập nhật real-time.

## Phạm vi API/Backend cần có
- Bảng `problems`, `submissions` (dùng chung `problems` với Battle — xem `database-schema.md`).
- Tích hợp code execution engine (Judge0 hoặc Docker) để chấm AC/WA/TLE/RE và đo thời gian chạy.
- API leaderboard theo ngôn ngữ, có cache Redis để tránh query nặng liên tục.
