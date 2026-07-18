import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Lock, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { friendsApi } from '@/api/friends.api';
import { FriendsList } from '@/components/social/FriendsList';
import { FriendRequestsPanel } from '@/components/social/FriendRequestsPanel';
import { UserSearchBox } from '@/components/social/UserSearchBox';
import { useAuthStore } from '@/stores/authStore';

export const FriendsPage = () => {
  const { isAuthenticated } = useAuthStore();
  const [error, setError] = useState('');
  const [manualRefreshing, setManualRefreshing] = useState(false);

  const friendsQuery = useQuery({
    queryKey: ['friends'],
    queryFn: friendsApi.friends,
    enabled: isAuthenticated,
    refetchInterval: 1000,
    refetchIntervalInBackground: true,
  });

  const requestsQuery = useQuery({
    queryKey: ['friend-requests'],
    queryFn: friendsApi.requests,
    enabled: isAuthenticated,
    refetchInterval: 1000,
    refetchIntervalInBackground: true,
  });

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-xl rounded-lg border border-white/10 bg-slate-950/70 p-6 text-center">
        <Lock size={32} className="mx-auto mb-3 text-cyan-300" />
        <h1 className="text-xl font-semibold text-white">Cần đăng nhập để quản lý bạn bè</h1>
        <p className="mt-2 text-sm text-slate-400">Danh sách bạn bè và lời mời kết bạn gắn với tài khoản của bạn.</p>
        <Link to="/login" className="mt-5 inline-flex rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400">
          Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2 text-cyan-300">
            <UsersRound size={20} />
            <span className="text-sm font-medium">Social</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Bạn bè</h1>
          <p className="mt-1 text-sm text-slate-400">Tìm user, gửi lời mời, duyệt request và mở DM nhanh.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">
          <span className="flex items-center gap-2"><AlertCircle size={16} /> {error}</span>
          <button type="button" onClick={() => setError('')} className="text-amber-100 hover:text-white">Đóng</button>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-5">
          <UserSearchBox onError={setError} />
          <FriendRequestsPanel requests={requestsQuery.data} loading={requestsQuery.isLoading} onError={setError} />
        </div>
        <FriendsList
          friends={friendsQuery.data ?? []}
          loading={friendsQuery.isLoading}
          refreshing={manualRefreshing}
          onRefresh={() => {
            setManualRefreshing(true);
            friendsQuery.refetch().finally(() => setManualRefreshing(false));
          }}
          onError={setError}
        />
      </div>
    </div>
  );
};

export default FriendsPage;
