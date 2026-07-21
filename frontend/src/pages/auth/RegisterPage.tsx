import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, Code2, Zap, Trophy, BookOpen, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const perks = [
  { icon: BookOpen, text: 'Lộ trình học Java, C, Python chuyên sâu' },
  { icon: Zap, text: 'Hàng trăm bài thi luyện kỹ năng thuật toán' },
  { icon: Trophy, text: 'Battle 1v1 thời gian thực với bảng xếp hạng Elo' },
];

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (password.length === 0) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Yếu', color: 'bg-red-500' };
  if (score <= 2) return { score, label: 'Trung bình', color: 'bg-amber-500' };
  if (score <= 3) return { score, label: 'Khá tốt', color: 'bg-yellow-400' };
  return { score, label: 'Mạnh', color: 'bg-teal-400' };
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading, error, clearError, isAuthenticated } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const strength = getPasswordStrength(password);

  useEffect(() => { clearError(); }, [clearError]);
  useEffect(() => {
    if (isAuthenticated) navigate('/profile', { replace: true });
  }, [isAuthenticated, navigate]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const ok = await register({ name, email, password });
    if (ok) navigate('/profile', { replace: true });
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-stretch">
      {/* ── Left Panel — Branding ── */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-10 lg:flex lg:w-[45%]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-0 h-[400px] w-[400px] -translate-x-1/3 -translate-y-1/3 rounded-full bg-indigo-500/10 blur-[100px]" />
          <div className="absolute bottom-0 right-0 h-[300px] w-[300px] translate-x-1/3 translate-y-1/3 rounded-full bg-teal-500/10 blur-[80px]" />
        </div>
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-30" />

        <Link to="/" className="relative flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal-400/25 bg-teal-400/10 text-teal-300">
            <Code2 className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold">
            <span className="gradient-text">VPT</span>
            <span className="text-white"> Arena</span>
          </span>
        </Link>

        <div className="relative">
          <h2 className="mb-2 text-3xl font-black text-white leading-tight">
            Bắt đầu hành trình<br />của bạn hôm nay!
          </h2>
          <p className="mb-8 text-slate-400">
            Tạo tài khoản miễn phí và khám phá toàn bộ tính năng.
          </p>
          <ul className="space-y-4">
            {perks.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-400/10 text-indigo-400">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-600">© 2026 VPT Code Arena. All rights reserved.</p>
      </div>

      {/* ── Right Panel — Form ── */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-teal-400/25 bg-teal-400/10 text-teal-300">
              <Code2 className="h-4 w-4" />
            </span>
            <span className="font-bold"><span className="gradient-text">VPT</span><span className="text-white"> Arena</span></span>
          </Link>

          <h1 className="mb-1 text-2xl font-black text-white">Tạo tài khoản</h1>
          <p className="mb-8 text-sm text-slate-400">
            Bắt đầu lưu tiến độ học, submit exam và tham gia phòng battle.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Tên hiển thị</label>
              <input
                id="register-name"
                className="app-field"
                placeholder="Nguyễn Văn A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
              <input
                id="register-email"
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
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Mật khẩu</label>
              <div className="flex items-center rounded-[10px] border border-white/[0.09] bg-[rgba(2,6,23,0.7)] transition-all duration-200 focus-within:border-teal-400/40 focus-within:shadow-[0_0_0_3px_rgba(45,212,191,0.1)]">
                <input
                  id="register-password"
                  className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tối thiểu 8 ký tự"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  onClick={() => setShowPassword((v) => !v)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center text-slate-500 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password Strength */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          strength.score >= i ? strength.color : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    Độ mạnh: <span className="font-medium text-slate-300">{strength.label}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                {error}
              </div>
            )}

            {/* Terms */}
            <p className="text-xs text-slate-600 leading-relaxed">
              Bằng cách đăng ký, bạn đồng ý với{' '}
              <span className="text-teal-500">Điều khoản dịch vụ</span> và{' '}
              <span className="text-teal-500">Chính sách bảo mật</span> của chúng tôi.
            </p>

            {/* Submit */}
            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-900/25 transition-all duration-200 hover:shadow-indigo-500/30 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UserPlus className="h-4 w-4" />
              {loading ? 'Đang xử lý...' : 'Đăng ký miễn phí'}
            </button>
          </form>

          {/* Benefits pills */}
          <div className="mt-5 flex flex-wrap gap-2">
            {['Miễn phí 100%', 'Không cần thẻ tín dụng', 'Bắt đầu ngay'].map((b) => (
              <span key={b} className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-500">
                <CheckCircle className="h-2.5 w-2.5 text-teal-500" />
                {b}
              </span>
            ))}
          </div>

          <p className="mt-6 text-sm text-slate-500">
            Đã có tài khoản?{' '}
            <Link className="font-semibold text-teal-400 hover:text-teal-300 transition-colors inline-flex items-center gap-1" to="/login">
              Đăng nhập <ArrowRight className="h-3 w-3" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
