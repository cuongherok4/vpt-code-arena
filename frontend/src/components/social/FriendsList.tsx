import { MessageSquare, RefreshCw, UserRound, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import type { Friend } from '@/api/friends.api';
import { FriendButton } from './FriendButton';
import { UserMiniProfilePopover } from './UserMiniProfilePopover';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonCard } from '@/components/common/LoadingSkeleton';

type FriendsListProps = {
  friends: Friend[];
  loading?: boolean;
  refreshing?: boolean;
  onRefresh: () => void;
  onError?: (message: string) => void;
};

export const FriendsList = ({ friends, loading, refreshing, onRefresh, onError }: FriendsListProps) => {
  const [selectedFriendId, setSelectedFriendId] = useState('');
  const selectedFriend = friends.find((friend) => friend.id === selectedFriendId);

  return (
    <section aria-label="Danh sách bạn bè" className="rounded-lg border border-white/10 bg-slate-950/70 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-white">Bạn bè</h2>
          <p className="text-xs text-slate-400">{friends.length} người trong danh sách</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 focus-visible:outline-none"
          title="Làm mới danh sách bạn bè"
          aria-label="Làm mới danh sách bạn bè"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : friends.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="Chưa có bạn bè"
          description="Hãy tìm kiếm người dùng theo tên hoặc ID để kết nối và bắt đầu trò chuyện."
        />
      ) : (
        <div className="space-y-2">
          {friends.map((friend) => (
            <div key={friend.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-white/20">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedFriendId(selectedFriendId === friend.id ? '' : friend.id)}
                  aria-expanded={selectedFriendId === friend.id}
                  aria-label={`Xem thông tin nhanh của ${friend.name}`}
                  className="flex min-w-0 items-center gap-3 text-left focus-visible:outline-none"
                >
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-200">
                    <UserRound size={20} />
                    <span
                      aria-label={friend.online ? 'Đang hoạt động' : 'Ngoại tuyến'}
                      className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-slate-950 ${friend.online ? 'bg-emerald-400' : 'bg-slate-600'}`}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{friend.name}</p>
                    <p className="truncate text-xs text-slate-400">ID {friend.publicId} · {friend.email ?? 'Email ẩn'}</p>
                  </div>
                </button>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/chat?dm=${friend.id}`}
                    aria-label={`Nhắn tin cho ${friend.name}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/5 focus-visible:outline-none"
                  >
                    <MessageSquare size={16} />
                    Nhắn tin
                  </Link>
                  <FriendButton userId={friend.id} status="FRIENDS" size="sm" onError={onError} />
                </div>
              </div>
              {selectedFriend?.id === friend.id && (
                <div className="mt-3">
                  <UserMiniProfilePopover user={selectedFriend} onError={onError} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
