import { Link } from 'react-router-dom';
import { Home, SearchX } from 'lucide-react';

export function NotFoundPage() {
  return (
    <main className="app-shell flex min-h-screen items-center justify-center px-4 py-10 text-[var(--color-app-text)]">
      <section className="app-panel w-full max-w-lg p-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
          <SearchX className="h-7 w-7" />
        </div>
        <p className="app-kicker justify-center">404</p>
        <h1 className="text-xl font-bold text-[var(--color-app-text)]">Không tìm thấy trang</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--color-app-text-muted)]">
          Đường dẫn này không tồn tại hoặc đã được di chuyển.
        </p>
        <Link to="/" className="app-button app-button-primary mt-5">
          <Home className="h-4 w-4" />
          Về trang chủ
        </Link>
      </section>
    </main>
  );
}
