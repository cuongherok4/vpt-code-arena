import { useMemo, useState, type ElementType, type FormEvent, type ReactNode } from 'react';
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
  ArrowLeft,
  TrendingUp,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { adminApi, type AdminProblem, type AdminProblemPayload, type AdminProblemTestCase } from '@/api/admin.api';
import type { Difficulty } from '@/api/exam.api';
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
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<AdminTab>('overview');

  /* ── Access guard ── */
  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-red-100 bg-white p-10 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
          <Lock size={28} />
        </div>
        <h1 className="mb-2 text-xl font-bold text-slate-800">Cần quyền Admin</h1>
        <p className="mb-6 text-sm text-slate-500">Khu vực này chỉ dành cho tài khoản có role ADMIN.</p>
        <Link
          to={isAuthenticated ? '/' : '/login'}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0066b2] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1a8fd1] transition-colors"
        >
          {isAuthenticated ? 'Về trang chủ' : 'Đăng nhập'}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] gap-0">
      {/* ════════════════════════════════════
          SIDEBAR — cột dọc bên trái
      ════════════════════════════════════ */}
      <aside className="fixed inset-y-[64px] left-0 z-30 hidden w-64 flex-col border-r border-black/[0.07] bg-white shadow-sm lg:flex">
        {/* Header */}
        <div className="border-b border-black/[0.07] px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0066b2]/10 text-[#0066b2]">
              <Shield size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Admin Panel</p>
              <p className="text-[11px] text-slate-400">{user.name}</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 ${
                  active
                    ? 'bg-[#0066b2]/[0.08] text-[#0066b2]'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Icon size={18} className="shrink-0" />
                <div>
                  <div className="text-sm font-semibold">{item.label}</div>
                  <div className="text-[10px] leading-none text-slate-400">{item.desc}</div>
                </div>
                {active && (
                  <div className="ml-auto h-5 w-1 rounded-full bg-[#0066b2]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-black/[0.07] px-3 py-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={16} />
            Về trang chủ
          </button>
        </div>
      </aside>

      {/* ════════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════════ */}
      <main className="flex-1 lg:ml-64">
        {/* Mobile tab bar */}
        <div className="flex gap-1 overflow-x-auto border-b border-black/[0.07] bg-white px-4 py-2 lg:hidden">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  tab === item.id
                    ? 'bg-[#0066b2]/[0.08] text-[#0066b2]'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Icon size={14} />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Content area */}
        <div className="p-6">
          {/* Page title */}
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

          {tab === 'overview'  && <OverviewTab />}
          {tab === 'users'     && <UsersTab />}
          {tab === 'problems'  && <ProblemsTab />}
          {tab === 'stats'     && <StatsTab />}
        </div>
      </main>
    </div>
  );
}

/* ─── Overview Tab ──────────────────────────────────── */
function OverviewTab() {
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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <QuickStatCard label="Tổng người dùng" value={stats.totalUsers} icon={Users} color="#0066b2" />
            <QuickStatCard label="Hoạt động hôm nay" value={stats.activeUsersToday} icon={TrendingUp} color="#2e9e48" />
            <QuickStatCard label="Tổng bài tập" value={stats.totalProblems} icon={FileText} color="#e87722" />
            <QuickStatCard label="Đã publish" value={stats.publishedProblems} icon={CheckCircle2} color="#2e9e48" />
            <QuickStatCard label="Tổng submissions" value={stats.totalSubmissions} icon={BarChart3} color="#0066b2" />
            <QuickStatCard label="Phòng battle" value={stats.totalBattleRooms} icon={Shield} color="#e87722" />
          </div>
        </>
      )}
    </div>
  );
}

function QuickStatCard({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: ElementType; color: string;
}) {
  return (
    <div className="app-card p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${color}15` }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <div className="mt-3 text-3xl font-black" style={{ color }}>{value.toLocaleString('vi-VN')}</div>
    </div>
  );
}

/* ─── Users Tab ─────────────────────────────────────── */
function UsersTab() {
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
      <div className="border-b border-black/[0.06] p-4">
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
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {usersQuery.data.items.map((item) => (
                <tr key={item.id}>
                  <td className="font-semibold text-slate-800">{item.name}</td>
                  <td className="text-slate-400">{item.publicId}</td>
                  <td>
                    <Badge tone={item.role === 'ADMIN' ? 'warn' : 'muted'}>{item.role}</Badge>
                  </td>
                  <td>{item.email}</td>
                  <td>{item.banned ? <Badge tone="danger">Banned</Badge> : <Badge tone="success">Active</Badge>}</td>
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
        <div className="border-b border-black/[0.06] p-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tiêu đề hoặc chủ đề..."
            className="app-field"
          />
        </div>
        <StateBox loading={problemsQuery.isLoading} error={problemsQuery.isError} />
        {problemsQuery.data && (
          <div className="divide-y divide-black/[0.05]">
            {problemsQuery.data.items.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-slate-50/60 transition-colors">
                <div>
                  <div className="font-semibold text-slate-800">{item.title}</div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
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
                    className="icon-action text-red-400 hover:border-red-300 hover:bg-red-50"
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
          <h2 className="font-bold text-slate-800">{editing ? 'Sửa bài tập' : 'Tạo bài tập mới'}</h2>
          <p className="mt-0.5 text-xs text-slate-400">Test cases nhập dạng JSON array.</p>
        </div>
        <form onSubmit={submit} className="space-y-3 p-4">
          {formError && <InlineError message={formError} />}
          <AdminInput label="Tiêu đề" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <AdminInput label="Chủ đề" value={form.topic} onChange={(v) => setForm({ ...form, topic: v })} />
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-slate-500">
              Độ khó
              <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value as Difficulty })} className="mt-1 admin-field">
                <option value="EASY">EASY</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HARD">HARD</option>
              </select>
            </label>
            <label className="flex items-end gap-2 text-xs font-medium text-slate-500">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="mb-2 h-4 w-4 accent-[#0066b2]" />
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
      <QuickStatCard label="Tổng người dùng" value={s.totalUsers} icon={Users} color="#0066b2" />
      <QuickStatCard label="Hoạt động hôm nay" value={s.activeUsersToday} icon={TrendingUp} color="#2e9e48" />
      <QuickStatCard label="Tổng bài tập" value={s.totalProblems} icon={FileText} color="#e87722" />
      <QuickStatCard label="Đã publish" value={s.publishedProblems} icon={CheckCircle2} color="#2e9e48" />
      <QuickStatCard label="Tổng submissions" value={s.totalSubmissions} icon={BarChart3} color="#0066b2" />
      <QuickStatCard label="Phòng battle" value={s.totalBattleRooms} icon={Shield} color="#e87722" />
    </div>
  );
}

/* ─── Shared UI helpers ─────────────────────────────── */
function StateBox({ loading, error }: { loading: boolean; error: boolean }) {
  if (!loading && !error) return null;
  return (
    <div className={`app-alert m-4 ${error ? 'app-alert-error' : 'app-alert-muted'}`}>
      {error ? <AlertCircle size={18} /> : <Loader2 size={18} className="animate-spin text-[#0066b2]" />}
      {error ? 'Không thể tải dữ liệu admin.' : 'Đang tải...'}
    </div>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
      <AlertCircle size={14} /> {message}
    </div>
  );
}

function Badge({ tone, children }: { tone: 'success' | 'warn' | 'danger' | 'muted'; children: ReactNode }) {
  const cls = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warn:    'border-amber-200 bg-amber-50 text-amber-700',
    danger:  'border-red-200 bg-red-50 text-red-700',
    muted:   'border-slate-200 bg-slate-50 text-slate-600',
  }[tone];
  return <span className={`app-badge ${cls}`}>{children}</span>;
}

function AdminInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-xs font-medium text-slate-500">
      {label}
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 admin-field" />
    </label>
  );
}

function AdminNumber({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block text-xs font-medium text-slate-500">
      {label}
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 admin-field" />
    </label>
  );
}

function AdminTextArea({ label, value, rows, onChange }: { label: string; value: string; rows: number; onChange: (v: string) => void }) {
  return (
    <label className="block text-xs font-medium text-slate-500">
      {label}
      <textarea value={value} rows={rows} onChange={(e) => onChange(e.target.value)} className="mt-1 admin-field resize-y font-mono text-xs" />
    </label>
  );
}

function formatTestCases(testCases: AdminProblemTestCase[]) {
  return JSON.stringify(testCases, null, 2);
}
