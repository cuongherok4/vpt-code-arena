
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export const PageLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-app-bg)] text-[var(--color-app-text)]">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-white/10 py-6 text-center text-sm text-[var(--color-app-text-subtle)]">
        © 2026 VPT Code Arena. All rights reserved.
      </footer>
    </div>
  );
};
