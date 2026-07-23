import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div role="alert" aria-live="assertive" className="app-panel mx-auto my-12 max-w-xl p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-red-400/20 bg-red-400/10 text-red-300">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-[var(--color-app-text)]">Đã xảy ra lỗi hệ thống</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--color-app-text-muted)]">
                Giao diện gặp sự cố ngoài dự kiến. Vui lòng tải lại trang hoặc thử lại sau.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="app-button app-button-primary"
                >
                  <RefreshCw className="h-4 w-4" />
                  Tải lại trang
                </button>
                <Link to="/" className="app-button app-button-secondary">
                  <Home className="h-4 w-4" />
                  Trang chủ
                </Link>
                <button
                  type="button"
                  onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                  className="text-xs font-medium text-[var(--color-app-text-subtle)] underline transition hover:text-[var(--color-app-text)]"
                >
                  {this.state.showDetails ? 'Ẩn chi tiết lỗi' : 'Xem chi tiết lỗi'}
                </button>
              </div>

              {this.state.showDetails && this.state.error && (
                <div className="mt-4 overflow-x-auto rounded-md border border-red-400/15 bg-red-400/10 p-3 text-xs font-mono text-red-300">
                  <p className="font-bold">{this.state.error.toString()}</p>
                  {this.state.errorInfo?.componentStack && (
                    <pre className="mt-2 whitespace-pre-wrap text-[11px] text-slate-500">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
