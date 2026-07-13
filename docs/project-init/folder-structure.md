# Cấu trúc thư mục dự án

> Đây là cấu trúc **mục tiêu** sau khi setup Phase 1 hoàn thành. Các thư mục hiện đang rỗng sẽ được tạo dần theo từng phase.

```
vpt-code-arena/
├─ CLAUDE.md                          # Entry point — đọc đầu tiên
├─ PROJECT_REQUIREMENTS.md            # Checklist chức năng
├─ README.md                          # Giới thiệu ngắn cho GitHub
├─ .gitignore
├─ LICENSE
│
├─ docs/                              # Tài liệu dự án (không chứa code)
│  ├─ project-init/
│  │  ├─ README.md                    # Thứ tự đọc tài liệu
│  │  ├─ env-setup.md                 # Hướng dẫn setup môi trường
│  │  └─ folder-structure.md          # File này
│  ├─ system-design/
│  │  ├─ tech-stack.md
│  │  ├─ database-schema.md
│  │  ├─ api-contracts.md
│  │  └─ websocket-events.md
│  ├─ features/
│  │  ├─ learn-module.md
│  │  ├─ exam-module.md
│  │  ├─ battle-module.md
│  │  └─ messaging.md
│  ├─ backend/
│  │  ├─ architecture.md
│  │  ├─ auth-flow.md
│  │  └─ judge-integration.md
│  ├─ frontend/
│  │  ├─ architecture.md
│  │  └─ pages-and-components.md
│  ├─ testing/
│  │  └─ test-strategy.md
│  └─ deployment/
│     └─ roadmap.md
│
├─ backend/                           # Java Spring Boot — Main API
│  ├─ pom.xml
│  ├─ mvnw / mvnw.cmd
│  ├─ .env                            # KHÔNG commit — xem env-setup.md
│  └─ src/
│     ├─ main/
│     │  ├─ java/com/vpt/arena/
│     │  │  ├─ VptArenaApplication.java
│     │  │  ├─ config/
│     │  │  │  ├─ SecurityConfig.java       # Spring Security + OAuth2
│     │  │  │  ├─ JwtConfig.java
│     │  │  │  ├─ RedisConfig.java
│     │  │  │  └─ SwaggerConfig.java
│     │  │  ├─ entity/
│     │  │  │  ├─ enums/               # Role, Difficulty, JudgeResult, RoomStatus...
│     │  │  │  ├─ User.java
│     │  │  │  ├─ UserStats.java
│     │  │  │  ├─ Problem.java
│     │  │  │  ├─ Submission.java
│     │  │  │  ├─ Room.java
│     │  │  │  ├─ RoomMember.java
│     │  │  │  ├─ BattleSubmission.java
│     │  │  │  ├─ RoomResult.java
│     │  │  │  ├─ Chapter.java
│     │  │  │  ├─ Lesson.java
│     │  │  │  ├─ UserProgress.java
│     │  │  │  ├─ ChatMessage.java
│     │  │  │  └─ DirectMessage.java
│     │  │  ├─ repository/             # Spring Data JPA Repositories
│     │  │  │  ├─ UserRepository.java
│     │  │  │  ├─ SubmissionRepository.java
│     │  │  │  ├─ RoomRepository.java
│     │  │  │  └─ ...
│     │  │  ├─ service/
│     │  │  │  ├─ auth/
│     │  │  │  │  ├─ AuthService.java
│     │  │  │  │  ├─ JwtService.java
│     │  │  │  │  └─ OAuth2Service.java
│     │  │  │  ├─ learn/
│     │  │  │  │  ├─ LearnService.java
│     │  │  │  │  └─ ProgressService.java
│     │  │  │  ├─ exam/
│     │  │  │  │  ├─ ExamService.java
│     │  │  │  │  └─ LeaderboardService.java
│     │  │  │  ├─ battle/
│     │  │  │  │  ├─ BattleService.java
│     │  │  │  │  └─ BattleScheduler.java   # @Scheduled auto-end phòng
│     │  │  │  ├─ judge/
│     │  │  │  │  └─ JudgeCallbackService.java
│     │  │  │  ├─ messaging/
│     │  │  │  │  └─ MessagingService.java
│     │  │  │  └─ user/
│     │  │  │     └─ UserService.java
│     │  │  ├─ controller/
│     │  │  │  ├─ AuthController.java
│     │  │  │  ├─ UserController.java
│     │  │  │  ├─ LearnController.java
│     │  │  │  ├─ ExamController.java
│     │  │  │  ├─ BattleController.java
│     │  │  │  ├─ ChatController.java
│     │  │  │  ├─ LeaderboardController.java
│     │  │  │  └─ AdminController.java
│     │  │  ├─ dto/                    # Request/Response DTOs
│     │  │  │  ├─ auth/
│     │  │  │  ├─ learn/
│     │  │  │  ├─ exam/
│     │  │  │  ├─ battle/
│     │  │  │  └─ common/
│     │  │  ├─ exception/
│     │  │  │  ├─ GlobalExceptionHandler.java
│     │  │  │  ├─ BusinessException.java
│     │  │  │  └─ ErrorCode.java
│     │  │  └─ security/
│     │  │     ├─ JwtAuthFilter.java
│     │  │     ├─ CustomUserDetails.java
│     │  │     └─ OAuth2SuccessHandler.java
│     │  └─ resources/
│     │     ├─ application.yml
│     │     ├─ application-local.yml   # Override cho dev local
│     │     └─ db/migration/
│     │        ├─ V1__init_schema.sql  # Schema đầy đủ (xem database-schema.md)
│     │        └─ V2__seed_data.sql    # Dữ liệu mẫu cho dev (optional)
│     └─ test/
│        └─ java/com/vpt/arena/
│           ├─ service/               # Unit tests
│           └─ controller/            # Integration tests (@SpringBootTest)
│
├─ frontend/                          # React 18 + TypeScript + Vite
│  ├─ package.json
│  ├─ vite.config.ts
│  ├─ tsconfig.json
│  ├─ tailwind.config.ts
│  ├─ .env.local                      # KHÔNG commit
│  ├─ public/
│  └─ src/
│     ├─ main.tsx
│     ├─ App.tsx
│     ├─ router/
│     │  └─ index.tsx                 # React Router v6 routes
│     ├─ components/                  # Shared/reusable components
│     │  ├─ ui/                       # Shadcn/ui components
│     │  ├─ layout/
│     │  │  ├─ Navbar.tsx
│     │  │  ├─ Sidebar.tsx
│     │  │  └─ PageLayout.tsx
│     │  ├─ editor/
│     │  │  └─ CodeEditor.tsx         # Monaco Editor wrapper
│     │  └─ common/
│     │     ├─ LoadingSpinner.tsx
│     │     └─ ErrorBoundary.tsx
│     ├─ pages/                       # Route-level pages
│     │  ├─ auth/
│     │  │  ├─ LoginPage.tsx
│     │  │  ├─ RegisterPage.tsx
│     │  │  └─ OAuthCallbackPage.tsx
│     │  ├─ learn/
│     │  │  ├─ LearnPage.tsx          # Danh sách chương
│     │  │  └─ LessonPage.tsx         # Nội dung bài học + editor
│     │  ├─ exam/
│     │  │  ├─ ExamListPage.tsx
│     │  │  └─ ExamProblemPage.tsx
│     │  ├─ battle/
│     │  │  ├─ BattleLobbyPage.tsx    # Danh sách phòng công khai
│     │  │  ├─ BattleRoomPage.tsx     # Lobby phòng (WAITING)
│     │  │  └─ BattleArenaPage.tsx    # Trong trận (IN_PROGRESS + FINISHED)
│     │  ├─ profile/
│     │  │  └─ ProfilePage.tsx
│     │  ├─ leaderboard/
│     │  │  └─ LeaderboardPage.tsx
│     │  └─ admin/
│     │     └─ AdminPage.tsx
│     ├─ store/                       # Zustand stores
│     │  ├─ authStore.ts
│     │  ├─ battleStore.ts
│     │  └─ notificationStore.ts
│     ├─ hooks/                       # Custom hooks
│     │  ├─ useSocket.ts
│     │  ├─ useBattleSocket.ts
│     │  └─ useChatSocket.ts
│     ├─ api/                         # Axios API clients
│     │  ├─ client.ts                 # Axios instance + interceptors
│     │  ├─ auth.api.ts
│     │  ├─ learn.api.ts
│     │  ├─ exam.api.ts
│     │  ├─ battle.api.ts
│     │  └─ chat.api.ts
│     └─ types/                       # TypeScript interfaces
│        ├─ user.types.ts
│        ├─ battle.types.ts
│        └─ api.types.ts
│
├─ websocket-service/                 # Node.js + Socket.io
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ .env                            # KHÔNG commit
│  └─ src/
│     ├─ index.ts                     # Entry point
│     ├─ config/
│     │  └─ redis.ts
│     ├─ middleware/
│     │  └─ authMiddleware.ts         # Verify JWT từ Spring Boot
│     ├─ namespaces/
│     │  ├─ battleNamespace.ts        # /battle namespace
│     │  └─ chatNamespace.ts          # /chat namespace
│     └─ handlers/
│        ├─ battleHandlers.ts
│        └─ chatHandlers.ts
│
├─ judge-service/                     # Node.js + Bull + Judge0
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ .env                            # KHÔNG commit
│  └─ src/
│     ├─ index.ts
│     ├─ queue/
│     │  └─ submissionQueue.ts        # Bull queue
│     ├─ judge/
│     │  └─ judge0Client.ts           # Gọi Judge0 API
│     └─ routes/
│        └─ submitRoute.ts            # POST /submit nhận từ Spring Boot
│
├─ infrastructure/
│  ├─ docker-compose.dev.yml          # PostgreSQL + Redis + Judge0 (dev)
│  ├─ docker-compose.prod.yml         # Full stack production
│  └─ nginx/
│     └─ nginx.conf                   # Reverse proxy config
│
└─ scripts/
   ├─ seed-problems.ts                # Script seed đề bài mẫu
   └─ backup-db.sh                    # Backup PostgreSQL
```

---

## Quy tắc quan trọng

| Quy tắc | Chi tiết |
|---|---|
| `.env` không commit | Chỉ commit `.env.example` — xem `env-setup.md` |
| Migration chỉ thêm | Flyway: tạo file `V{n}__*.sql` mới, **không sửa file cũ** |
| DTO tách Entity | Controller chỉ nhận/trả DTO, không expose Entity JPA trực tiếp |
| Service không gọi Controller | Dependency chỉ đi 1 chiều: Controller → Service → Repository |
| Store Zustand | Mỗi domain 1 store, không dùng 1 store global cho tất cả |
