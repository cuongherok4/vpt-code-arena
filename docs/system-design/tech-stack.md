# Tech Stack

> Ghi lựa chọn **chính** (default) trước, lựa chọn thay thế (nếu có) để trong ngoặc.

---

## Frontend

| Hạng mục | Lựa chọn |
|---|---|
| Framework | React 18 + TypeScript |
| State management | Zustand |
| UI components | Shadcn/ui |
| Styling | Tailwind CSS |
| Form + validate | React Hook Form + Zod |
| Code editor | Monaco Editor (VS Code engine) |
| Real-time | Socket.io-client |
| Data fetching | Axios + React Query (TanStack Query v5) |
| Routing | React Router v6 (protected routes, lazy loading) |
| Build tool | Vite |
| Charts | Recharts (leaderboard, thống kê) |

---

## Backend (Main API — Java Spring Boot)

| Hạng mục | Lựa chọn |
|---|---|
| Runtime | Java 21 (LTS) |
| Framework | Spring Boot 3.x |
| Build tool | Maven (thay thế: Gradle) |
| Database ORM | Spring Data JPA + Hibernate |
| Database | PostgreSQL 16 |
| Cache | Redis 7 (Spring Data Redis) |
| Auth | Spring Security + JWT (JJWT library) |
| Social Login | Spring Security OAuth2 Client (Google, GitHub) |
| Email | Spring Mail + SendGrid/SMTP |
| API docs | SpringDoc OpenAPI 3 (Swagger UI tự động) |
| Validation | Jakarta Bean Validation (Hibernate Validator) |
| Task scheduler | Spring Scheduler (`@Scheduled`) + (thay thế: Quartz nếu cần distributed) |
| Testing | JUnit 5 + Mockito + Spring Boot Test |
| Migration DB | Flyway |

---

## WebSocket Service (Tách riêng — Node.js)

> **Lý do tách riêng**: Socket.io là thư viện Node.js trưởng thành nhất cho real-time với 20 người/phòng. Spring WebSocket (STOMP) phức tạp hơn và ít ecosystem hơn. Service này nhỏ, chỉ xử lý relay events.

| Hạng mục | Lựa chọn |
|---|---|
| Runtime | Node.js 20 LTS + TypeScript |
| Real-time | Socket.io 4.x (namespace theo room_id) |
| HTTP client | Axios (gọi lại Main API để validate) |
| Cache | Redis (shared với Main API — lưu room state, timer) |

---

## Judge Service (Tách riêng — Node.js wrapper)

| Hạng mục | Lựa chọn |
|---|---|
| Runtime | Node.js 20 LTS + TypeScript |
| Engine | Judge0 API (self-hosted Docker — xem `docs/backend/judge-integration.md`) |
| Queue | Bull (Redis-backed job queue — xử lý submission async) |

---

## DevOps & Hạ tầng

| Hạng mục | Lựa chọn |
|---|---|
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions (test → build → deploy khi merge main) |
| Hosting | AWS (EC2 + RDS + ElastiCache + S3) hoặc DigitalOcean cho MVP |
| Reverse proxy | Nginx (route `/api` → Spring Boot, `/ws` → WebSocket Service) |
| Monitoring | Spring Boot Actuator + Prometheus + Grafana; Sentry (FE/Node error tracking) |

---

## Bảo mật (bắt buộc)

- Spring Security filter chain cho tất cả endpoint
- HTTPS/TLS bắt buộc ở production (Let's Encrypt)
- Rate limiting: Bucket4j (Spring Boot) + Redis cho chống spam submit
- Input validation: Jakarta Bean Validation + parameterized queries (JPA chống SQL injection)
- Mã hóa password: BCrypt (Spring Security mặc định)
- JWT: access token 15 phút + refresh token 7 ngày (rotate on use)
- CORS config chặt chẽ theo môi trường

---

## Ghi chú lựa chọn

- **Vì sao Spring Boot**: Yêu cầu của dự án. Spring ecosystem (Security, Data JPA, Scheduler) rất mature cho REST API.
- **Vì sao WebSocket Service tách riêng**: Tránh đưa Socket.io dependency vào Spring Boot; service nhỏ, scale độc lập khi cần.
- **Vì sao Judge0 self-hosted**: Tránh rate limit public API; kiểm soát bảo mật sandbox tốt hơn khi production.
- **Vì sao Flyway**: Migration DB version-controlled, rollback được, quan trọng khi team nhiều người.
