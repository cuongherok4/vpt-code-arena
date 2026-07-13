# Tech Stack

> Ghi lựa chọn **chính** (default) trước, lựa chọn thay thế (nếu có) để trong ngoặc. Không liệt kê công cụ phụ không ảnh hưởng kiến trúc.

---

## Frontend

| Hạng mục | Lựa chọn |
|---|---|
| Framework | React 18 + TypeScript |
| State management | Zustand (thay thế: Redux Toolkit) |
| UI components | Shadcn/ui (thay thế: MUI) |
| Styling | Tailwind CSS |
| Form + validate | React Hook Form + Zod |
| Code editor | Monaco Editor (VS Code engine) — syntax highlight nhiều ngôn ngữ |
| Real-time | Socket.io-client |
| Data fetching | Axios + React Query |
| Routing | React Router v6 (protected routes, lazy loading) |
| Build tool | Vite |
| Charts | Recharts (leaderboard, thống kê) |

## Backend

| Hạng mục | Lựa chọn |
|---|---|
| Runtime | Node.js (LTS) + TypeScript |
| Framework | NestJS (thay thế: Express.js) |
| Database | PostgreSQL, ORM: Prisma |
| Cache / session / realtime data | Redis |
| Real-time | Socket.io (namespace theo room, broadcast events) |
| Code execution engine | Judge0 API (thay thế: Docker sandbox tự build nếu cần kiểm soát sâu hơn) |
| Auth | JWT (access + refresh) + Bcrypt; OAuth qua Passport.js nếu cần login Google/GitHub |
| Task queue / scheduler | Bull (job queue) + node-cron (auto-end battle, cleanup) |
| Email | Nodemailer + SendGrid/SMTP |
| Testing | Jest + Supertest |
| API docs | Swagger/OpenAPI |

## DevOps & Hạ tầng

| Hạng mục | Lựa chọn |
|---|---|
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions (test → build → deploy khi merge main) |
| Hosting | AWS (EC2 + RDS + S3 + CloudFront) hoặc DigitalOcean/Vercel cho MVP nhỏ |
| Reverse proxy / scaling | Nginx; Kubernetes chỉ cân nhắc khi cần auto-scale thật sự |
| Monitoring | Sentry (error tracking) + Datadog/Prometheus+Grafana (khi cần) |

## Bảo mật (bắt buộc, không tùy chọn)

- Helmet.js (HTTP headers), express-rate-limit (chống DDoS/spam submit)
- Input validation: Zod/Joi + parameterized queries (chống SQL injection)
- HTTPS/TLS bắt buộc ở production (Let's Encrypt)
- Mã hóa dữ liệu nhạy cảm at-rest & in-transit, audit log cho hành động admin

---

## Ghi chú lựa chọn

- **Vì sao Socket.io bắt buộc**: Battle Module cần đồng bộ countdown, leaderboard, submit real-time cho tối đa 20 người/phòng — REST polling không đáp ứng đủ độ trễ thấp.
- **Vì sao Judge0 là lựa chọn mặc định**: giảm thời gian dựng judge server riêng ở giai đoạn đầu; chuyển sang Docker sandbox tự build khi cần kiểm soát bảo mật/tài nguyên chặt hơn (xem Risk trong roadmap.md).
