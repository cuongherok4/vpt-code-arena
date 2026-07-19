# API Contracts — REST API

> **Base URL**: `http://localhost:8080/api/v1` (dev) | `https://api.vpt-arena.com/api/v1` (prod)
> **Auth**: Bearer JWT trong header `Authorization: Bearer <access_token>`
> **Response format**: JSON. Lỗi trả về `{"code": "ERROR_CODE", "message": "...", "timestamp": "..."}`

---

## Auth & User Management

### POST /auth/register
Đăng ký tài khoản mới.
```json
// Request
{
  "email": "user@example.com",
  "password": "StrongPass123!",
  "name": "Nguyen Van A"
}

// Response 201
{
  "message": "Vui lòng kiểm tra email để xác thực tài khoản."
}
```

### POST /auth/verify-email
Xác thực email sau khi đăng ký.
```json
// Request
{ "token": "abc123xyz..." }

// Response 200
{ "message": "Email đã được xác thực." }
```

### POST /auth/login
Đăng nhập bằng email/password.
```json
// Request
{ "email": "user@example.com", "password": "StrongPass123!" }

// Response 200
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "dGhpcyBp...",
  "expiresIn": 900,
  "user": { "id": "uuid", "name": "Nguyen Van A", "email": "...", "role": "USER", "avatar": null }
}
```

### POST /auth/refresh
Lấy access token mới bằng refresh token.
```json
// Request
{ "refreshToken": "dGhpcyBp..." }

// Response 200
{ "accessToken": "eyJhbGci...", "expiresIn": 900 }
```

### POST /auth/logout
Thu hồi refresh token.
```json
// Request
{ "refreshToken": "dGhpcyBp..." }

// Response 200
{ "message": "Đăng xuất thành công." }
```

### POST /auth/forgot-password
Gửi email đặt lại mật khẩu.
```json
// Request
{ "email": "user@example.com" }

// Response 200
{ "message": "Email đặt lại mật khẩu đã được gửi." }
```

### POST /auth/reset-password
Đặt lại mật khẩu mới.
```json
// Request
{ "token": "reset_token...", "newPassword": "NewPass456!" }

// Response 200
{ "message": "Mật khẩu đã được đặt lại." }
```

### GET /auth/google
Redirect tới Google OAuth2. Sau khi thành công, redirect về FE kèm token.

### GET /auth/github
Redirect tới GitHub OAuth2.

---

## Users

### GET /users/me *(auth required)*
Lấy thông tin profile của user hiện tại.
```json
// Response 200
{
  "id": "uuid",
  "name": "Nguyen Van A",
  "email": "user@example.com",
  "avatar": "https://...",
  "bio": "...",
  "preferredLang": "java",
  "role": "USER",
  "stats": {
    "totalPoints": 1500,
    "rank": 42,
    "totalAc": 30,
    "totalWa": 10,
    "acRate": 75.00
  }
}
```

### PUT /users/me *(auth required)*
Cập nhật thông tin profile.
```json
// Request
{ "name": "Tên mới", "bio": "Bio mới", "preferredLang": "python", "avatar": "https://..." }

// Response 200
{ /* user object */ }
```

### PUT /users/me/password *(auth required)*
Đổi mật khẩu.
```json
// Request
{ "currentPassword": "OldPass", "newPassword": "NewPass456!" }

// Response 200
{ "message": "Mật khẩu đã được cập nhật." }
```

### GET /users/:id
Xem profile công khai của user khác.
```json
// Response 200
{ "id": "uuid", "name": "...", "avatar": "...", "bio": "...", "stats": {...} }
```

### GET /users/me/history *(auth required)*
Lịch sử hoạt động của user.
```json
// Response 200
{
  "examSubmissions": [ /* danh sách submission gần đây */ ],
  "battleHistory": [ /* danh sách trận đã tham gia */ ],
  "learnProgress": { "totalLessons": 50, "completed": 20, "percentage": 40 }
}
```

---

## Learn Module

### GET /learn/chapters
Lấy danh sách tất cả chương học.
```json
// Response 200
[
  {
    "id": "uuid",
    "title": "Java Basics",
    "groupName": "Basics",
    "order": 1,
    "lessons": [
      { "id": "uuid", "title": "Hello World", "order": 1, "completed": true }
    ],
    "progressPercent": 80,
    "isUnlocked": true
  }
]
```

### GET /learn/lessons/:id
Lấy nội dung bài học.
```json
// Response 200
{
  "id": "uuid",
  "chapterId": "uuid",
  "title": "Hello World",
  "content": "<h1>Hello World</h1>...",
  "order": 1,
  "hasChallenge": true,
  "challengeDescription": "Viết chương trình in ra 'Hello World'",
  "completed": false
}
```

### POST /learn/lessons/:id/complete *(auth required)*
Đánh dấu bài học đã hoàn thành.
```json
// Request
{ "timeSpentSec": 120 }

// Response 200
{ "completed": true, "nextLessonId": "uuid" }
```

### POST /learn/lessons/:id/challenge *(auth required)*
Nộp bài Code Challenge.
```json
// Request
{ "code": "public class Main {...}", "language": "java" }

// Response 200
{
  "passed": true,
  "feedback": "Correct!",
  "nextLessonUnlocked": true,
  "nextLessonId": "uuid"
}
```

### POST /learn/run-code *(auth required)*
Chạy code "Try it Yourself" (không chấm test case phức tạp).
```json
// Request
{ "code": "System.out.println(\"Hello\");", "language": "java" }

// Response 200
{ "output": "Hello\n", "error": null, "executionTimeMs": 150 }
```

---

## Exam Module

### GET /exam/problems
Lấy danh sách đề thi. Hỗ trợ filter.
```
Query params: difficulty=EASY|MEDIUM|HARD, topic=Array, page=0, size=20
```
```json
// Response 200
{
  "content": [
    {
      "id": "uuid",
      "title": "Tính tổng 2 số",
      "difficulty": "EASY",
      "topic": "Math",
      "myBestResult": "AC",    // null nếu chưa làm
      "myBestLang": "java"
    }
  ],
  "totalElements": 150,
  "page": 0,
  "size": 20
}
```

### GET /exam/problems/:id
Xem chi tiết đề bài.
```json
// Response 200
{
  "id": "uuid",
  "title": "Tính tổng 2 số",
  "description": "## Đề bài\n...",
  "difficulty": "EASY",
  "topic": "Math",
  "timeLimit": 2000,
  "memoryLimit": 256,
  "publicTestCases": [
    { "input": "1 2", "expectedOutput": "3" }
  ]
}
```

### POST /exam/problems/:id/submit *(auth required)*
Nộp bài thi.
```json
// Request
{ "code": "...", "language": "java" }

// Response 202 (async — polling hoặc WebSocket notification)
{ "submissionId": "uuid", "status": "PENDING" }
```

### GET /exam/submissions/:id *(auth required)*
Lấy kết quả submission.
```json
// Response 200
{
  "id": "uuid",
  "result": "AC",
  "points": 100,
  "executionTime": 120,
  "memoryUsed": 14000,
  "submittedAt": "2026-07-14T02:00:00Z"
}
```

### GET /exam/problems/:id/my-submissions *(auth required)*
Lịch sử submit của user cho 1 bài.
```json
// Response 200
[ { "id": "uuid", "result": "WA", "language": "java", "submittedAt": "..." }, ... ]
```

### GET /exam/leaderboard
Leaderboard theo ngôn ngữ.
```
Query params: problemId=uuid, language=java, page=0, size=50
```
```json
// Response 200
{
  "content": [
    { "rank": 1, "userId": "uuid", "name": "User A", "avatar": "...", "points": 100, "submittedAt": "2026-07-14T01:30:00Z" }
  ],
  "totalElements": 500,
  "myRank": 42
}
```

---

## Battle Module

### GET /battle/rooms
Danh sách phòng công khai đang chờ.
```
Query params: page=0, size=20
```
```json
// Response 200
{
  "content": [
    {
      "id": "uuid",
      "name": "Java Challenge",
      "status": "WAITING",
      "memberCount": 4,
      "maxMembers": 20,
      "numProblems": 3,
      "timeLimitMin": 60,
      "difficulty": "MEDIUM",
      "createdBy": { "id": "uuid", "name": "User A" }
    }
  ]
}
```

### POST /battle/rooms *(auth required)*
Tạo phòng mới.
```json
// Request
{
  "name": "Java Challenge",
  "numProblems": 3,
  "timeLimitMin": 60,
  "difficulty": "MEDIUM",
  "topic": null,
  "isPublic": true,
  "maxMembers": 20
}

// Response 201
{ "id": "uuid", "name": "Java Challenge", "status": "WAITING", ... }
```

### POST /battle/rooms/:id/join *(auth required)*
Join vào phòng.
```json
// Response 200
{ "roomId": "uuid", "joined": true }
// Lỗi nếu phòng đầy hoặc đã IN_PROGRESS:
// 400: { "code": "ROOM_FULL" } | { "code": "ROOM_ALREADY_STARTED" }
```

### POST /battle/rooms/:id/leave *(auth required)*
Rời phòng.
```json
// Response 200
{ "left": true }
```

### POST /battle/rooms/:id/invites/:userId *(auth required — chủ phòng)*
Validate lời mời bạn bè vào phòng battle đang WAITING. Chỉ chủ phòng được mời, người được mời phải là bạn bè và chưa ở trong phòng.
```json
// Response 200
{
  "roomId": "uuid",
  "roomName": "Battle nhanh",
  "inviterId": "uuid",
  "inviterName": "alice@example.com",
  "inviteeId": "uuid"
}
```

Sau khi API validate thành công, FE gửi socket event `battle:invite`; người được mời đang online nhận `battle:invite-received` và thấy popup tham gia/từ chối.

### DELETE /battle/rooms/:id/members/:userId *(auth required — chủ phòng)*
Kick một thành viên khỏi hàng chờ trước khi phòng start.
```json
// Response 200
{ "id": "uuid", "status": "WAITING", "members": [] }
```

### POST /battle/rooms/:id/ready *(auth required)*
Toggle trạng thái sẵn sàng.
```json
// Request
{ "ready": true }

// Response 200
{ "isReady": true }
```

### POST /battle/rooms/:id/start *(auth required — chủ phòng)*
Bắt đầu trận.
```json
// Response 200
{
  "startTime": "2026-07-14T02:00:00Z",
  "endTime": "2026-07-14T03:00:00Z",
  "problems": [ { "id": "uuid", "title": "...", "difficulty": "MEDIUM", "order": 1 } ]
}
// Lỗi: 403 nếu không phải chủ phòng, 400 nếu không đủ người sẵn sàng
```

### GET /battle/rooms/:id *(auth required)*
Lấy thông tin chi tiết phòng (dùng khi vào lobby/reconnect).
```json
// Response 200
{
  "id": "uuid",
  "name": "...",
  "status": "IN_PROGRESS",
  "startTime": "...",
  "endTime": "...",
  "members": [
    { "userId": "uuid", "name": "...", "isReady": true, "isCreator": true }
  ],
  "problems": [ { "id": "uuid", "title": "...", "order": 1 } ]
}
```

### POST /battle/rooms/:id/submit *(auth required)*
Nộp bài trong trận.
```json
// Request
{ "problemId": "uuid", "code": "...", "language": "java" }

// Response 202
{ "submissionId": "uuid", "status": "PENDING" }
// Lỗi: 403 nếu hết giờ hoặc phòng không IN_PROGRESS
```

### GET /battle/rooms/:id/leaderboard *(auth required)*
Leaderboard cuối trận (khi FINISHED).
```json
// Response 200
[
  {
    "rank": 1,
    "userId": "uuid",
    "name": "User A",
    "totalPoints": 100,
    "lastAcTime": "2026-07-14T02:25:00Z",
    "problemResults": [
      { "problemId": "uuid", "result": "AC", "points": 33, "submittedAt": "..." }
    ]
  }
]
```

---

## Messaging

### GET /chat/global?before=<ISO_timestamp>&limit=50
Lấy tin nhắn Global Chat (pagination ngược thời gian).
```json
// Response 200
[
  { "id": "uuid", "userId": "uuid", "name": "User A", "avatar": "...", "message": "Ai join không?", "createdAt": "..." }
]
```

### GET /chat/room/:roomId?before=<timestamp>&limit=50 *(auth required)*
Lấy lịch sử chat phòng Battle.

### GET /chat/dm/:userId?page=0&size=50 *(auth required)*
Lấy lịch sử Private Message với 1 user. Chỉ cho phép khi hai user đã là bạn bè.

### POST /chat/dm/:userId *(auth required)*
Gửi tin nhắn riêng cho bạn bè. Nếu chưa kết bạn, trả về `403 FORBIDDEN`.

### GET /chat/dm/conversations *(auth required)*
Danh sách các cuộc hội thoại DM.
```json
// Response 200
[
  {
    "partner": { "id": "uuid", "name": "...", "avatar": "..." },
    "lastMessage": "...",
    "lastMessageAt": "...",
    "unreadCount": 3
  }
]
```

---

## Friends & Social

### GET /users/search?q=<name_or_id> *(auth required)*
Tìm user để kết bạn bằng tên hoặc UUID.
```json
// Response 200
[
  { "id": "uuid", "name": "User A", "email": "masked@example.com", "friendStatus": "NONE" }
]
```

### GET /friends *(auth required)*
Danh sách bạn bè của user hiện tại.
```json
// Response 200
[
  { "id": "uuid", "name": "User A", "avatar": null, "online": true, "friendsSince": "..." }
]
```

### GET /friends/requests *(auth required)*
Lời mời kết bạn đến/đi.
```json
// Response 200
{
  "incoming": [ { "requestId": "uuid", "user": { "id": "uuid", "name": "..." }, "createdAt": "..." } ],
  "outgoing": [ { "requestId": "uuid", "user": { "id": "uuid", "name": "..." }, "createdAt": "..." } ]
}
```

### POST /friends/requests/:userId *(auth required)*
Gửi lời mời kết bạn.
```json
// Response 201
{ "requestId": "uuid", "status": "PENDING" }
```

### POST /friends/requests/:requestId/accept *(auth required)*
Chấp nhận lời mời kết bạn.
```json
// Response 200
{ "status": "ACCEPTED", "friendId": "uuid" }
```

### POST /friends/requests/:requestId/reject *(auth required)*
Từ chối lời mời kết bạn.
```json
// Response 200
{ "status": "REJECTED" }
```

### DELETE /friends/:userId *(auth required)*
Xóa bạn.
```json
// Response 200
{ "removed": true }
```

---

## Leaderboard

### GET /leaderboard/global
Bảng xếp hạng toàn hệ thống, cache Redis 5 phút.
```
Query params: type=all|exam|battle, language=all|java|python|c, limit=50
```
```json
// Response 200
[
  {
    "rank": 1,
    "userId": "uuid",
    "publicId": "1000000001",
    "userName": "alice@example.com",
    "totalPoints": 500,
    "totalAccepted": 3,
    "lastAcceptedAt": "2026-07-20T02:30:00Z"
  }
]
```

---

## Admin (🔒 ADMIN role)

### GET /admin/users?page=0&size=20&search=email
Danh sách users.

### PUT /admin/users/:id/ban
Ban/unban user.
```json
// Request
{ "banned": true, "reason": "Spam" }
```

### GET /admin/problems
### POST /admin/problems
Tạo bài tập mới.
```json
// Request
{
  "title": "...",
  "description": "# Markdown...",
  "difficulty": "EASY",
  "topic": "Array",
  "testCases": [
    { "input": "1 2", "expectedOutput": "3", "isHidden": false }
  ],
  "timeLimit": 2000,
  "memoryLimit": 256
}
```

### PUT /admin/problems/:id
### DELETE /admin/problems/:id

### GET /admin/stats
Thống kê hệ thống.
```json
// Response 200
{
  "totalUsers": 1500,
  "activeUsersToday": 120,
  "totalProblems": 200,
  "totalSubmissions": 50000,
  "totalBattleRooms": 300
}
```

### DELETE /admin/chat/:messageId
Xóa tin nhắn chat.

### PUT /admin/users/:id/mute
Mute user trong Global Chat.
