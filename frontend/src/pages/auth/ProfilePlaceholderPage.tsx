import { LogOut, User } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export default function ProfilePlaceholderPage() {
  const { user, isAuthenticated, logout } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-950 px-4 py-10">
      <section className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-violet-600/20 text-violet-200">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{user.name}</h1>
            <p className="text-sm text-slate-400">{user.email}</p>
          </div>
        </div>

        <dl className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="border border-white/10 bg-white/[0.03] p-4">
            <dt className="text-sm text-slate-400">Role</dt>
            <dd className="mt-1 font-semibold text-white">{user.role}</dd>
          </div>
          <div className="border border-white/10 bg-white/[0.03] p-4">
            <dt className="text-sm text-slate-400">Email</dt>
            <dd className="mt-1 font-semibold text-white">{user.emailVerified ? 'Verified' : 'Not verified'}</dd>
          </div>
          <div className="border border-white/10 bg-white/[0.03] p-4">
            <dt className="text-sm text-slate-400">User ID</dt>
            <dd className="mt-1 truncate font-mono text-xs text-white">{user.id}</dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={() => void logout()}
          className="mt-8 inline-flex items-center gap-2 rounded-md border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5"
        >
          <LogOut className="h-4 w-4" />
          Dang xuat
        </button>
      </section>
    </main>
  );
}
