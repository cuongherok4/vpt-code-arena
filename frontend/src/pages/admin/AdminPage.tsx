import { useEffect, useMemo, useState, type ElementType, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Shield,
  Trash2,
  Users,
  LayoutDashboard,
  FileText,
  TrendingUp,
  ChevronUp,
  ExternalLink,
  KeyRound,
  LogOut,
  UserCircle,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { adminApi, type AdminProblem, type AdminProblemPayload, type AdminProblemTestCase } from '@/api/admin.api';
import type { Difficulty } from '@/api/exam.api';
import { useChatSocket } from '@/hooks/useChatSocket';
import { useAuthStore } from '@/stores/authStore';

type AdminTab = 'overview' | 'users' | 'problems' | 'stats';

const SIDEBAR_ITEMS: { id: AdminTab; icon: ElementType; label: string; desc: string }[] = [
  { id: 'overview',  icon: LayoutDashboard, label: 'Tổng quan',  desc: 'Thống kê nhanh' },
  { id: 'users',     icon: Users,           label: 'Người dùng', desc: 'Quản lý tài khoản' },
  { id: 'problems',  icon: FileText,        label: 'Bài tập',    desc: 'Ngân hàng đề' },
  { id: 'stats',     icon: BarChart3,       label: 'Thống kê',   desc: 'Báo cáo chi tiết' },
];

const emptyForm: AdminProblemPayload = {
  title: '',
  description: '',
  difficulty: 'EASY',
  topic: '',
  timeLimitMs: 2000,
  memoryLimitKb: 256000,
  testCases: [{ input: '', expectedOutput: '', isHidden: false }],
  solutionCode: '',
  published: false,
};

export default function AdminPage() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<AdminTab>('overview');
  const [accountOpen, setAccountOpen] = useState(false);
  const { onlineUserIds, refreshOnlineUsers } = useChatSocket({ enabled: isAuthenticated && user?.role === 'ADMIN' });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') return;
    const intervalId = window.setInterval(() => {
      refreshOnlineUsers().catch(() => undefined);
    }, 1_000);
    return () => window.clearInterval(intervalId);
  }, [isAuthenticated, refreshOnlineUsers, user?.role]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && accountOpen) {
        setAccountOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [accountOpen]);

  /* ── Access guard ── */
  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="app-panel mx-auto max-w-md p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-red-400/20 bg-red-400/10 text-red-300">
          <Lock size={28} />
        </div>
        <h1 className="mb-2 text-xl font-bold text-white">Cần quyền Admin</h1>
        <p className="mb-6 text-sm text-slate-400">Khu vực này chỉ dành cho tài khoản có role ADMIN.</p>
        <Link
          to={isAuthenticated ? '/' : '/login'}
          className="app-button app-button-primary"
        >
          {isAuthenticated ? 'Về trang chủ' : 'Đăng nhập'}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen gap-0">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/10 bg-slate-950/78 shadow-xl shadow-black/20 backdrop-blur lg:flex" aria-label="Thanh điều hướng Admin">
        <div className="border-b border-white/10 px-4 py-4">
          <Link to="/" className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.04]" aria-label="Trở về trang chủ">
            <img src="/logocty.png" alt="VPT" className="h-9 w-auto object-contain" />
            <div>
              <p className="text-sm font-bold text-white">VPT Code Arena</p>
              <p className="text-[11px] text-slate-400">Admin Console</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4" role="tablist" aria-label="Danh mục quản trị">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 focus-visible:outline-none ${
                  active
                    ? 'bg-cyan-300/10 text-cyan-100 ring-1 ring-cyan-300/15'
                    : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
                }`}
              >
                <Icon size={18} className="shrink-0" />
                <div>
                  <div className="text-sm font-semibold">{item.label}</div>
                  <div className="text-[10px] leading-none text-slate-400">{item.desc}</div>
                </div>
                {active && (
                  <div className="ml-auto h-5 w-1 rounded-full bg-cyan-300" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="relative border-t border-white/10 px-3 py-3">
          {accountOpen && (
            <div
              role="menu"
              aria-label="Menu tài khoản admin"
              className="absolute bottom-[76px] left-3 right-3 overflow-hidden rounded-lg border border-white/10 bg-slate-950 shadow-[var(--shadow-app-popover)]"
            >
              <div className="border-b border-white/10 p-3">
                <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                <p className="truncate text-xs text-slate-400">{user.email}</p>
                {user.publicId && <p className="mt-1 text-[11px] text-cyan-200 font-mono">ID {user.publicId}</p>}
              </div>
              <div className="p-1.5">
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-slate-300 transition-colors hover:bg-white/[0.05] hover:text-white"
                >
                  <KeyRound size={15} />
                  Đổi mật khẩu
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-slate-300 transition-colors hover:bg-white/[0.05] hover:text-white"
                >
                  <ExternalLink size={15} />
                  Chuyển qua trang khách
                </button>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-red-200 transition-colors hover:bg-red-400/10"
                >
                  <LogOut size={15} />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            aria-expanded={accountOpen}
            aria-label="Tài khoản Admin"
            onClick={() => setAccountOpen((value) => !value)}
            className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left transition-colors hover:border-cyan-300/25 hover:bg-white/[0.06] focus-visible:outline-none"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
              <UserCircle size={17} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-white">{user.name}</span>
              <span className="block truncate text-[11px] text-slate-400">{user.role}</span>
            </span>
            <ChevronUp size={15} className={`shrink-0 text-slate-400 transition-transform ${accountOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64">
        <div className="border-b border-white/10 bg-slate-950/75 lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <button
              type="button"
              onClick={() => setAccountOpen((value) => !value)}
              className="flex min-w-0 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2"
            >
              <UserCircle size={17} className="shrink-0 text-cyan-100" />
              <span className="truncate text-sm font-semibold text-white">{user.name}</span>
            </button>
            <Link to="/" className="flex shrink-0 items-center gap-2">
              <img src="/logocty.png" alt="VPT" className="h-7 w-auto object-contain" />
              <span className="text-xs font-bold text-white">
                VPT <span className="text-cyan-300">Arena</span>
              </span>
            </Link>
          </div>

          {accountOpen && (
            <div className="mx-4 mb-3 rounded-lg border border-white/10 bg-slate-950 p-2">
              <button type="button" onClick={() => navigate('/forgot-password')} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-slate-300 hover:bg-white/[0.05]">
                <KeyRound size={15} />
                Đổi mật khẩu
              </button>
              <button type="button" onClick={() => navigate('/')} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-slate-300 hover:bg-white/[0.05]">
                <ExternalLink size={15} />
                Chuyển qua trang khách
              </button>
              <button type="button" onClick={() => void logout()} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-red-200 hover:bg-red-400/10">
                <LogOut size={15} />
                Đăng xuất
              </button>
            </div>
          )}

          <div className="flex gap-1 overflow-x-auto px-4 pb-2">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    tab === item.id
                      ? 'bg-cyan-300/10 text-cyan-100'
                      : 'text-slate-500 hover:bg-white/[0.05]'
                  }`}
                >
                  <Icon size={14} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div className="app-kicker">
              <Shield size={14} />
              Quản trị hệ thống
            </div>
            <h1 className="app-page-heading">
              {SIDEBAR_ITEMS.find(i => i.id === tab)?.label}
            </h1>
            <p className="app-page-subtitle">
              {SIDEBAR_ITEMS.find(i => i.id === tab)?.desc}
            </p>
          </div>

          {tab === 'overview'  && <OverviewTab onlineCount={onlineUserIds.size} />}
          {tab === 'users'     && <UsersTab onlineUserIds={onlineUserIds} />}
          {tab === 'problems'  && <ProblemsTab />}
          {tab === 'stats'     && <StatsTab />}
        </div>
      </main>
    </div>
  );
}

/* ─── Overview Tab ──────────────────────────────────── */
function OverviewTab({ onlineCount }: { onlineCount: number }) {
  const statsQuery = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.stats,
    refetchInterval: 30_000,
  });

  const stats = statsQuery.data;

  return (
    <div className="space-y-6">
      {!stats && <StateBox loading={statsQuery.isLoading} error={statsQuery.isError} />}
      {stats && (
        <>
          <section className="app-panel overflow-hidden">
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="p-5">
                <div className="app-kicker">
                  <LayoutDashboard size={15} />
                  System overview
                </div>
                <h2 className="text-xl font-bold text-white">Tổng quan vận hành</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  Theo dõi nhanh người dùng, ngân hàng đề, submission và phòng battle đang hoạt động trong hệ thống.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <OverviewSignal
                    label="Tỷ lệ đề publish"
                    value={`${percent(stats.publishedProblems, stats.totalProblems)}%`}
                    hint={`${stats.publishedProblems}/${stats.totalProblems} bài`}
                  />
                  <OverviewSignal
                    label="Tài khoản online"
                    value={onlineCount.toLocaleString('vi-VN')}
                    hint="Đang kết nối realtime"
                  />
                  <OverviewSignal
                    label="Phòng đang mở"
                    value={stats.totalBattleRooms.toLocaleString('vi-VN')}
                    hint="WAITING hoặc IN_PROGRESS"
                  />
                </div>
              </div>

              <div className="border-t border-white/10 bg-white/[0.025] p-5 lg:border-t-0 lg:border-l">
                <p className="text-sm font-semibold text-white">Trạng thái hệ thống</p>
                <div className="mt-4 space-y-3">
                  <HealthRow label="Auth/User" value={`${onlineCount.toLocaleString('vi-VN')} online`} tone="success" />
                  <HealthRow label="Exam/Judge" value={`${stats.totalSubmissions.toLocaleString('vi-VN')} submissions`} tone="info" />
                  <HealthRow label="Battle realtime" value={`${stats.totalBattleRooms.toLocaleString('vi-VN')} phòng đang mở`} tone="warn" />
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <QuickStatCard label="Tổng người dùng" value={stats.totalUsers} icon={Users} tone="cyan" />
            <QuickStatCard label="Hoạt động hôm nay" value={stats.activeUsersToday} icon={TrendingUp} tone="emerald" />
            <QuickStatCard label="Tổng bài tập" value={stats.totalProblems} icon={FileText} tone="amber" />
            <QuickStatCard label="Đã publish" value={stats.publishedProblems} icon={CheckCircle2} tone="emerald" />
            <QuickStatCard label="Tổng submissions" value={stats.totalSubmissions} icon={BarChart3} tone="cyan" />
            <QuickStatCard label="Phòng đang mở" value={stats.totalBattleRooms} icon={Shield} tone="amber" />
          </div>
        </>
      )}
    </div>
  );
}

function QuickStatCard({ label, value, icon: Icon, tone }: {
  label: string; value: number; icon: ElementType; tone: 'cyan' | 'emerald' | 'amber';
}) {
  const palette = {
    cyan: 'border-cyan-300/20 bg-cyan-300/10 text-cyan-200',
    emerald: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200',
    amber: 'border-amber-300/20 bg-amber-300/10 text-amber-200',
  }[tone];
  const valueColor = {
    cyan: 'text-cyan-100',
    emerald: 'text-emerald-100',
    amber: 'text-amber-100',
  }[tone];

  return (
    <div className="app-card p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-400">{label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${palette}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className={`mt-3 text-3xl font-black ${valueColor}`}>{value.toLocaleString('vi-VN')}</div>
    </div>
  );
}

function OverviewSignal({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/45 p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

function HealthRow({ label, value, tone }: { label: string; value: string; tone: 'success' | 'info' | 'warn' }) {
  const dotClass = {
    success: 'bg-emerald-300',
    info: 'bg-cyan-300',
    warn: 'bg-amber-300',
  }[tone];

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2">
      <span className="flex items-center gap-2 text-sm text-slate-300">
        <span className={`h-2 w-2 rounded-full ${dotClass}`} />
        {label}
      </span>
      <span className="text-xs font-semibold text-slate-400">{value}</span>
    </div>
  );
}

function percent(part: number, total: number) {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

/* ─── Users Tab ─────────────────────────────────────── */
function UsersTab({ onlineUserIds }: { onlineUserIds: Set<string> }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const usersQuery = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => adminApi.users({ search: search || undefined, size: 50 }),
  });

  const banMutation = useMutation({
    mutationFn: ({ userId, banned }: { userId: string; banned: boolean }) =>
      adminApi.setUserBan(userId, banned),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  return (
    <section className="app-panel">
      <div className="border-b border-white/10 p-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo email, tên hoặc ID..."
          className="app-field"
        />
      </div>
      <StateBox loading={usersQuery.isLoading} error={usersQuery.isError} />
      {usersQuery.data && (
        <div className="overflow-x-auto">
          <table className="app-table min-w-[720px]">
            <thead>
              <tr>
                <th>Tên</th>
                <th>ID</th>
                <th>Role</th>
                <th>Email</th>
                <th>Trạng thái</th>
                <th>Online</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {usersQuery.data.items.map((item) => (
                <tr key={item.id}>
                  <td className="font-semibold text-white">{item.name}</td>
                  <td className="text-slate-500">{item.publicId}</td>
                  <td>
                    <Badge tone={item.role === 'ADMIN' ? 'warn' : 'muted'}>{item.role}</Badge>
                  </td>
                  <td>{item.email}</td>
                  <td>{item.banned ? <Badge tone="danger">Banned</Badge> : <Badge tone="success">Active</Badge>}</td>
                  <td>
                    {onlineUserIds.has(item.id)
                      ? <Badge tone="success">Online</Badge>
                      : <Badge tone="muted">Offline</Badge>}
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={() => banMutation.mutate({ userId: item.id, banned: !item.banned })}
                      disabled={banMutation.isPending}
                      className={`app-button px-3 py-1.5 text-xs ${item.banned ? 'app-button-secondary' : 'app-button-danger'}`}
                    >
                      {item.banned ? 'Unban' : 'Ban'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ─── Problems Tab ──────────────────────────────────── */
function ProblemsTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<AdminProblem | null>(null);
  const [form, setForm] = useState<AdminProblemPayload>(emptyForm);
  const [testCasesText, setTestCasesText] = useState(formatTestCases(emptyForm.testCases));
  const [formError, setFormError] = useState('');

  const problemsQuery = useQuery({
    queryKey: ['admin-problems', search],
    queryFn: () => adminApi.problems({ search: search || undefined, size: 50 }),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: AdminProblemPayload) =>
      editing ? adminApi.updateProblem(editing.id, payload) : adminApi.createProblem(payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-problems'] }); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteProblem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-problems'] }),
  });

  const parsedTestCases = useMemo(() => {
    try {
      const v = JSON.parse(testCasesText) as AdminProblemTestCase[];
      return Array.isArray(v) ? v : null;
    } catch { return null; }
  }, [testCasesText]);

  const resetForm = () => {
    setEditing(null); setForm(emptyForm);
    setTestCasesText(formatTestCases(emptyForm.testCases)); setFormError('');
  };

  const startEdit = (p: AdminProblem) => {
    setEditing(p);
    setForm({ title: p.title, description: p.description, difficulty: p.difficulty, topic: p.topic, timeLimitMs: p.timeLimitMs, memoryLimitKb: p.memoryLimitKb, testCases: p.testCases, solutionCode: p.solutionCode ?? '', published: p.published });
    setTestCasesText(formatTestCases(p.testCases)); setFormError('');
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!parsedTestCases || parsedTestCases.length === 0) {
      setFormError('Test cases phải là JSON array hợp lệ và có ít nhất 1 case.'); return;
    }
    setFormError('');
    saveMutation.mutate({ ...form, testCases: parsedTestCases });
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
      {/* List */}
      <section className="app-panel">
        <div className="border-b border-white/10 p-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tiêu đề hoặc chủ đề..."
            className="app-field"
          />
        </div>
        <StateBox loading={problemsQuery.isLoading} error={problemsQuery.isError} />
        {problemsQuery.data && (
          <div className="divide-y divide-white/10">
            {problemsQuery.data.items.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-white/[0.035]">
                <div>
                  <div className="font-semibold text-white">{item.title}</div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span>{item.topic}</span>
                    <span className="font-medium">{item.difficulty}</span>
                    <span>{item.timeLimitMs}ms</span>
                    {item.published
                      ? <Badge tone="success">Published</Badge>
                      : <Badge tone="warn">Draft</Badge>
                    }
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => startEdit(item)} className="icon-action" title="Sửa"><Pencil size={15} /></button>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(item.id)}
                    disabled={deleteMutation.isPending}
                    className="icon-action text-red-300 hover:border-red-300/40 hover:bg-red-400/10"
                    title="Xóa"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Form */}
      <section className="app-panel">
        <div className="app-panel-header">
          <h2 className="font-bold text-white">{editing ? 'Sửa bài tập' : 'Tạo bài tập mới'}</h2>
          <p className="mt-0.5 text-xs text-slate-500">Test cases nhập dạng JSON array.</p>
        </div>
        <form onSubmit={submit} className="space-y-3 p-4">
          {formError && <InlineError message={formError} />}
          <AdminInput label="Tiêu đề" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <AdminInput label="Chủ đề" value={form.topic} onChange={(v) => setForm({ ...form, topic: v })} />
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-slate-400">
              Độ khó
              <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value as Difficulty })} className="mt-1 admin-field">
                <option value="EASY">EASY</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HARD">HARD</option>
              </select>
            </label>
            <label className="flex items-end gap-2 text-xs font-medium text-slate-400">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="mb-2 h-4 w-4 accent-teal-300" />
              Published
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AdminNumber label="Time (ms)" value={form.timeLimitMs} onChange={(v) => setForm({ ...form, timeLimitMs: v })} />
            <AdminNumber label="Memory (KB)" value={form.memoryLimitKb} onChange={(v) => setForm({ ...form, memoryLimitKb: v })} />
          </div>
          <AdminTextArea label="Mô tả" rows={4} value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
          <AdminTextArea label="Test cases JSON" rows={6} value={testCasesText} onChange={setTestCasesText} />
          <AdminTextArea label="Solution code" rows={4} value={form.solutionCode ?? ''} onChange={(v) => setForm({ ...form, solutionCode: v })} />
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saveMutation.isPending} className="app-button app-button-primary flex-1">
              {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {editing ? 'Lưu thay đổi' : 'Tạo bài'}
            </button>
            {editing && (
              <button type="button" onClick={resetForm} className="app-button app-button-secondary">Hủy</button>
            )}
          </div>
          {saveMutation.isError && <InlineError message="Không thể lưu. Kiểm tra dữ liệu hoặc quyền admin." />}
        </form>
      </section>
    </div>
  );
}

/* ─── Stats Tab ─────────────────────────────────────── */
function StatsTab() {
  const statsQuery = useQuery({ queryKey: ['admin-stats'], queryFn: adminApi.stats, refetchInterval: 30_000 });
  if (!statsQuery.data) return <StateBox loading={statsQuery.isLoading} error={statsQuery.isError} />;
  const s = statsQuery.data;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <QuickStatCard label="Tổng người dùng" value={s.totalUsers} icon={Users} tone="cyan" />
      <QuickStatCard label="Hoạt động hôm nay" value={s.activeUsersToday} icon={TrendingUp} tone="emerald" />
      <QuickStatCard label="Tổng bài tập" value={s.totalProblems} icon={FileText} tone="amber" />
      <QuickStatCard label="Đã publish" value={s.publishedProblems} icon={CheckCircle2} tone="emerald" />
      <QuickStatCard label="Tổng submissions" value={s.totalSubmissions} icon={BarChart3} tone="cyan" />
      <QuickStatCard label="Phòng đang mở" value={s.totalBattleRooms} icon={Shield} tone="amber" />
    </div>
  );
}

/* ─── Shared UI helpers ─────────────────────────────── */
function StateBox({ loading, error }: { loading: boolean; error: boolean }) {
  if (!loading && !error) return null;
  return (
    <div className={`app-alert m-4 ${error ? 'app-alert-error' : 'app-alert-muted'}`}>
      {error ? <AlertCircle size={18} /> : <Loader2 size={18} className="animate-spin text-cyan-300" />}
      {error ? 'Không thể tải dữ liệu admin.' : 'Đang tải...'}
    </div>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-200">
      <AlertCircle size={14} /> {message}
    </div>
  );
}

function Badge({ tone, children }: { tone: 'success' | 'warn' | 'danger' | 'muted'; children: ReactNode }) {
  const cls = {
    success: 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200',
    warn:    'border-amber-300/25 bg-amber-300/10 text-amber-200',
    danger:  'border-red-300/25 bg-red-300/10 text-red-200',
    muted:   'border-slate-500/25 bg-slate-500/10 text-slate-300',
  }[tone];
  return <span className={`app-badge ${cls}`}>{children}</span>;
}

function AdminInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-xs font-medium text-slate-400">
      {label}
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 admin-field" />
    </label>
  );
}

function AdminNumber({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block text-xs font-medium text-slate-400">
      {label}
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 admin-field" />
    </label>
  );
}

function AdminTextArea({ label, value, rows, onChange }: { label: string; value: string; rows: number; onChange: (v: string) => void }) {
  return (
    <label className="block text-xs font-medium text-slate-400">
      {label}
      <textarea value={value} rows={rows} onChange={(e) => onChange(e.target.value)} className="mt-1 admin-field resize-y font-mono text-xs" />
    </label>
  );
}

function formatTestCases(testCases: AdminProblemTestCase[]) {
  return JSON.stringify(testCases, null, 2);
}
