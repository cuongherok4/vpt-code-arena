import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Zap, Trophy, BookOpen, ArrowRight } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/stores/authStore';

const perks = [
  { icon: BookOpen, text: 'Lộ trình học Java, C, Python chuyên sâu' },
  { icon: Zap, text: 'Hàng trăm bài thi luyện kỹ năng thuật toán' },
  { icon: Trophy, text: 'Battle 1v1 thời gian thực với bảng xếp hạng Elo' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, loading, error, clearError, isAuthenticated } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => { clearError(); }, [clearError]);
  useEffect(() => {
    if (isAuthenticated) navigate('/profile', { replace: true });
  }, [isAuthenticated, navigate]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const ok = await login({ email, password });
    if (ok) navigate('/profile', { replace: true });
  };

  const errorMsg = error || searchParams.get('oauthError');

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-stretch">
      {/* ── Left Panel — Branding ── */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-white/10 bg-slate-950/70 p-10 lg:flex lg:w-[45%]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-0 h-[400px] w-[400px] -translate-x-1/3 -translate-y-1/3 rounded-full bg-cyan-300/10 blur-[100px]" />
          <div className="absolute bottom-0 right-0 h-[300px] w-[300px] translate-x-1/3 translate-y-1/3 rounded-full bg-amber-300/10 blur-[80px]" />
        </div>
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-40" />

        {/* Logo */}
        <Link to="/" className="relative flex items-center gap-2.5">
          <img src="/logocty.png" alt="VPT" className="h-10 w-auto object-contain" />
          <span className="text-base font-bold text-white">
            Code <span className="text-cyan-300">Arena</span>
          </span>
        </Link>

        {/* Mid content */}
        <div className="relative">
          <h2 className="mb-2 text-3xl font-black leading-tight text-white">
            Chào mừng trở lại!
          </h2>
          <p className="mb-8 text-slate-400">
            Đăng nhập để tiếp tục hành trình lập trình của bạn.
          </p>
          <ul className="space-y-4">
            {perks.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="relative text-xs text-slate-500">© 2026 VPT Code Arena. All rights reserved.</p>
      </div>

      {/* ── Right Panel — Form ── */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <img src="/logocty.png" alt="VPT" className="h-8 w-auto object-contain" />
            <span className="text-sm font-bold text-white">Code <span className="text-cyan-300">Arena</span></span>
          </Link>

          <h1 className="mb-1 text-2xl font-black text-white">Đăng nhập</h1>
          <p className="mb-8 text-sm text-slate-400">
            Dùng tài khoản VPT Arena để lưu tiến độ và tham gia battle.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
              <input
                id="login-email"
                className="app-field"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-slate-300">Mật khẩu</label>
                <Link className="text-xs font-medium text-cyan-300 transition-colors hover:text-cyan-100" to="/forgot-password">
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="flex items-center rounded-lg border border-white/10 bg-slate-950/75 shadow-sm transition-all duration-200 focus-within:border-cyan-300/45 focus-within:shadow-[0_0_0_3px_rgba(45,212,191,0.12)]">
                <input
                  id="login-password"
                  className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  onClick={() => setShowPassword((v) => !v)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center text-slate-500 transition-colors hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                {errorMsg}
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="app-button app-button-primary mt-2 w-full py-3"
            >
              <LogIn className="h-4 w-4" />
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-xs font-medium text-slate-400">Hoặc tiếp tục với</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          {/* OAuth */}
          <div className="grid gap-3 sm:grid-cols-2">
            <a
              href={authApi.oauthUrl('google')}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-200 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.06]"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </a>
            <a
              href={authApi.oauthUrl('github')}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-200 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.06]"
            >
              <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              GitHub
            </a>
          </div>

          <p className="mt-6 text-sm text-slate-400">
            Chưa có tài khoản?{' '}
            <Link className="inline-flex items-center gap-1 font-semibold text-cyan-300 transition-colors hover:text-cyan-100" to="/register">
              Đăng ký ngay <ArrowRight className="h-3 w-3" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
