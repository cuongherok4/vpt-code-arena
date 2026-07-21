import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { CheckCircle2, Edit3, Loader2, LogOut, MessageSquare, Save, Shield, Target, Trophy, User, UsersRound, XCircle } from 'lucide-react';
import { userApi, type UserProfile, type UserSubmissionHistory } from '@/api/user.api';
import { ActivityCalendar } from '@/components/leaderboard/ActivityCalendar';
import { StatsCard } from '@/components/leaderboard/StatsCard';
import { useAuthStore } from '@/stores/authStore';

const resultClass: Record<UserSubmissionHistory['result'], string> = {
  AC: 'bg-emerald-400/10 text-emerald-300',
  WA: 'bg-red-400/10 text-red-300',
  TLE: 'bg-amber-400/10 text-amber-300',
  RE: 'bg-orange-400/10 text-orange-300',
  CE: 'bg-sky-400/10 text-sky-300',
  PENDING: 'bg-slate-400/10 text-slate-300',
};

export default function ProfilePage() {
  const { isAuthenticated, logout, updateUser } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<UserSubmissionHistory[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    let mounted = true;
    Promise.all([userApi.me(), userApi.history()])
      .then(([nextProfile, nextHistory]) => {
        if (!mounted) return;
        setProfile(nextProfile);
        setName(nextProfile.name);
        setHistory(nextHistory);
        updateUser(userApi.toAuthUser(nextProfile));
      })
      .catch(() => {
        if (mounted) setError('Khong the tai thong tin profile.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, updateUser]);

  const stats = useMemo(() => {
    const accepted = history.filter((item) => item.result === 'AC').length;
    const points = history.reduce((sum, item) => sum + item.points, 0);
    return { total: history.length, accepted, points };
  }, [history]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const updated = await userApi.updateMe({ name });
      setProfile(updated);
      updateUser(userApi.toAuthUser(updated));
      setMessage('Profile da duoc cap nhat.');
    } catch {
      setError('Khong the cap nhat profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-950 px-4 py-8">
      <section className="mx-auto max-w-5xl">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : profile ? (
          <>
            <div className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-md bg-violet-600/20 text-violet-200">
                  <User className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
                  <p className="text-sm text-slate-400">{profile.email}</p>
                  <p className="mt-1 inline-flex rounded-md border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-xs font-semibold text-cyan-200">
                    ID {profile.publicId ?? '----------'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void logout()}
                className="inline-flex w-fit items-center gap-2 rounded-md border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5"
              >
                <LogOut className="h-4 w-4" />
                Dang xuat
              </button>
            </div>

            <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <StatsCard label="ID" value={profile.publicId ?? '----------'} />
              <StatsCard label="Role" value={profile.role} icon={<Shield className="h-4 w-4" />} />
              <StatsCard label="Submissions" value={stats.total.toString()} icon={<Target className="h-4 w-4" />} />
              <StatsCard label="Accepted" value={stats.accepted.toString()} icon={<CheckCircle2 className="h-4 w-4" />} />
              <StatsCard label="Points" value={stats.points.toString()} icon={<Trophy className="h-4 w-4" />} />
            </dl>

            <div className="mt-6">
              <ActivityCalendar history={history} />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
              <div className="space-y-6">
              <section className="border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center gap-2 text-white">
                  <Edit3 className="h-4 w-4" />
                  <h2 className="font-semibold">Thong tin ca nhan</h2>
                </div>

                <form onSubmit={onSubmit} className="mt-5 space-y-4">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-300">Ten hien thi</span>
                    <input
                      className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none focus:border-violet-400"
                      value={name}
                      maxLength={100}
                      onChange={(event) => setName(event.target.value)}
                      required
                    />
                  </label>

                  <div className="space-y-2 text-sm text-slate-400">
                    <p className="flex items-center gap-2">
                      {profile.emailVerified ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <XCircle className="h-4 w-4 text-red-300" />}
                      {profile.emailVerified ? 'Email da xac thuc' : 'Email chua xac thuc'}
                    </p>
                    <p>Dang nhap: {profile.oauthProvider ?? 'email/password'}</p>
                  </div>

                  {message && <p className="text-sm text-emerald-300">{message}</p>}
                  {error && <p className="text-sm text-red-300">{error}</p>}

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-violet-600 px-4 py-2 font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Dang luu...' : 'Luu thay doi'}
                  </button>
                </form>
              </section>

              <section className="border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center gap-2 text-white">
                  <UsersRound className="h-4 w-4" />
                  <h2 className="font-semibold">Bạn bè</h2>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Quản lý danh sách bạn bè, lời mời kết bạn và mở nhắn tin trực tiếp.
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  <Link to="/friends" className="app-button app-button-secondary justify-start">
                    <UsersRound className="h-4 w-4" />
                    Danh sách bạn bè
                  </Link>
                  <Link to="/chat?tab=dm" className="app-button app-button-secondary justify-start">
                    <MessageSquare className="h-4 w-4" />
                    Mở DM đầy đủ
                  </Link>
                </div>
              </section>
              </div>

              <section className="border border-white/10 bg-white/[0.03] p-5">
                <h2 className="font-semibold text-white">Lich su submit</h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="text-xs uppercase text-slate-500">
                      <tr>
                        <th className="py-2 pr-4">Loai</th>
                        <th className="py-2 pr-4">Bai</th>
                        <th className="py-2 pr-4">Ngon ngu</th>
                        <th className="py-2 pr-4">Ket qua</th>
                        <th className="py-2 pr-4">Diem</th>
                        <th className="py-2">Thoi gian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-slate-300">
                      {history.map((item) => (
                        <tr key={`${item.type}-${item.id}`}>
                          <td className="py-3 pr-4 text-slate-400">{item.type}</td>
                          <td className="py-3 pr-4">
                            <div className="font-medium text-white">{item.problemTitle}</div>
                            {item.roomName && <div className="text-xs text-slate-500">{item.roomName}</div>}
                          </td>
                          <td className="py-3 pr-4">{item.language}</td>
                          <td className="py-3 pr-4">
                            <span className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${resultClass[item.result]}`}>
                              {item.result}
                            </span>
                          </td>
                          <td className="py-3 pr-4">{item.points}</td>
                          <td className="py-3 text-slate-400">{formatDate(item.submittedAt)}</td>
                        </tr>
                      ))}
                      {history.length === 0 && (
                        <tr>
                          <td className="py-8 text-center text-slate-500" colSpan={6}>Chua co submission nao.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </>
        ) : (
          <p className="py-16 text-center text-red-300">{error || 'Khong the tai profile.'}</p>
        )}
      </section>
    </main>
  );
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}
