
import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { Code2, Trophy, BookOpen, MessageSquare, LogIn, User, UsersRound } from 'lucide-react';
import { friendsApi } from '@/api/friends.api';
import { useAuthStore } from '@/stores/authStore';

const NAV_LINKS = [
  { to: '/learn', icon: BookOpen, label: 'Học tập' },
  { to: '/exam', icon: Code2, label: 'Kỳ thi' },
  { to: '/battle', icon: Trophy, label: 'Thách đấu' },
  { to: '/chat', icon: MessageSquare, label: 'Cộng đồng' },
  { to: '/friends', icon: UsersRound, label: 'Bạn bè' },
];

export const Navbar = () => {
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();
  const previousIncomingCount = useRef(0);
  const previousPendingCount = useRef(0);
  const [showFriendNotice, setShowFriendNotice] = useState(false);

  const friendRequestsQuery = useQuery({
    queryKey: ['friend-requests'],
    queryFn: friendsApi.requests,
    enabled: isAuthenticated,
    refetchInterval: 1000,
    refetchIntervalInBackground: true,
  });

  const incomingCount = friendRequestsQuery.data?.incoming.length ?? 0;
  const outgoingCount = friendRequestsQuery.data?.outgoing.length ?? 0;
  const pendingCount = incomingCount + outgoingCount;

  useEffect(() => {
    if (pendingCount !== previousPendingCount.current) {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friend-search'] });
    }

    if (incomingCount > previousIncomingCount.current && !pathname.startsWith('/friends')) {
      setShowFriendNotice(true);
      const timeoutId = window.setTimeout(() => setShowFriendNotice(false), 4500);
      previousIncomingCount.current = incomingCount;
      previousPendingCount.current = pendingCount;
      return () => window.clearTimeout(timeoutId);
    }

    previousIncomingCount.current = incomingCount;
    previousPendingCount.current = pendingCount;
  }, [incomingCount, pathname, pendingCount, queryClient]);

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
                <span className="relative inline-flex">
                  <Icon className="h-4 w-4" />
                  {to === '/friends' && incomingCount > 0 && (
                    <span className="absolute -right-2.5 -top-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-slate-950">
                      {incomingCount > 9 ? '9+' : incomingCount}
                    </span>
                  )}
                </span>
                <span className="hidden sm:inline-block">{label}</span>
              </Link>
            );
          })}
        </div>

        {isAuthenticated ? (
          <Link
            to="/profile"
            className="flex items-center space-x-2 border border-white/10 rounded-md px-3 py-1.5 text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            <User className="h-4 w-4" />
            <span className="hidden text-left sm:inline-block">
              <span className="block text-sm font-medium leading-4">{user?.name ?? 'Tai khoan'}</span>
              {user?.publicId && <span className="block text-[11px] leading-4 text-slate-500">ID {user.publicId}</span>}
            </span>
          </Link>
        ) : (
          <Link
            to="/login"
            className="flex items-center space-x-2 rounded-md bg-violet-600 px-3 py-1.5 text-white hover:bg-violet-500 transition-colors"
          >
            <LogIn className="h-4 w-4" />
            <span className="text-sm font-medium hidden sm:inline-block">Dang nhap</span>
          </Link>
        )}
      </div>
      {showFriendNotice && incomingCount > 0 && (
        <Link
          to="/friends"
          onClick={() => setShowFriendNotice(false)}
          className="absolute right-4 top-[72px] w-72 rounded-lg border border-cyan-400/20 bg-slate-950 p-3 text-sm text-slate-200 shadow-xl shadow-black/30 hover:border-cyan-300/40"
        >
          <span className="block font-semibold text-white">Có lời mời kết bạn mới</span>
          <span className="mt-1 block text-xs text-slate-400">Bạn đang có {incomingCount} lời mời đang chờ.</span>
        </Link>
      )}
    </nav>
  );
};
