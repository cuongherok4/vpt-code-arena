import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Code2, Trophy, BookOpen, LogIn, User, X, Shield } from 'lucide-react';
import { battleApi } from '@/api/battle.api';
import { friendsApi } from '@/api/friends.api';
import { useBattleInviteSocket, type BattleInviteEvent } from '@/hooks/useBattleInviteSocket';
import { useAuthStore } from '@/stores/authStore';

const NAV_LINKS = [
  { to: '/learn', icon: BookOpen, label: 'Học tập' },
  { to: '/exam', icon: Code2, label: 'Kỳ thi' },
  { to: '/battle', icon: Trophy, label: 'Thách đấu' },
];

export const Navbar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();
  const previousIncomingCount = useRef(0);
  const previousPendingCount = useRef(0);
  const [showFriendNotice, setShowFriendNotice] = useState(false);
  const [battleInvite, setBattleInvite] = useState<BattleInviteEvent | null>(null);

  const handleBattleInvite = useCallback((event: BattleInviteEvent) => {
    setBattleInvite(event);
  }, []);

  useBattleInviteSocket(handleBattleInvite);

  const joinInviteMutation = useMutation({
    mutationFn: (roomId: string) => battleApi.joinRoom(roomId),
    onSuccess: (room) => {
      setBattleInvite(null);
      queryClient.invalidateQueries({ queryKey: ['battle-rooms'] });
      navigate(`/battle/rooms/${room.id}`);
    },
  });

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
  const navItems = user?.role === 'ADMIN'
    ? [...NAV_LINKS, { to: '/admin', icon: Shield, label: 'Admin' }]
    : NAV_LINKS;

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
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/[0.88] backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-3 sm:px-4">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
            <Code2 className="h-5 w-5" />
          </span>
          <span className="hidden truncate text-lg font-bold text-white sm:inline-block">VPT Arena</span>
        </Link>

        <div className="hidden min-w-0 items-center gap-1 overflow-x-auto text-sm font-medium lg:flex">
          {navItems.map((item) => (
            <NavLinkItem
              key={item.to}
              item={item}
              active={isActivePath(pathname, item.to)}
            />
          ))}
        </div>

        {isAuthenticated ? (
          <Link
            to="/profile"
            className="relative flex max-w-[180px] items-center gap-2 rounded-md border border-white/10 px-2.5 py-1.5 text-slate-300 transition-colors hover:bg-white/5 hover:text-white sm:max-w-[240px] sm:px-3"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/5">
              <User className="h-4 w-4" />
            </span>
            <span className="hidden min-w-0 text-left sm:inline-block">
              <span className="block truncate text-sm font-medium leading-4">{user?.name ?? 'Tai khoan'}</span>
              {user?.publicId && <span className="block text-[11px] leading-4 text-slate-500">ID {user.publicId}</span>}
            </span>
            {incomingCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-slate-950">
                {incomingCount > 9 ? '9+' : incomingCount}
              </span>
            )}
          </Link>
        ) : (
          <Link
            to="/login"
            className="app-button app-button-primary px-3 py-1.5"
          >
            <LogIn className="h-4 w-4" />
            <span className="hidden text-sm font-medium sm:inline-block">Dang nhap</span>
          </Link>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-slate-950/[0.94] px-2 py-2 backdrop-blur-md lg:hidden">
        <div className="mx-auto grid max-w-2xl grid-flow-col auto-cols-fr gap-1 overflow-x-auto">
          {navItems.map((item) => (
            <NavLinkItem
              key={item.to}
              item={item}
              active={isActivePath(pathname, item.to)}
              mobile
            />
          ))}
        </div>
      </div>

      {showFriendNotice && incomingCount > 0 && (
        <Link
          to="/friends"
          onClick={() => setShowFriendNotice(false)}
          className="fixed right-3 top-[72px] w-[calc(100vw-1.5rem)] max-w-72 rounded-lg border border-cyan-400/20 bg-slate-950 p-3 text-sm text-slate-200 shadow-xl shadow-black/30 hover:border-cyan-300/40 sm:right-4"
        >
          <span className="block font-semibold text-white">Có lời mời kết bạn mới</span>
          <span className="mt-1 block text-xs text-slate-400">Bạn đang có {incomingCount} lời mời đang chờ.</span>
        </Link>
      )}
      {battleInvite && (
        <div className="fixed right-3 top-[72px] w-[calc(100vw-1.5rem)] max-w-80 rounded-lg border border-violet-400/25 bg-slate-950 p-3 text-sm text-slate-200 shadow-xl shadow-black/30 sm:right-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="block font-semibold text-white">Bạn được mời thi đấu</span>
              <span className="mt-1 block text-xs text-slate-400">
                {battleInvite.inviterName ?? 'Một người bạn'} mời bạn vào phòng {battleInvite.roomName}.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setBattleInvite(null)}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-white/5 hover:text-white"
              title="Từ chối"
            >
              <X size={15} />
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => joinInviteMutation.mutate(battleInvite.roomId)}
              disabled={joinInviteMutation.isPending}
              className="inline-flex flex-1 items-center justify-center rounded-lg bg-violet-500 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-400 disabled:opacity-50"
            >
              {joinInviteMutation.isPending ? 'Đang vào...' : 'Tham gia'}
            </button>
            <button
              type="button"
              onClick={() => setBattleInvite(null)}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
            >
              Từ chối
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

type NavItem = {
  to: string;
  icon: typeof BookOpen;
  label: string;
};

function NavLinkItem({ item, active, mobile = false }: {
  item: NavItem;
  active: boolean;
  mobile?: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      className={`relative flex items-center justify-center gap-1.5 rounded-md transition-colors ${
        mobile ? 'min-w-14 flex-col px-2 py-1.5 text-[11px]' : 'px-3 py-2 text-sm'
      } ${
        active
          ? 'bg-cyan-400/[0.12] text-cyan-100 ring-1 ring-cyan-400/25'
          : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <span className="relative inline-flex">
        <Icon className={mobile ? 'h-4 w-4' : 'h-4 w-4'} />
      </span>
      <span className={mobile ? 'max-w-16 truncate leading-4' : 'truncate'}>{item.label}</span>
    </Link>
  );
}

function isActivePath(pathname: string, target: string) {
  return target === '/' ? pathname === '/' : pathname.startsWith(target);
}
