
import { Link, useLocation } from 'react-router-dom';
import { Code2, Trophy, BookOpen, MessageSquare, User } from 'lucide-react';

const NAV_LINKS = [
  { to: '/learn', icon: BookOpen, label: 'Học tập' },
  { to: '/exam', icon: Code2, label: 'Kỳ thi' },
  { to: '/battle', icon: Trophy, label: 'Thách đấu' },
  { to: '/chat', icon: MessageSquare, label: 'Cộng đồng' },
];

export const Navbar = () => {
  const { pathname } = useLocation();

  return (
    <nav className="border-b border-white/10 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <Code2 className="h-6 w-6 text-violet-400" />
          <span className="font-bold text-lg hidden sm:inline-block text-white">VPT Arena</span>
        </Link>

        <div className="flex items-center space-x-1 text-sm font-medium">
          {NAV_LINKS.map(({ to, icon: Icon, label }) => {
            const active = pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-colors
                  ${active
                    ? 'text-violet-300 bg-violet-600/15'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline-block">{label}</span>
              </Link>
            );
          })}
        </div>

        <Link
          to="/profile"
          className="flex items-center space-x-2 border border-white/10 rounded-full px-3 py-1.5 text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
        >
          <User className="h-4 w-4" />
          <span className="text-sm font-medium hidden sm:inline-block">Tài khoản</span>
        </Link>
      </div>
    </nav>
  );
};
