
import { Outlet, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ChatDock } from '@/components/chat/ChatDock';
import { Navbar } from './Navbar';
import { Code2, BookOpen, Trophy } from 'lucide-react';

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
      <footer className="border-t border-white/10 bg-slate-950/80 py-8 shadow-[0_-1px_0_rgba(255,255,255,0.04)]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <img src="/logocty.png" alt="VPT" className="h-7 w-auto object-contain" />
              <span className="text-sm font-bold text-white">
                Code <span className="text-cyan-300">Arena</span>
              </span>
            </Link>

            {/* Nav links */}
            <nav className="flex items-center gap-5 text-xs text-slate-500">
              <Link to="/learn" className="flex items-center gap-1 transition-colors hover:text-cyan-200">
                <BookOpen className="h-3 w-3" /> Học tập
              </Link>
              <Link to="/exam" className="flex items-center gap-1 transition-colors hover:text-cyan-200">
                <Code2 className="h-3 w-3" /> Kỳ thi
              </Link>
              <Link to="/battle" className="flex items-center gap-1 transition-colors hover:text-cyan-200">
                <Trophy className="h-3 w-3" /> Thách đấu
              </Link>
            </nav>

            {/* Copyright */}
            <p className="text-xs text-slate-500">
              © 2026 VPT Code Arena
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
