
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export const PageLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © 2026 VPT Code Arena. All rights reserved.
      </footer>
    </div>
  );
};
