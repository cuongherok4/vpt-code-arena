import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/stores/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, loading, error, clearError, isAuthenticated } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (isAuthenticated) navigate('/profile', { replace: true });
  }, [isAuthenticated, navigate]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const ok = await login({ email, password });
    if (ok) navigate('/profile', { replace: true });
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-950 px-4 py-12">
      <section className="mx-auto max-w-md">
        <h1 className="text-3xl font-bold text-white">Dang nhap</h1>
        <p className="mt-2 text-sm text-slate-400">Dung tai khoan VPT Arena de submit bai va tham gia battle.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-300">Email</span>
            <input
              className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-violet-400"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-300">Mat khau</span>
            <div className="mt-2 flex items-center rounded-md border border-white/10 bg-white/5 focus-within:border-violet-400">
              <input
                className="min-w-0 flex-1 bg-transparent px-3 py-2 text-white outline-none"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                aria-label={showPassword ? 'An mat khau' : 'Hien mat khau'}
                onClick={() => setShowPassword((value) => !value)}
                className="flex h-10 w-10 shrink-0 items-center justify-center text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>
          <div className="flex justify-end">
            <Link className="text-sm text-violet-300 hover:text-violet-200" to="/forgot-password">
              Quen mat khau?
            </Link>
          </div>

          {(error || searchParams.get('oauthError')) && (
            <p className="text-sm text-red-300">{error || searchParams.get('oauthError')}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-violet-600 px-4 py-2 font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" />
            {loading ? 'Dang xu ly...' : 'Dang nhap'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs uppercase text-slate-500">
          <span className="h-px flex-1 bg-white/10" />
          <span>OAuth</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href={authApi.oauthUrl('google')}
            className="inline-flex items-center justify-center rounded-md border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5"
          >
            Google
          </a>
          <a
            href={authApi.oauthUrl('github')}
            className="inline-flex items-center justify-center rounded-md border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5"
          >
            GitHub
          </a>
        </div>

        <p className="mt-6 text-sm text-slate-400">
          Chua co tai khoan? <Link className="text-violet-300 hover:text-violet-200" to="/register">Dang ky</Link>
        </p>
      </section>
    </main>
  );
}
