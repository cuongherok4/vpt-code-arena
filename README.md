# VPT Code Arena

## 📖 Tổng quan hệ thống (Project Overview)

**Ngày khởi tạo dự án:** 11/07/2026

**VPT Code Arena** là một nền tảng thực hành, học tập và thi đấu lập trình trực tuyến (Online Judge) hiện đại. Hệ thống cung cấp một môi trường trực quan để người dùng luyện tập giải quyết các bài toán thuật toán, tham gia vào các phòng thi đấu code trực tiếp (real-time coding arena) cùng bạn bè, và được hệ thống đánh giá, chấm điểm code hoàn toàn tự động.

Dự án được xây dựng theo kiến trúc hệ thống hiện đại, chú trọng vào trải nghiệm người dùng, tốc độ phản hồi và khả năng mở rộng:
- **Trải nghiệm IDE nguyên bản:** Cung cấp trình soạn thảo mã nguồn mạnh mẽ trực tiếp trên trình duyệt.
- **Thực thi an toàn (Sandboxed Execution):** Mã nguồn của người dùng được chạy và kiểm thử trong môi trường an toàn, đánh giá độ chính xác, thời gian chạy và bộ nhớ.
- **Đồng bộ hóa Real-time:** Ứng dụng WebSockets để cập nhật trạng thái người chơi, phòng đấu, và kết quả chấm điểm ngay lập tức.

---

## 🚀 Tính năng chính (Key Features)

- **Code Editor Chuyên Nghiệp**: Tích hợp Monaco Editor (lõi của VS Code) mang lại cảm giác code tự nhiên.
- **Hệ Thống Chấm Điểm (Auto Judging)**: Tự động đánh giá các bài nộp code thông qua các test cases chuẩn xác.
- **Tương tác Real-time**: Hỗ trợ WebSocket qua Socket.io giúp tạo phòng thi đấu, chat và cập nhật trạng thái bài nộp theo thời gian thực.
- **Xác Thực (Authentication)**: Đăng nhập bảo mật sử dụng JWT & OAuth2 (Google/Github login).
- **Kiểm Soát Lưu Lượng (Rate Limiting)**: Bảo vệ hệ thống API với Bucket4j và Redis nhằm ngăn chặn lạm dụng.

## 💻 Công nghệ sử dụng (Tech Stack)

### Frontend
- **Framework & Build Tool:** React 19, Vite
- **Styling:** Tailwind CSS 4
- **State Management:** Zustand, React Query
- **Thành phần cốt lõi:** Monaco Editor (Trình soạn thảo), Socket.io-client (WebSockets)

### Backend
- **Core Framework:** Java 21, Spring Boot 3
- **Database:** PostgreSQL (Quản lý schema bằng Flyway)
- **Caching & Rate Limiting:** Redis + Bucket4j
- **Bảo mật:** Spring Security, JWT, OAuth2 Client
- **API Docs:** SpringDoc OpenAPI (Swagger)

---

## 🛠️ Yêu cầu môi trường (Prerequisites)

Để chạy dự án, máy tính của bạn cần cài đặt sẵn:
- **Node.js** (Phiên bản v18 trở lên)
- **Java JDK** (Phiên bản 21)
- **PostgreSQL**
- **Redis**

## 🏃 Hướng dẫn cài đặt (Getting Started)

### 1. Clone mã nguồn dự án
```bash
git clone https://github.com/cuongherok4/vpt-code-arena.git
cd vpt-code-arena
```

### 2. Cài đặt Backend
Mở một terminal mới và di chuyển vào thư mục backend:
```bash
cd backend
```
> **Lưu ý:** Hãy đảm bảo cơ sở dữ liệu PostgreSQL và Redis đang hoạt động. Bạn cần cập nhật thông tin kết nối trong file cấu hình `application-local.yml`.

Khởi chạy server backend (với Maven):
```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```
Hoặc đối với môi trường Windows, có thể sử dụng script có sẵn:
```bash
.\run-local.ps1
```

### 3. Cài đặt Frontend
Mở một terminal khác, di chuyển vào thư mục frontend:
```bash
cd frontend
npm install
npm run dev
```
Truy cập ứng dụng frontend trên trình duyệt theo địa chỉ được Vite cung cấp (thường là http://localhost:5173).

---

## 📜 Giấy phép (License)

Dự án được phân phối dưới giấy phép MIT License.
