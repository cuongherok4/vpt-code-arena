import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

export function RouteErrorFallback() {
  const error = useRouteError();
  const title = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : 'Không thể hiển thị trang';
  const message = isRouteErrorResponse(error)
    ? error.data?.message ?? 'Trang bạn mở không khả dụng hoặc đã có lỗi xử lý.'
    : error instanceof Error
      ? error.message
      : 'Ứng dụng gặp lỗi ngoài dự kiến.';

  return (
    <main className="app-shell flex min-h-screen items-center justify-center px-4 py-10 text-[var(--color-app-text)]">
      <section role="alert" className="app-panel w-full max-w-xl p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-red-400/20 bg-red-400/10 text-red-300">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="app-kicker mb-1">Ứng dụng</p>
            <h1 className="text-xl font-bold text-[var(--color-app-text)]">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--color-app-text-muted)]">{message}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={() => window.location.reload()} className="app-button app-button-primary">
                <RefreshCw className="h-4 w-4" />
                Tải lại
              </button>
              <Link to="/" className="app-button app-button-secondary">
                <Home className="h-4 w-4" />
                Về trang chủ
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
