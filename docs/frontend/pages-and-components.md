# Pages & Components — Danh sách theo Module

---

## 1. Auth Module

### Pages

| Page | Route | Mô tả |
|---|---|---|
| `LoginPage` | `/login` | Form email/password + nút "Đăng nhập bằng Google/GitHub" |
| `RegisterPage` | `/register` | Form đăng ký email/password/name |
| `OAuthCallbackPage` | `/auth/callback` | Nhận token từ OAuth redirect, lưu vào store, redirect về `/` |
| `VerifyEmailPage` | `/verify-email?token=...` | Xác thực email từ link trong mail |
| `ForgotPasswordPage` | `/forgot-password` | Form nhập email để gửi link reset |
| `ResetPasswordPage` | `/reset-password?token=...` | Form nhập mật khẩu mới |

### Components

| Component | Mô tả |
|---|---|
| `SocialLoginButton` | Nút Google/GitHub với icon |
| `PasswordInput` | Input có nút toggle show/hide password |

---

## 2. Learn Module

### Pages

| Page | Route | Mô tả |
|---|---|---|
| `LearnPage` | `/learn` | Sidebar tree của tất cả chương/bài học, % hoàn thành |
| `LessonPage` | `/learn/:lessonId` | Nội dung bài học + mini editor + Code Challenge |

### Components

| Component | Dùng ở | Mô tả |
|---|---|---|
| `ChapterTree` | LearnPage | Sidebar cây menu Chương → Bài học, icon lock/unlock/done |
| `LessonContent` | LessonPage | Render HTML/Markdown nội dung lý thuyết |
| `TryItEditor` | LessonPage | Monaco Editor nhỏ + nút [Chạy] [Reset] — output hiển thị bên dưới |
| `CodeChallenge` | LessonPage | Popup/section cuối bài: đề challenge + editor + nút [Nộp] + feedback |
| `LessonNavigation` | LessonPage | Nút [← Bài trước] [Bài tiếp →] |
| `ProgressBar` | LearnPage | Thanh % hoàn thành chương |

### Layout

```
┌─────────────────────────────────────────────────────┐
│ Navbar                                               │
├──────────────┬──────────────────────────────────────┤
│ ChapterTree  │ LessonContent                        │
│ (sidebar)    │                                      │
│ ■ Basics  80%│ # Hello World                        │
│ ✓ Hello World│ [nội dung lý thuyết...]              │
│ ✓ Variables  │                                      │
│ → For loops  │ ┌─────────────────────────────────┐  │
│              │ │ Try it Yourself                 │  │
│ □ OOP     0% │ │ [Monaco Editor]                 │  │
│ 🔒 Classes   │ │ [Chạy] [Reset]                  │  │
│              │ │ Output: Hello World             │  │
│              │ └─────────────────────────────────┘  │
│              │                                      │
│              │ [Code Challenge] ▼                   │
└──────────────┴──────────────────────────────────────┘
```

---

## 3. Exam Module

### Pages

| Page | Route | Mô tả |
|---|---|---|
| `ExamListPage` | `/exam` | Danh sách đề bài + filter + search |
| `ExamProblemPage` | `/exam/:problemId` | Layout 2 cột: đề bài + code editor |

### Components

| Component | Dùng ở | Mô tả |
|---|---|---|
| `ProblemList` | ExamListPage | Bảng danh sách bài: tên, độ khó (badge màu), chủ đề, kết quả của user |
| `DifficultyFilter` | ExamListPage | Tabs/buttons filter Easy/Medium/Hard/All |
| `TopicFilter` | ExamListPage | Dropdown chọn chủ đề |
| `ProblemStatement` | ExamProblemPage | Hiển thị đề Markdown, sample I/O |
| `SubmitPanel` | ExamProblemPage | CodeEditor + nút [Submit] + trạng thái (PENDING / AC / WA...) |
| `SubmissionHistory` | ExamProblemPage | Accordion lịch sử submit của user cho bài này |
| `ExamLeaderboard` | ExamProblemPage | Bảng xếp hạng theo ngôn ngữ (tab switch) |
| `ResultBadge` | Nhiều nơi | Badge màu: AC (xanh), WA (đỏ), TLE (vàng), RE (cam), PENDING (xám) |

### Layout ExamProblemPage

```
┌─────────────────────────────────────────────────────────┐
│ Navbar                                                   │
├──────────────────────────┬──────────────────────────────┤
│ ProblemStatement         │ SubmitPanel                  │
│                          │ ┌────────────────────────┐   │
│ # Tính tổng 2 số [EASY]  │ │ Java ▼  [Submit]       │   │
│                          │ │ [Monaco Editor]         │   │
│ ## Đề bài                │ │                         │   │
│ Nhập 2 số a, b...        │ │                         │   │
│                          │ └────────────────────────┘   │
│ ## Input                 │                              │
│ 1 2                      │ Kết quả: ✅ AC — 120ms       │
│                          │                              │
│ ## Output                │ [Lịch sử Submit ▼]           │
│ 3                        │  WA  java  14:30             │
│                          │  AC  java  14:32             │
│                          │                              │
│ [🏆 Leaderboard]         │ [📊 Leaderboard]             │
└──────────────────────────┴──────────────────────────────┘
```

---

## 4. Battle Module

### Pages

| Page | Route | Mô tả |
|---|---|---|
| `BattleLobbyPage` | `/battle` | Danh sách phòng công khai + nút Tạo phòng |
| `BattleRoomPage` | `/battle/:roomId` | Lobby phòng (WAITING state) — thành viên + trạng thái |
| `BattleArenaPage` | `/battle/:roomId/arena` | Thi đấu thực sự (IN_PROGRESS + FINISHED) |

### Components

| Component | Dùng ở | Mô tả |
|---|---|---|
| `RoomCard` | BattleLobbyPage | Card thông tin phòng: tên, số người, độ khó, thời gian |
| `CreateRoomModal` | BattleLobbyPage | Form tạo phòng với tất cả config |
| `MemberList` | BattleRoomPage | Danh sách thành viên + icon sẵn sàng/chờ |
| `ReadyButton` | BattleRoomPage | Toggle [✓ Sẵn sàng] / [Chờ] |
| `StartButton` | BattleRoomPage | Chỉ hiện với host; disabled nếu không đủ người sẵn sàng |
| `CountdownTimer` | BattleArenaPage | Đồng hồ đếm ngược lớn, đổi màu đỏ khi < 5 phút |
| `ProblemTabs` | BattleArenaPage | Tabs chuyển giữa các bài (Bài 1, Bài 2, Bài 3...) |
| `BattleEditor` | BattleArenaPage | CodeEditor + nút [Submit] + kết quả của bài này |
| `RealTimeLeaderboard` | BattleArenaPage | Bảng xếp hạng cập nhật real-time (cột: rank, tên, điểm, số bài AC) |
| `BattleChat` | BattleArenaPage | Chat panel thu gọn bên cạnh (Room Chat) |
| `FinalResultModal` | BattleArenaPage | Modal hiện khi `battle:finished` với bảng xếp hạng cuối |

### Layout BattleArenaPage

```
┌───────────────────────────────────────────────────────────────┐
│ Navbar   Java Challenge    ⏱️ 45:30          Hạng: 2/4        │
├───────────────────────────────────────┬───────────────────────┤
│ [Bài 1 ✅] [Bài 2 🔄] [Bài 3 ⬜]      │ 🏆 Leaderboard        │
├───────────────────────────────────────┤ 1. User_A  66pts  2AC │
│ ProblemStatement (Bài 2)             │ 2. Bạn     33pts  1AC │
│ # Sắp xếp mảng [MEDIUM]             │ 3. User_B   0pts  0AC │
│                                       │ 4. User_C   0pts  0AC │
├───────────────────────────────────────┤                       │
│ BattleEditor                          │ [💬 Chat ▼]           │
│ Python ▼  [Submit]                    │ User_A: GG!           │
│ [Monaco Editor]                       │ [Nhắn tin...]         │
│                                       │                       │
│ Kết quả: ⏳ Đang chấm...             │                       │
└───────────────────────────────────────┴───────────────────────┘
```

---

## 5. Messaging

### Components (không có Page riêng — embed vào các nơi khác)

| Component | Dùng ở | Mô tả |
|---|---|---|
| `GlobalChatPanel` | Navbar / Sidebar | Chat toàn hệ thống, có thể collapse |
| `RoomChatPanel` | BattleArenaPage | Chat trong phòng, collapse xuống góc |
| `DMConversationList` | ProfilePage → nav | Danh sách các cuộc hội thoại DM |
| `DMChatWindow` | ProfilePage | Chat 1-1 |
| `ChatMessage` | Tất cả chat | Bubble tin nhắn với avatar, tên, timestamp |
| `OnlineIndicator` | Avatar | Chấm xanh/xám cho online status |

---

## 6. Profile & Leaderboard

### Pages

| Page | Route | Mô tả |
|---|---|---|
| `ProfilePage` | `/profile` hoặc `/profile/:userId` | Thông tin, stats, lịch sử. Nếu là profile của mình: có nút Edit |
| `LeaderboardPage` | `/leaderboard` | Bảng xếp hạng global, filter theo type và ngôn ngữ |

### Components

| Component | Dùng ở | Mô tả |
|---|---|---|
| `StatsCard` | ProfilePage | Cards: Tổng điểm, Hạng, AC Rate, Tổng AC |
| `ActivityCalendar` | ProfilePage | Heatmap lịch sử hoạt động (như GitHub contributions) |
| `SubmissionHistoryTable` | ProfilePage | Bảng lịch sử submit gần đây |
| `BattleHistoryTable` | ProfilePage | Bảng lịch sử trận đấu |
| `LeaderboardTable` | LeaderboardPage | Bảng xếp hạng với avatar, tên, điểm, rank |
| `LanguageFilter` | LeaderboardPage | Tabs: Java / Python / C++ / JavaScript / All |

---

## 7. Admin Panel

### Pages

| Page | Route | Mô tả |
|---|---|---|
| `AdminPage` | `/admin` | Dashboard admin (tabs: Users / Problems / Moderation / Stats) |

### Components

| Component | Dùng ở | Mô tả |
|---|---|---|
| `UserManagementTable` | AdminPage | Danh sách user + nút Ban/Unban |
| `ProblemForm` | AdminPage | Form tạo/sửa đề bài (Markdown editor + test cases) |
| `ModerationFeed` | AdminPage | Danh sách tin nhắn bị report + nút Delete/Mute |
| `SystemStatsCards` | AdminPage | Cards thống kê: total users, submissions, active rooms |

---

## 8. Shared / Common Components

| Component | Mô tả |
|---|---|
| `Navbar` | Logo, menu điều hướng (Learn/Exam/Battle/Leaderboard), user avatar dropdown |
| `CodeEditor` | Monaco Editor wrapper — dùng ở Learn, Exam, Battle |
| `ResultBadge` | Badge màu cho AC/WA/TLE/RE/CE/PENDING |
| `DifficultyBadge` | Badge Easy (xanh) / Medium (vàng) / Hard (đỏ) |
| `UserAvatar` | Avatar + fallback chữ cái đầu tên |
| `EmptyState` | Placeholder khi không có dữ liệu |
| `ConfirmDialog` | Dialog xác nhận cho các hành động nguy hiểm (xóa, ban...) |
| `ToastNotification` | Thông báo toast (success/error/info) — dùng Sonner hoặc shadcn/ui toast |
