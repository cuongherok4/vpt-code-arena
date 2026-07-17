import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { authApi } from '@/api/auth.api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const token = searchParams.get('token') ?? '';

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await authApi.resetPassword({ token, password });
      setMessage('Mat khau da duoc cap nhat. Ban co the dang nhap lai.');
      setPassword('');
    } catch {
      setError('Token khong hop le hoac da het han.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-950 px-4 py-12">
      <section className="mx-auto max-w-md">
        <h1 className="text-3xl font-bold text-white">Dat lai mat khau</h1>
        <p className="mt-2 text-sm text-slate-400">Nhap mat khau moi cho tai khoan cua ban.</p>

        {!token && <p className="mt-6 rounded-md border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">Thieu token reset mat khau.</p>}

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-300">Mat khau moi</span>
            <div className="mt-2 flex items-center rounded-md border border-white/10 bg-white/5 focus-within:border-violet-400">
              <input
                className="min-w-0 flex-1 bg-transparent px-3 py-2 text-white outline-none"
                type={showPassword ? 'text' : 'password'}
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={!token}
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

          {message && <p className="text-sm text-emerald-300">{message}</p>}
          {error && <p className="text-sm text-red-300">{error}</p>}

          <button
            type="submit"
            disabled={loading || !token}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-violet-600 px-4 py-2 font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <KeyRound className="h-4 w-4" />
            {loading ? 'Dang cap nhat...' : 'Cap nhat mat khau'}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-400">
          Quay lai <Link className="text-violet-300 hover:text-violet-200" to="/login">dang nhap</Link>
        </p>
      </section>
    </main>
  );
}
