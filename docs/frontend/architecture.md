# Frontend Architecture — React 18 + TypeScript

> **Build tool**: Vite | **Styling**: Tailwind CSS + Shadcn/ui | **State**: Zustand | **Router**: React Router v6

---

## 1. Cấu trúc thư mục

```
frontend/src/
├─ main.tsx                    # Entry point, wrap App với Providers
├─ App.tsx                     # Router setup
├─ router/
│  └─ index.tsx                # Route definitions, protected routes
├─ components/                 # Shared components (dùng ở nhiều page)
│  ├─ ui/                      # Shadcn/ui components (Button, Input, Dialog...)
│  ├─ layout/
│  │  ├─ Navbar.tsx
│  │  ├─ Sidebar.tsx            # Sidebar bài học (Learn module)
│  │  └─ PageLayout.tsx         # Wrapper chung: Navbar + content
│  ├─ editor/
│  │  └─ CodeEditor.tsx         # Monaco Editor wrapper có language switcher
│  └─ common/
│     ├─ Avatar.tsx
│     ├─ LoadingSpinner.tsx
│     ├─ ErrorBoundary.tsx
│     └─ ProtectedRoute.tsx
├─ pages/                      # Route-level components
├─ store/                      # Zustand global state
├─ hooks/                      # Custom hooks
├─ api/                        # API layer (Axios)
└─ types/                      # TypeScript types/interfaces
```

---

## 2. Routing — `router/index.tsx`

```tsx
// router/index.tsx
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

export const router = createBrowserRouter([
  // Public routes
  { path: '/login',    element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/auth/callback', element: <OAuthCallbackPage /> },  // OAuth redirect

  // Protected routes — cần đăng nhập
  {
    element: <ProtectedRoute />,   // Redirect về /login nếu chưa đăng nhập
    children: [
      { path: '/',          element: <HomePage /> },
      { path: '/learn',     element: <LearnPage /> },
      { path: '/learn/:lessonId', element: <LessonPage /> },
      { path: '/exam',      element: <ExamListPage /> },
      { path: '/exam/:problemId', element: <ExamProblemPage /> },
      { path: '/battle',    element: <BattleLobbyPage /> },
      { path: '/battle/:roomId', element: <BattleRoomPage /> },
      { path: '/leaderboard', element: <LeaderboardPage /> },
      { path: '/profile',   element: <ProfilePage /> },
      { path: '/profile/:userId', element: <ProfilePage /> },
    ],
  },

  // Admin routes — cần role ADMIN
  {
    element: <ProtectedRoute requiredRole="ADMIN" />,
    children: [
      { path: '/admin', element: <AdminPage /> },
    ],
  },
]);
```

```tsx
// components/common/ProtectedRoute.tsx
export function ProtectedRoute({ requiredRole }: { requiredRole?: string }) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/" replace />;

  return <Outlet />;
}
```

---

## 3. State Management — Zustand Stores

### `store/authStore.ts`

```typescript
interface AuthState {
  user: User | null;
  isLoading: boolean;
  accessToken: string | null;

  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => void;
  loginWithGithub: () => void;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  setUserFromOAuth: (token: string, refreshToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      accessToken: null,

      login: async (email, password) => {
        set({ isLoading: true });
        const { accessToken, refreshToken, user } = await authApi.login(email, password);
        localStorage.setItem('refreshToken', refreshToken);
        set({ user, accessToken, isLoading: false });
      },

      logout: async () => {
        await authApi.logout(localStorage.getItem('refreshToken')!);
        localStorage.removeItem('refreshToken');
        set({ user: null, accessToken: null });
      },

      // OAuth callback page gọi cái này
      setUserFromOAuth: (token, refresh) => {
        localStorage.setItem('refreshToken', refresh);
        const decoded = jwtDecode<JwtPayload>(token);
        set({ accessToken: token, user: { id: decoded.sub, ... } });
      },
    }),
    { name: 'auth-storage', partialize: (state) => ({ user: state.user }) }
  )
);
```

### `store/battleStore.ts`

```typescript
interface BattleState {
  room: Room | null;
  problems: Problem[];
  leaderboard: LeaderboardRow[];
  remainingSeconds: number;
  mySubmissions: Record<string, SubmissionResult>; // problemId → result

  setRoom: (room: Room) => void;
  updateLeaderboard: (rows: LeaderboardRow[]) => void;
  setSubmissionResult: (problemId: string, result: SubmissionResult) => void;
  tick: () => void;
  reset: () => void;
}

export const useBattleStore = create<BattleState>()((set) => ({
  room: null,
  problems: [],
  leaderboard: [],
  remainingSeconds: 0,
  mySubmissions: {},

  tick: () => set((state) => ({ remainingSeconds: Math.max(0, state.remainingSeconds - 1) })),
  // ...
}));
```

---

## 4. API Layer — `api/client.ts`

```typescript
// api/client.ts — Axios instance với auto refresh token
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10_000,
});

// Request interceptor — đính kèm access token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — auto refresh khi 401
let isRefreshing = false;
let failedQueue: any[] = [];

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status !== 401) return Promise.reject(error);

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        error.config.headers.Authorization = `Bearer ${token}`;
        return apiClient(error.config);
      });
    }

    isRefreshing = true;
    try {
      await useAuthStore.getState().refreshToken();
      const newToken = useAuthStore.getState().accessToken;
      failedQueue.forEach(({ resolve }) => resolve(newToken));
      return apiClient(error.config);
    } catch {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
      failedQueue = [];
    }
  }
);

export default apiClient;
```

---

## 5. WebSocket Hooks

### `hooks/useBattleSocket.ts`

```typescript
export function useBattleSocket(roomId: string) {
  const socket = useRef<Socket | null>(null);
  const { updateLeaderboard, setSubmissionResult, tick, setRoom } = useBattleStore();

  useEffect(() => {
    const token = useAuthStore.getState().accessToken;
    socket.current = io(`${import.meta.env.VITE_WS_URL}/battle`, {
      auth: { token: `Bearer ${token}` },
    });

    socket.current.emit('battle:join', { roomId }, (response: any) => {
      if (response.success) setRoom(response.room);
    });

    socket.current.on('battle:started',            handleStarted);
    socket.current.on('battle:tick',               ({ remainingSeconds }) => tick());
    socket.current.on('battle:leaderboard-update', ({ leaderboard }) => updateLeaderboard(leaderboard));
    socket.current.on('battle:submission-result',  (result) => setSubmissionResult(result.problemId, result));
    socket.current.on('battle:finished',           handleFinished);
    socket.current.on('battle:member-joined',      handleMemberJoined);
    socket.current.on('battle:member-left',        handleMemberLeft);

    return () => {
      socket.current?.emit('battle:leave', { roomId });
      socket.current?.disconnect();
    };
  }, [roomId]);

  const submitCode = useCallback((problemId: string, code: string, language: string) => {
    // Submit qua REST API, không qua WebSocket
    return battleApi.submit(roomId, { problemId, code, language });
  }, [roomId]);

  return { submitCode };
}
```

---

## 6. CodeEditor Component

```tsx
// components/editor/CodeEditor.tsx
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  defaultLanguage?: string;
  value?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: string;
}

export function CodeEditor({ defaultLanguage = 'java', value, onChange, readOnly, height = '400px' }: CodeEditorProps) {
  const [language, setLanguage] = useState(defaultLanguage);

  const SUPPORTED_LANGUAGES = [
    { value: 'java',       label: 'Java' },
    { value: 'python',     label: 'Python 3' },
    { value: 'cpp',        label: 'C++' },
    { value: 'javascript', label: 'JavaScript' },
  ];

  return (
    <div className="flex flex-col border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800">
        <Select value={language} onValueChange={setLanguage}>
          {SUPPORTED_LANGUAGES.map(lang => (
            <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
          ))}
        </Select>
      </div>

      {/* Monaco Editor */}
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={(val) => onChange?.(val ?? '')}
        theme="vs-dark"
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          readOnly,
          tabSize: 4,
        }}
      />
    </div>
  );
}
```

---

## 7. Environment Variables

```env
# frontend/.env.local
VITE_API_URL=http://localhost:8080/api/v1
VITE_WS_URL=ws://localhost:3001
```

---

## 8. Key Design Decisions

| Quyết định | Lý do |
|---|---|
| Zustand thay Redux | Ít boilerplate, đủ dùng cho app này |
| React Query cho server state | Cache, loading state, error handling tự động |
| Zustand chỉ cho client state | Auth, battle state, UI state — không phải server data |
| Socket emit qua REST, không WS | Submit bài qua REST để Spring Boot validate + log; WS chỉ nhận kết quả |
| Monaco Editor | Cùng engine với VS Code — syntax highlight tốt, IntelliSense |
| Axios interceptor refresh | Transparent token refresh — user không biết token đã expire |
