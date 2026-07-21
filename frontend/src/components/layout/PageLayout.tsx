
import { Outlet, useLocation } from 'react-router-dom';
import { ChatDock } from '@/components/chat/ChatDock';
import { Navbar } from './Navbar';

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
      <footer className="border-t border-white/10 py-6 text-center text-sm text-[var(--color-app-text-subtle)]">
        © 2026 VPT Code Arena. All rights reserved.
      </footer>
    </div>
  );
};
