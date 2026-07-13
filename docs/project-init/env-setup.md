# Hướng dẫn Setup Môi trường Dev

## Yêu cầu hệ thống

| Công cụ | Phiên bản tối thiểu | Ghi chú |
|---|---|---|
| Java JDK | 21 (LTS) | Spring Boot 3.x yêu cầu Java 17+ |
| Maven | 3.9+ | Hoặc dùng `./mvnw` wrapper có sẵn |
| Node.js | 20 LTS | Cho WebSocket Service và Judge Service |
| npm | 10+ | Đi kèm Node.js 20 |
| Docker Desktop | 24+ | Chạy PostgreSQL, Redis, Judge0 |
| Git | 2.40+ | — |

> **IDE khuyến nghị**: IntelliJ IDEA (backend Java), VS Code (frontend + Node services)

---

## Bước 1: Clone & Cấu hình

```bash
git clone https://github.com/your-org/vpt-code-arena.git
cd vpt-code-arena
```

---

## Bước 2: Tạo file `.env`

### 2.1 Backend (Spring Boot)
Tạo file `backend/.env` (hoặc `backend/src/main/resources/application-local.properties`):

```env
# Database
DATABASE_URL=jdbc:postgresql://localhost:5432/vpt_arena
DATABASE_USERNAME=vpt_user
DATABASE_PASSWORD=vpt_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-very-long-secret-key-at-least-64-characters-long-here
JWT_ACCESS_EXPIRY_SECONDS=900
JWT_REFRESH_EXPIRY_DAYS=7

# OAuth2 - Google
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OAuth2 - GitHub
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# OAuth2 Redirect (sau khi login thành công)
OAUTH2_REDIRECT_URI=http://localhost:5173/auth/callback

# Email (SendGrid hoặc SMTP)
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=your-sendgrid-api-key
MAIL_FROM=noreply@vpt-arena.com

# Judge Service URL
JUDGE_SERVICE_URL=http://localhost:3002

# App
APP_URL=http://localhost:8080
FRONTEND_URL=http://localhost:5173
```

### 2.2 WebSocket Service
Tạo file `websocket-service/.env`:

```env
PORT=3001
REDIS_URL=redis://localhost:6379
MAIN_API_URL=http://localhost:8080
JWT_SECRET=your-very-long-secret-key-at-least-64-characters-long-here
ALLOWED_ORIGINS=http://localhost:5173
```

### 2.3 Judge Service
Tạo file `judge-service/.env`:

```env
PORT=3002
REDIS_URL=redis://localhost:6379
JUDGE0_URL=http://localhost:2358
JUDGE0_AUTH_TOKEN=     # Để trống nếu self-hosted không cần auth
MAIN_API_WS_NOTIFY_URL=http://localhost:3001/internal/judge-result
```

### 2.4 Frontend
Tạo file `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:8080/api/v1
VITE_WS_URL=ws://localhost:3001
```

---

## Bước 3: Khởi động infrastructure bằng Docker Compose

```bash
# Khởi động PostgreSQL, Redis, Judge0
docker compose -f infrastructure/docker-compose.dev.yml up -d

# Kiểm tra services đã chạy
docker compose -f infrastructure/docker-compose.dev.yml ps
```

File `infrastructure/docker-compose.dev.yml` cần tạo với nội dung:

```yaml
version: '3.9'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: vpt_arena
      POSTGRES_USER: vpt_user
      POSTGRES_PASSWORD: vpt_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  judge0:
    image: judge0/judge0:latest
    ports:
      - "2358:2358"
    environment:
      REDIS_URL: redis://redis:6379
    depends_on:
      - redis

volumes:
  postgres_data:
```

---

## Bước 4: Chạy DB Migration (Flyway)

```bash
cd backend
./mvnw flyway:migrate -Dflyway.url=jdbc:postgresql://localhost:5432/vpt_arena \
  -Dflyway.user=vpt_user \
  -Dflyway.password=vpt_password
```

> Hoặc đơn giản hơn: chạy Spring Boot ở bước tiếp theo — Flyway tự động migrate khi app khởi động.

---

## Bước 5: Cài dependencies & chạy services

### Backend (Java Spring Boot)
```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
# API sẵn sàng tại: http://localhost:8080
# Swagger UI: http://localhost:8080/swagger-ui.html
```

### WebSocket Service (Node.js)
```bash
cd websocket-service
npm install
npm run dev
# WebSocket sẵn sàng tại: ws://localhost:3001
```

### Judge Service (Node.js)
```bash
cd judge-service
npm install
npm run dev
# Judge service tại: http://localhost:3002
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
# Frontend tại: http://localhost:5173
```

---

## Bước 6: Xác nhận setup thành công

| Kiểm tra | URL / Lệnh | Kết quả mong đợi |
|---|---|---|
| Spring Boot API | `curl http://localhost:8080/actuator/health` | `{"status":"UP"}` |
| Swagger UI | `http://localhost:8080/swagger-ui.html` | Trang API docs |
| WebSocket | `http://localhost:3001/health` | `{"status":"ok"}` |
| Judge Service | `http://localhost:3002/health` | `{"status":"ok"}` |
| Frontend | `http://localhost:5173` | Trang chủ app |
| Judge0 | `http://localhost:2358/system_info` | System info JSON |

---

## OAuth2 Setup (Google & GitHub)

### Google
1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project → **APIs & Services** → **Credentials** → **Create OAuth 2.0 Client ID**
3. Authorized redirect URIs: `http://localhost:8080/login/oauth2/code/google`
4. Copy **Client ID** và **Client Secret** vào `backend/.env`

### GitHub
1. Vào **GitHub Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**
2. Homepage URL: `http://localhost:5173`
3. Authorization callback URL: `http://localhost:8080/login/oauth2/code/github`
4. Copy **Client ID** và **Client Secret** vào `backend/.env`

---

## Troubleshooting thường gặp

| Lỗi | Nguyên nhân | Giải pháp |
|---|---|---|
| `Connection refused :5432` | PostgreSQL chưa chạy | `docker compose up -d postgres` |
| `Cannot connect to Redis` | Redis chưa chạy | `docker compose up -d redis` |
| `Flyway migration failed` | Schema conflict | `./mvnw flyway:repair` rồi migrate lại |
| `JWT_SECRET too short` | Secret < 64 ký tự | Dùng key dài hơn |
| CORS error từ browser | FRONTEND_URL sai | Kiểm tra `FRONTEND_URL` trong `.env` |
| Judge0 `401 Unauthorized` | Token sai | Để trống `JUDGE0_AUTH_TOKEN` với self-hosted |
