import { Outlet, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ChatDock } from '@/components/chat/ChatDock';
import { Navbar } from './Navbar';
import { Code2, BookOpen, Trophy, Mail, Phone, Globe } from 'lucide-react';

export const PageLayout = () => {
  const { pathname } = useLocation();
  const showChatDock = !pathname.startsWith('/chat');

  return (
    <div className="app-shell flex min-h-screen flex-col text-[var(--color-app-text)]">
      <Navbar />
      <main className="container mx-auto flex-1 px-3 pb-24 pt-5 sm:px-4 sm:pt-7 lg:pb-8">
        <Outlet />
      </main>
      {showChatDock && <ChatDock />}

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-950/80 shadow-[0_-1px_0_rgba(255,255,255,0.04)]">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="lg:col-span-2">
              <Link to="/" className="inline-flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/[0.03]">
                  <img src="/logocty.png" alt="VPT" className="h-6 w-auto object-contain" />
                </span>
                <span className="text-base font-bold text-white">
                  Code <span className="text-cyan-300">Arena</span>
                </span>
              </Link>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
                Nền tảng học lập trình, luyện thi và thi đấu code thời gian thực, giúp bạn rèn kỹ năng và chinh phục mọi thử thách.
              </p>
            </div>

            {/* Product links */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Sản phẩm</h3>
              <nav className="mt-4 flex flex-col gap-2.5 text-sm text-slate-400">
                <Link to="/learn" className="inline-flex items-center gap-2 transition-colors hover:text-cyan-200">
                  <BookOpen className="h-3.5 w-3.5" /> Học tập
                </Link>
                <Link to="/exam" className="inline-flex items-center gap-2 transition-colors hover:text-cyan-200">
                  <Code2 className="h-3.5 w-3.5" /> Kỳ thi
                </Link>
                <Link to="/battle" className="inline-flex items-center gap-2 transition-colors hover:text-cyan-200">
                  <Trophy className="h-3.5 w-3.5" /> Thách đấu
                </Link>
              </nav>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Liên hệ</h3>
              <div className="mt-4 flex flex-col gap-2.5 text-sm text-slate-400">
                <a href="mailto:cuongherok4@gmail.com" className="inline-flex items-center gap-2 transition-colors hover:text-cyan-200">
                  <Mail className="h-3.5 w-3.5" /> cuongherok4@gmail.com
                </a>
                <a href="tel:0336388758" className="inline-flex items-center gap-2 transition-colors hover:text-cyan-200">
                  <Phone className="h-3.5 w-3.5" /> 0336 388 758
                </a>
                <a href="https://vpt.vn" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 transition-colors hover:text-cyan-200">
                  <Globe className="h-3.5 w-3.5" /> vpt.vn
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};