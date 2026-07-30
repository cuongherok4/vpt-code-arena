# WebSocket Events — Socket.io

> **WebSocket Service URL**: `ws://localhost:3001` (dev) | `wss://ws.vpt-arena.com` (prod)
> **Auth**: Gửi JWT trong `auth` option khi connect:
> ```js
> const socket = io('ws://localhost:3001', { auth: { token: 'Bearer eyJ...' } });
> ```

---

## 1. Battle Module

### Namespace: `/battle`

Mỗi phòng Battle có 1 Socket.io **room** riêng với key = `room:{roomId}`.

#### 1.1 Kết nối & Tham gia phòng

**Client → Server: `battle:join`**
Gửi sau khi kết nối để vào room Socket.io.
```js
// Emit
socket.emit('battle:join', { roomId: 'uuid' });

// Server ack (callback)
socket.emit('battle:join', { roomId }, (response) => {
  // response: { success: true, room: { ...roomInfo } }
  // hoặc: { success: false, error: 'ROOM_NOT_FOUND' | 'NOT_A_MEMBER' }
});
```

**Server → Client: `battle:member-joined`**
Broadcast tới tất cả trong phòng khi có người vào.
```json
// Payload
{ "userId": "uuid", "name": "User A", "avatar": "...", "memberCount": 5 }
```

**Client → Server: `battle:leave`**
Rời phòng (khi user bấm nút rời hoặc đóng tab).
```js
socket.emit('battle:leave', { roomId: 'uuid' });
```

**Server → Client: `battle:member-left`**
```json
{ "userId": "uuid", "name": "User A", "memberCount": 4 }
```

#### 1.2 Lobby (WAITING state)

**Client → Server: `battle:ready`**
Toggle sẵn sàng.
```js
socket.emit('battle:ready', { roomId: 'uuid', ready: true });
```

**Server → Client: `battle:ready-update`**
Broadcast khi có người thay đổi trạng thái sẵn sàng.
```json
{
  "userId": "uuid",
  "isReady": true,
  "readyCount": 3,
  "totalMembers": 5
}
```

**Server → Client: `battle:invite-received`**
Gửi riêng cho người được mời. FE phải hiển thị popup/ô mời toàn cục, kể cả khi user đang ở trang khác.
```json
{
  "inviteId": "uuid",
  "roomId": "uuid",
  "roomName": "Java Challenge",
  "senderId": "uuid",
  "senderName": "User Host",
  "expiresAt": "2026-07-19T01:30:00.000Z"
}
```

Popup invite có tối thiểu 2 action:
- [Tham gia] → gọi `POST /battle/rooms/invites/:inviteId/accept`, rồi navigate vào phòng.
- [Từ chối] → gọi `POST /battle/rooms/invites/:inviteId/reject`, đóng popup.

**Server → Client: `battle:invite-expired`**
Gửi riêng khi lời mời hết hạn, phòng đã start, phòng đầy, hoặc host hủy phòng.
```json
{ "inviteId": "uuid", "roomId": "uuid", "reason": "ROOM_STARTED" }
```

#### 1.3 Bắt đầu trận

**Server → Client: `battle:started`**
Broadcast tới TẤT CẢ thành viên khi chủ phòng bấm start (sau REST POST /battle/rooms/:id/start).
```json
{
  "startTime": "2026-07-14T02:00:00.000Z",
  "endTime": "2026-07-14T03:00:00.000Z",
  "problems": [
    {
      "id": "uuid",
      "title": "Tính tổng 2 số",
      "description": "## ...",
      "difficulty": "EASY",
      "order": 1,
      "timeLimit": 2000,
      "memoryLimit": 256,
      "publicTestCases": [{ "input": "1 2", "expectedOutput": "3" }]
    }
  ]
}
```

#### 1.4 Trong trận (IN_PROGRESS)

**Server → Client: `battle:tick`**
Countdown timer — server emit mỗi 1 giây tới tất cả thành viên trong phòng.
```json
{ "roomId": "uuid", "remainingSeconds": 3540 }
```

> **Lưu ý**: FE cũng chạy timer local, `battle:tick` dùng để đồng bộ/correct drift. Không cần render mỗi tick — FE chỉ dùng để sync.

**Server → Client: `battle:submission-result`**
Chỉ gửi tới **user vừa submit** (private emit) khi Judge trả kết quả.
```json
{
  "submissionId": "uuid",
  "problemId": "uuid",
  "result": "AC",
  "points": 33,
  "executionTime": 120,
  "memoryUsed": 14000
}
```

**Server → Client: `battle:leaderboard-update`**
Broadcast tới TẤT CẢ khi có submission được chấm xong (cập nhật leaderboard real-time).
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "userId": "uuid",
      "name": "User A",
      "avatar": "...",
      "totalPoints": 66,
      "solvedCount": 2,
      "lastAcTime": "2026-07-14T02:15:00.000Z"
    },
    {
      "rank": 2,
      "userId": "uuid2",
      "name": "User B",
      "totalPoints": 33,
      "solvedCount": 1,
      "lastAcTime": "2026-07-14T02:20:00.000Z"
    }
  ]
}
```

#### 1.5 Kết thúc trận

**Server → Client: `battle:finished`**
Broadcast khi hết giờ (trigger bởi Spring Scheduler, không phải client).
```json
{
  "roomId": "uuid",
  "finalLeaderboard": [
    {
      "rank": 1,
      "userId": "uuid",
      "name": "User A",
      "totalPoints": 100,
      "lastAcTime": "2026-07-14T02:25:00.000Z",
      "problemResults": [
        { "problemId": "uuid", "result": "AC", "points": 33, "submittedAt": "..." }
      ]
    }
  ]
}
```

#### 1.6 Error Events

**Server → Client: `battle:error`**
Gửi riêng cho client gây lỗi.
```json
{ "code": "ROOM_ALREADY_STARTED", "message": "Trận đã bắt đầu, không thể tham gia." }
{ "code": "SUBMISSION_CLOSED",    "message": "Hết giờ, không nhận bài nộp." }
{ "code": "UNAUTHORIZED",         "message": "Token không hợp lệ." }
```

---

## 2. Messaging

### Namespace: `/chat`

#### 2.1 Global Chat

**Client → Server: `chat:global:send`**
```js
socket.emit('chat:global:send', { message: 'Ai join không?' }, (ack) => {
  // ack: { success: true, messageId: 'uuid' } hoặc { success: false, error: '...' }
});
```

**Server → Client: `chat:global:new-message`**
Broadcast tới tất cả user đang kết nối.
```json
{
  "id": "uuid",
  "userId": "uuid",
  "name": "User A",
  "avatar": "https://...",
  "message": "Ai join không?",
  "createdAt": "2026-07-14T02:00:00.000Z"
}
```

#### 2.2 Room Chat (trong Battle)

**Client → Server: `chat:room:send`**
```js
socket.emit('chat:room:send', { roomId: 'uuid', message: 'GG!' });
```

**Server → Client: `chat:room:new-message`**
Broadcast chỉ trong room Socket.io của phòng đó.
```json
{
  "id": "uuid",
  "roomId": "uuid",
  "userId": "uuid",
  "name": "User A",
  "message": "GG!",
  "createdAt": "..."
}
```

#### 2.3 Private Message (DM)

**Client → Server: `chat:dm:send`**
```js
socket.emit('chat:dm:send', {
  receiverId: 'uuid',
  message: 'Chào bạn!'
}, (ack) => {
  // ack: { success: true, messageId: 'uuid' }
});
```

**Server → Client: `chat:dm:new-message`**
Gửi riêng cho `receiverId` (nếu đang online).
```json
{
  "id": "uuid",
  "senderId": "uuid",
  "senderName": "User A",
  "senderAvatar": "...",
  "message": "Chào bạn!",
  "createdAt": "..."
}
```

#### 2.4 Online Status

**Server → Client: `user:online`**
Broadcast khi user kết nối.
```json
{ "userId": "uuid", "name": "User A" }
```

**Server → Client: `user:offline`**
Broadcast khi user disconnect.
```json
{ "userId": "uuid" }
```

---

## 3. Notification Events

### Namespace: `/notification`

**Server → Client: `notification:new`**
Gửi riêng cho từng user.
```json
{
  "id": "uuid",
  "type": "BATTLE_STARTED" | "BATTLE_INVITE" | "DM_RECEIVED" | "LESSON_BADGE",
  "title": "Trận đấu bắt đầu!",
  "message": "Java Challenge đã bắt đầu",
  "data": { "roomId": "uuid" },
  "createdAt": "..."
}
```

Với `type = "BATTLE_INVITE"`, FE hiển thị popup ưu tiên cao thay vì chỉ toast thường.

---

## 4. Flow tổng quan (Battle)

```
[User A - Host]              [WebSocket Server]          [User B, C, D]
    |                               |                          |
    |── battle:join ──────────────►|                          |
    |                               |── battle:member-joined ►|
    |                               |                          |
    |── battle:ready(true) ────────►|                          |
    |                               |── battle:ready-update ──►|
    |                               |                          |
    | [REST POST /start] ──────────►Spring Boot──────────────►|
    |                               |                          |
    |◄── battle:started ────────────|─────── battle:started ──►|
    |                               |                          |
    |   [30s later, User B submits] |                          |
    |                               |◄── REST POST /submit ───|
    |                               |── (gọi Judge Service)    |
    |                               |◄── judge result          |
    |                               |── battle:submission-result ► (chỉ User B)
    |◄── battle:leaderboard-update ─|──────────────────────────►|
    |                               |                          |
    |   [Hết giờ — Spring Scheduler]|                          |
    |◄── battle:finished ───────────|─────── battle:finished ──►|
```

---

## 5. Lưu ý triển khai

| Điểm | Chi tiết |
|---|---|
| JWT validation | WebSocket Service validate JWT bằng cách gọi `GET /api/v1/auth/validate` trên Spring Boot (hoặc verify cùng secret key) |
| Room isolation | Dùng Socket.io room với key `room:{roomId}` — broadcast chỉ tới đúng phòng |
| Countdown source of truth | `end_time` lưu trong Redis, Spring Scheduler trigger `battle:finished` khi đến giờ |
| Reconnect | Client tự reconnect (Socket.io tự động), sau đó emit `battle:join` lại để lấy state hiện tại |
| Rate limiting | Giới hạn `chat:*:send` 5 msg/giây/user ở WebSocket Service |
