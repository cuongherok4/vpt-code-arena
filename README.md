# VPT Code Arena

> **Modern Online Judge Platform for Learning, Practicing and Competitive Programming**

**Ngày khởi tạo dự án:** 11/07/2026  


---

# 📖 Tổng Quan

**VPT Code Arena** là nền tảng học tập, luyện giải thuật và thi đấu lập trình trực tuyến (Online Judge) được xây dựng nhằm mang đến trải nghiệm gần giống các hệ thống như Codeforces, LeetCode hay AtCoder.

Người dùng có thể học theo lộ trình, luyện tập các bài toán thuật toán, tham gia các phòng thi đấu thời gian thực với bạn bè và nhận kết quả chấm bài hoàn toàn tự động.

Hệ thống được thiết kế theo kiến trúc microservices, tập trung vào khả năng mở rộng, hiệu năng và trải nghiệm người dùng.

### Điểm nổi bật

- 💻 Monaco Editor (VS Code Editor)
- ⚡ Chấm bài tự động qua Judge0
- 🔥 Battle Realtime bằng WebSocket
- 👥 Chat và Friend System
- 📈 Leaderboard & Activity Tracking
- 🔒 JWT + OAuth2 Authentication
- 🚀 Kiến trúc Microservices
- 🐳 Docker Development Environment

---

# 🚀 Chức Năng Chính

## 👤 Authentication

- Đăng ký tài khoản
- Đăng nhập Email/Password
- Đăng nhập Google & GitHub OAuth2
- Xác thực Email
- Quên mật khẩu / Đặt lại mật khẩu
- JWT Authentication
- Refresh Token

---

## 📚 Learning

- Học theo chương và bài học
- Theo dõi tiến độ học tập
- Chạy thử code trực tiếp
- Submit challenge
- Nhận kết quả chấm tự động

---

## 💯 Online Judge

- Danh sách bài tập
- Lọc theo độ khó
- Lọc theo chủ đề
- Tìm kiếm bài
- Đọc đề bài
- Sample Test
- Submit code
- Xem lịch sử submit

Kết quả chấm bài hỗ trợ:

- Accepted (AC)
- Wrong Answer (WA)
- Runtime Error (RE)
- Time Limit Exceeded (TLE)
- Compilation Error (CE)

---

## ⚔️ Battle Arena

- Tạo phòng đấu
- Tham gia phòng
- Ready trước trận
- Đồng hồ đếm ngược
- Submit realtime
- Leaderboard realtime
- Kết quả cuối trận
- Mời bạn bè
- Kick người chơi chờ

---

## 💬 Social

- Chat Global
- Chat Battle Room
- Chat cá nhân
- Friend Request
- Online Status
- Tìm bạn bằng:
  - Email
  - Username
  - Public ID
- Hồ sơ cá nhân
- Activity Calendar

---

## 🏆 Leaderboard

- Xếp hạng toàn hệ thống
- Xếp hạng theo ngôn ngữ
- Thống kê cá nhân
- Redis Cache tăng hiệu năng

---

## 🛠️ Admin Panel

- Dashboard thống kê
- Quản lý User
- Ban / Unban User
- Quản lý Problem
- Publish / Unpublish Problem
- Quản lý Test Cases
- Quản lý Difficulty
- Quản lý Topic

---

# 🏗️ Kiến Trúc Hệ Thống

```
                    React + Vite
                         │
              REST API / WebSocket
                         │
        ┌────────────────┴────────────────┐
        │                                 │
 Spring Boot API                 WebSocket Service
        │                                 │
        └──────────────┬──────────────────┘
                       │
                    Redis Pub/Sub
                       │
                 Judge Service
                       │
                    Judge0 API
                       │
                  PostgreSQL
```

---

# 💻 Tech Stack

## Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- React Router
- TanStack React Query
- Zustand
- Monaco Editor
- Socket.IO Client
- Lucide React

---

## Backend

- Java 21
- Spring Boot 3
- Spring Security
- JWT Authentication
- OAuth2 Client
- Spring Data JPA
- Hibernate
- PostgreSQL
- Flyway
- Redis
- Bucket4j
- SpringDoc OpenAPI
- JUnit
- Mockito
- MockMvc

---

## Realtime

- Node.js
- TypeScript
- Socket.IO
- Redis Pub/Sub

---

## Judge

- Node.js
- Bull Queue
- Judge0

---

## DevOps

- Docker
- Docker Compose
- GitHub Actions
- Maven Wrapper

---

# 📂 Cấu Trúc Dự Án

```text
vpt-code-arena/
├── backend/                # Spring Boot REST API
├── frontend/               # React + Vite
├── websocket-service/      # Socket.IO Service
├── judge-service/          # Judge Queue Worker
├── infrastructure/         # Docker Compose
├── docs/                   # Documentation
└── .github/workflows/      # CI/CD
```

---

# ⚙️ Yêu Cầu

- Java JDK 21
- Node.js 18+
- Docker Desktop
- PostgreSQL
- Redis

Khuyến nghị sử dụng Docker Compose để khởi động PostgreSQL, Redis và Judge0.

---

# 🚀 Chạy Dự Án

## 1. Clone Repository

```bash
git clone https://github.com/cuongherok4/vpt-code-arena.git
cd vpt-code-arena
```

---

## 2. Khởi động hạ tầng

```bash
cd infrastructure
docker compose up -d
```

---

## 3. Backend

```bash
cd backend
./mvnw spring-boot:run
```

Windows

```powershell
.\mvnw.cmd spring-boot:run
```

Backend

```
http://localhost:8080
```

Swagger

```
http://localhost:8080/swagger-ui.html
```

---

## 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

```
http://localhost:5173
```

---

## 5. WebSocket Service

```bash
cd websocket-service
npm install
npm run dev
```

---

## 6. Judge Service

```bash
cd judge-service
npm install
npm run dev
```

---

# ✅ Testing

## Backend

```bash
cd backend
./mvnw test
```

## Frontend

```bash
cd frontend
npm run build
npm run lint
```

---

# 📌 Lưu Ý

- Không commit file `.env`.
- Không commit JWT Secret, OAuth Secret, Mail Password.
- Tài khoản Admin cần được cấp role `ADMIN` trong database.
- Sau khi đổi role, người dùng cần đăng nhập lại để JWT được cập nhật.

---

# 📄 License

Distributed under the **MIT License**.
