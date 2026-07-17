import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading, error, clearError, isAuthenticated } = useAuthStore();
  const [name, setName] = useState('');
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
    const ok = await register({ name, email, password });
    if (ok) navigate('/profile', { replace: true });
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-950 px-4 py-12">
      <section className="mx-auto max-w-md">
        <h1 className="text-3xl font-bold text-white">Tao tai khoan</h1>
        <p className="mt-2 text-sm text-slate-400">Bat dau luu tien do hoc, submit exam va tham gia phong battle.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-300">Ten hien thi</span>
            <input
              className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-violet-400"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
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
                minLength={8}
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

          {error && <p className="text-sm text-red-300">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-violet-600 px-4 py-2 font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UserPlus className="h-4 w-4" />
            {loading ? 'Dang xu ly...' : 'Dang ky'}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-400">
          Da co tai khoan? <Link className="text-violet-300 hover:text-violet-200" to="/login">Dang nhap</Link>
        </p>
      </section>
    </main>
  );
}
