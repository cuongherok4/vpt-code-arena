import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { authApi } from '@/api/auth.api';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const token = searchParams.get('token') ?? '';

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    authApi.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-950 px-4 py-12">
      <section className="mx-auto max-w-md text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-violet-300" />
            <h1 className="mt-5 text-3xl font-bold text-white">Dang xac thuc email</h1>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-300" />
            <h1 className="mt-5 text-3xl font-bold text-white">Email da duoc xac thuc</h1>
            <p className="mt-2 text-sm text-slate-400">Tai khoan cua ban da san sang de dang nhap.</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="mx-auto h-10 w-10 text-red-300" />
            <h1 className="mt-5 text-3xl font-bold text-white">Khong the xac thuc email</h1>
            <p className="mt-2 text-sm text-slate-400">Token khong hop le hoac da het han.</p>
          </>
        )}

        {status !== 'loading' && (
          <Link
            className="mt-8 inline-flex rounded-md bg-violet-600 px-4 py-2 font-semibold text-white hover:bg-violet-500"
            to="/login"
          >
            Ve trang dang nhap
          </Link>
        )}
      </section>
    </main>
  );
}
