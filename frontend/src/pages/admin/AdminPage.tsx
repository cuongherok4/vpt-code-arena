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
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminApi, type AdminProblem, type AdminProblemPayload, type AdminProblemTestCase } from '@/api/admin.api';
import type { Difficulty } from '@/api/exam.api';
import { useAuthStore } from '@/stores/authStore';

type AdminTab = 'users' | 'problems' | 'stats';

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
  const [tab, setTab] = useState<AdminTab>('users');

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="mx-auto max-w-xl rounded-lg border border-white/10 bg-slate-950/70 p-6 text-center">
        <Lock size={32} className="mx-auto mb-3 text-cyan-300" />
        <h1 className="text-xl font-semibold text-white">Cần quyền admin</h1>
        <p className="mt-2 text-sm text-slate-400">Khu vực này chỉ dành cho tài khoản có role ADMIN.</p>
        <Link to={isAuthenticated ? '/' : '/login'} className="mt-5 inline-flex rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400">
          {isAuthenticated ? 'Về trang chủ' : 'Đăng nhập'}
        </Link>
      </div>
    );
  }

  return (
    <div className="app-page">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="app-kicker">
            <Shield size={20} />
            <span className="text-sm font-medium">Admin</span>
          </div>
          <h1 className="app-page-heading">Quản trị hệ thống</h1>
          <p className="app-page-subtitle">Quản user, ngân hàng đề và thống kê tổng quan.</p>
        </div>

        <div className="flex rounded-lg border border-white/10 bg-white/[0.03] p-1">
          <TabButton active={tab === 'users'} onClick={() => setTab('users')} icon={Users} label="Users" />
          <TabButton active={tab === 'problems'} onClick={() => setTab('problems')} icon={Pencil} label="Problems" />
          <TabButton active={tab === 'stats'} onClick={() => setTab('stats')} icon={BarChart3} label="Stats" />
        </div>
      </div>

      {tab === 'users' && <UsersTab />}
      {tab === 'problems' && <ProblemsTab />}
      {tab === 'stats' && <StatsTab />}
    </div>
  );
}

function UsersTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const usersQuery = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => adminApi.users({ search: search || undefined, size: 50 }),
  });

  const banMutation = useMutation({
    mutationFn: ({ userId, banned }: { userId: string; banned: boolean }) => adminApi.setUserBan(userId, banned),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  return (
    <section className="app-panel">
      <PanelHeader title="Users" description="Tìm kiếm và ban/unban tài khoản." />
      <div className="border-b border-white/10 p-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm theo email, tên hoặc ID..."
          className="app-field"
        />
      </div>
      <StateBox loading={usersQuery.isLoading} error={usersQuery.isError} />
      {usersQuery.data && (
        <div className="overflow-x-auto">
          <table className="app-table min-w-[860px]">
            <thead>
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {usersQuery.data.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-semibold text-white">{item.name}</td>
                  <td className="px-4 py-3 text-slate-400">{item.publicId}</td>
                  <td className="px-4 py-3">{item.role}</td>
                  <td className="px-4 py-3">{item.email}</td>
                  <td className="px-4 py-3">{item.banned ? <Badge tone="danger">Banned</Badge> : <Badge tone="success">Active</Badge>}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => banMutation.mutate({ userId: item.id, banned: !item.banned })}
                      disabled={banMutation.isPending}
                      className="app-button app-button-secondary px-3 py-1.5 text-xs"
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
    mutationFn: (payload: AdminProblemPayload) => editing
      ? adminApi.updateProblem(editing.id, payload)
      : adminApi.createProblem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-problems'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (problemId: string) => adminApi.deleteProblem(problemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-problems'] }),
  });

  const parsedTestCases = useMemo(() => {
    try {
      const value = JSON.parse(testCasesText) as AdminProblemTestCase[];
      return Array.isArray(value) ? value : null;
    } catch {
      return null;
    }
  }, [testCasesText]);

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
    setTestCasesText(formatTestCases(emptyForm.testCases));
    setFormError('');
  };

  const startEdit = (problem: AdminProblem) => {
    setEditing(problem);
    setForm({
      title: problem.title,
      description: problem.description,
      difficulty: problem.difficulty,
      topic: problem.topic,
      timeLimitMs: problem.timeLimitMs,
      memoryLimitKb: problem.memoryLimitKb,
      testCases: problem.testCases,
      solutionCode: problem.solutionCode ?? '',
      published: problem.published,
    });
    setTestCasesText(formatTestCases(problem.testCases));
    setFormError('');
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!parsedTestCases || parsedTestCases.length === 0) {
      setFormError('Test cases phải là JSON array hợp lệ và có ít nhất 1 case.');
      return;
    }
    setFormError('');
    saveMutation.mutate({ ...form, testCases: parsedTestCases });
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="app-panel">
        <PanelHeader title="Problems" description="Tìm kiếm, publish/unpublish và xóa đề." />
        <div className="border-b border-white/10 p-4">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tiêu đề hoặc chủ đề..."
            className="app-field"
          />
        </div>
        <StateBox loading={problemsQuery.isLoading} error={problemsQuery.isError} />
        {problemsQuery.data && (
          <div className="divide-y divide-white/10">
            {problemsQuery.data.items.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-white/[0.025]">
                <div>
                  <div className="font-semibold text-white">{item.title}</div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
                    <span>{item.topic}</span>
                    <span>{item.difficulty}</span>
                    <span>{item.timeLimitMs}ms</span>
                    <span>{item.memoryLimitKb}KB</span>
                    {item.published ? <Badge tone="success">Published</Badge> : <Badge tone="warn">Draft</Badge>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => startEdit(item)} className="icon-action" title="Sửa"><Pencil size={15} /></button>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(item.id)}
                    disabled={deleteMutation.isPending}
                    className="icon-action text-red-300 hover:border-red-400/30 hover:bg-red-500/10"
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

      <section className="app-panel">
        <PanelHeader title={editing ? 'Sửa đề' : 'Tạo đề'} description="Test cases nhập dạng JSON array." />
        <form onSubmit={submit} className="space-y-3 p-4">
          {formError && <InlineError message={formError} />}
          <AdminInput label="Tiêu đề" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
          <AdminInput label="Chủ đề" value={form.topic} onChange={(value) => setForm({ ...form, topic: value })} />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-medium text-slate-400">
              Độ khó
              <select value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value as Difficulty })} className="mt-1 admin-field">
                <option value="EASY">EASY</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HARD">HARD</option>
              </select>
            </label>
            <label className="flex items-end gap-2 text-xs font-medium text-slate-400">
              <input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} className="mb-2 h-4 w-4 accent-cyan-400" />
              Published
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AdminNumber label="Time ms" value={form.timeLimitMs} onChange={(value) => setForm({ ...form, timeLimitMs: value })} />
            <AdminNumber label="Memory KB" value={form.memoryLimitKb} onChange={(value) => setForm({ ...form, memoryLimitKb: value })} />
          </div>
          <AdminTextArea label="Mô tả" rows={5} value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
          <AdminTextArea label="Test cases JSON" rows={7} value={testCasesText} onChange={setTestCasesText} />
          <AdminTextArea label="Solution code" rows={4} value={form.solutionCode ?? ''} onChange={(value) => setForm({ ...form, solutionCode: value })} />
          <div className="flex gap-2">
            <button type="submit" disabled={saveMutation.isPending} className="app-button app-button-primary flex-1">
              {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {editing ? 'Lưu thay đổi' : 'Tạo đề'}
            </button>
            {editing && (
              <button type="button" onClick={resetForm} className="app-button app-button-secondary">
                Hủy
              </button>
            )}
          </div>
          {saveMutation.isError && <InlineError message="Không thể lưu problem. Kiểm tra dữ liệu hoặc quyền admin." />}
        </form>
      </section>
    </div>
  );
}

function StatsTab() {
  const statsQuery = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.stats,
    refetchInterval: 30_000,
  });

  if (statsQuery.isLoading || statsQuery.isError || !statsQuery.data) {
    return <StateBox loading={statsQuery.isLoading} error={statsQuery.isError} />;
  }

  const stats = statsQuery.data;
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <StatCard label="Total users" value={stats.totalUsers} />
      <StatCard label="Active today" value={stats.activeUsersToday} />
      <StatCard label="Total problems" value={stats.totalProblems} />
      <StatCard label="Published problems" value={stats.publishedProblems} />
      <StatCard label="Total submissions" value={stats.totalSubmissions} />
      <StatCard label="Battle rooms" value={stats.totalBattleRooms} />
    </section>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: ElementType; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
        active ? 'bg-cyan-400 text-slate-950' : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function PanelHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="app-panel-header">
      <h2 className="font-semibold text-white">{title}</h2>
      <p className="mt-1 text-xs text-slate-400">{description}</p>
    </div>
  );
}

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
    <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
      <AlertCircle size={15} />
      {message}
    </div>
  );
}

function Badge({ tone, children }: { tone: 'success' | 'warn' | 'danger'; children: ReactNode }) {
  const className = tone === 'success'
    ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
    : tone === 'warn'
      ? 'border-amber-400/30 bg-amber-400/10 text-amber-200'
      : 'border-red-400/30 bg-red-400/10 text-red-200';
  return <span className={`app-badge ${className}`}>{children}</span>;
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="app-card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-400">{label}</p>
        <CheckCircle2 size={18} className="text-cyan-300" />
      </div>
      <div className="mt-4 text-3xl font-bold text-white">{value.toLocaleString('vi-VN')}</div>
    </div>
  );
}

function AdminInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-xs font-medium text-slate-400">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 admin-field" />
    </label>
  );
}

function AdminNumber({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block text-xs font-medium text-slate-400">
      {label}
      <input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-1 admin-field" />
    </label>
  );
}

function AdminTextArea({ label, value, rows, onChange }: { label: string; value: string; rows: number; onChange: (value: string) => void }) {
  return (
    <label className="block text-xs font-medium text-slate-400">
      {label}
      <textarea value={value} rows={rows} onChange={(event) => onChange(event.target.value)} className="mt-1 admin-field resize-y font-mono text-xs" />
    </label>
  );
}

function formatTestCases(testCases: AdminProblemTestCase[]) {
  return JSON.stringify(testCases, null, 2);
}
