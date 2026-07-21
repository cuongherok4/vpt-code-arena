import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Code2, Trophy, BookOpen, LogIn, User, X, Swords, Bell } from 'lucide-react';
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
  const navItems = NAV_LINKS;

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
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-white/10 bg-slate-950/92 shadow-lg shadow-black/25 backdrop-blur-xl'
          : 'border-b border-white/10 bg-slate-950/78 backdrop-blur-md'
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-3 sm:px-4">

        {/* ── Logo ── */}
        <Link to="/" className="group flex min-w-0 items-center gap-2.5">
          <img
            src="/logocty.png"
            alt="VPT Logo"
            className="h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          />
          <span className="hidden truncate text-base font-bold text-white sm:inline-block">
            Code <span className="text-cyan-300">Arena</span>
          </span>
        </Link>

        {/* ── Desktop Nav ── */}
        <div className="hidden min-w-0 items-center gap-0.5 text-sm font-medium lg:flex">
          {navItems.map((item) => (
            <NavLinkItem
              key={item.to}
              item={item}
              active={isActivePath(pathname, item.to)}
            />
          ))}
        </div>

        {/* ── Right side ── */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Link
              to="/profile"
              className="group relative flex max-w-[180px] items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-slate-300 shadow-sm transition-all duration-200 hover:border-cyan-300/35 hover:bg-white/[0.07] hover:text-white sm:max-w-[240px] sm:px-3"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                <User className="h-3.5 w-3.5" />
              </span>
              <span className="hidden min-w-0 text-left sm:inline-block">
                <span className="block truncate text-sm font-semibold leading-4 text-white">{user?.name ?? 'Tài khoản'}</span>
                {user?.publicId && <span className="block text-[11px] leading-4 text-slate-500">ID {user.publicId}</span>}
              </span>
              {incomingCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold leading-none text-slate-950 ring-2 ring-slate-950 shadow-md">
                  {incomingCount > 9 ? '9+' : incomingCount}
                </span>
              )}
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 shadow-md shadow-teal-950/20 transition-all duration-200 hover:bg-teal-200 hover:shadow-teal-400/20"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline-block">Đăng nhập</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── Mobile Bottom Bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-slate-950/95 px-2 py-2 shadow-lg shadow-black/30 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-2xl grid-flow-col auto-cols-fr gap-1">
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

      {/* ── Friend toast ── */}
      {showFriendNotice && incomingCount > 0 && (
        <Link
          to="/friends"
          onClick={() => setShowFriendNotice(false)}
          className="fixed right-3 top-[72px] w-[calc(100vw-1.5rem)] max-w-72 rounded-lg border border-cyan-300/20 bg-slate-950 p-4 text-sm text-slate-300 shadow-xl shadow-black/30 hover:border-cyan-300/40 sm:right-4 animate-fade-in-up"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-cyan-300/10 text-cyan-200">
              <Bell size={15} />
            </span>
            <div>
              <span className="block font-semibold text-white">Lời mời kết bạn mới</span>
              <span className="mt-0.5 block text-xs text-slate-400">Bạn có {incomingCount} lời mời đang chờ.</span>
            </div>
          </div>
        </Link>
      )}

      {/* ── Battle invite toast ── */}
      {battleInvite && (
        <div className="fixed right-3 top-[72px] w-[calc(100vw-1.5rem)] max-w-80 rounded-lg border border-amber-300/25 bg-slate-950 p-4 text-sm text-slate-300 shadow-xl shadow-black/30 sm:right-4 animate-fade-in-up">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-300/10 text-amber-200">
                <Swords size={15} />
              </span>
              <div>
                <span className="block font-semibold text-white">Lời mời thi đấu!</span>
                <span className="mt-0.5 block text-xs text-slate-400">
                  <span className="font-medium text-cyan-200">{battleInvite.inviterName ?? 'Người dùng'}</span> mời bạn vào phòng <span className="font-medium text-white">{battleInvite.roomName}</span>.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setBattleInvite(null)}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white/5 hover:text-white"
              title="Từ chối"
            >
              <X size={14} />
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => joinInviteMutation.mutate(battleInvite.roomId)}
              disabled={joinInviteMutation.isPending}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-teal-300 px-3 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-teal-200 disabled:opacity-50"
            >
              {joinInviteMutation.isPending ? 'Đang vào...' : 'Tham gia'}
            </button>
            <button
              type="button"
              onClick={() => setBattleInvite(null)}
              className="rounded-md border border-white/10 px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
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
      className={`relative flex items-center justify-center gap-1.5 rounded-xl transition-all duration-200 ${
        mobile ? 'min-w-14 flex-col px-2 py-1.5 text-[11px]' : 'px-3.5 py-2 text-sm'
      } ${
        active
          ? 'bg-cyan-300/10 text-cyan-100 font-semibold ring-1 ring-cyan-300/18'
          : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
      }`}
    >
      <Icon className={`${mobile ? 'h-4 w-4' : 'h-4 w-4'}`} />
      <span className={mobile ? 'max-w-16 truncate leading-4' : 'truncate font-medium'}>{item.label}</span>
      {active && !mobile && (
        <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-cyan-300" />
      )}
    </Link>
  );
}

function isActivePath(pathname: string, target: string) {
  return target === '/' ? pathname === '/' : pathname.startsWith(target);
}
