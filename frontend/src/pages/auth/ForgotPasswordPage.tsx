import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { authApi } from '@/api/auth.api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await authApi.forgotPassword(email);
      setMessage('Neu email ton tai, link reset mat khau da duoc gui.');
    } catch {
      setError('Khong the gui yeu cau reset mat khau. Vui long thu lai.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-950 px-4 py-12">
      <section className="mx-auto max-w-md">
        <h1 className="text-3xl font-bold text-white">Quen mat khau</h1>
        <p className="mt-2 text-sm text-slate-400">Nhap email tai khoan de nhan link dat lai mat khau.</p>

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

          {message && <p className="text-sm text-emerald-300">{message}</p>}
          {error && <p className="text-sm text-red-300">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-violet-600 px-4 py-2 font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Mail className="h-4 w-4" />
            {loading ? 'Dang gui...' : 'Gui link reset'}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-400">
          Nho mat khau roi? <Link className="text-violet-300 hover:text-violet-200" to="/login">Dang nhap</Link>
        </p>
      </section>
    </main>
  );
}
