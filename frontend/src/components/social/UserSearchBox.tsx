import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, UserRound } from 'lucide-react';
import { friendsApi } from '@/api/friends.api';
import { FriendButton } from './FriendButton';
import { UserMiniProfilePopover } from './UserMiniProfilePopover';

type UserSearchBoxProps = {
  onError?: (message: string) => void;
};

export const UserSearchBox = ({ onError }: UserSearchBoxProps) => {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [hiddenUserIds, setHiddenUserIds] = useState<Set<string>>(new Set());

  const searchQuery = useQuery({
    queryKey: ['friend-search', query],
    queryFn: () => friendsApi.searchUsers(query),
    enabled: query.length >= 2,
    refetchInterval: query.length >= 2 ? 1000 : false,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    const searchResults = searchQuery.data ?? [];
    setHiddenUserIds((current) => {
      if (current.size === 0) {
        return current;
      }

      const pendingOutgoingIds = new Set(
        searchResults
          .filter((user) => user.friendStatus === 'PENDING_OUTGOING')
          .map((user) => user.id),
      );
      const next = new Set([...current].filter((userId) => pendingOutgoingIds.has(userId)));
      return next.size === current.size ? current : next;
    });
  }, [searchQuery.data]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = input.trim();
    if (value.length < 2) {
      onError?.('Từ khóa tìm kiếm cần ít nhất 2 ký tự.');
      return;
    }
    setHiddenUserIds(new Set());
    setQuery(value);
  };

  const selectedUser = searchQuery.data?.find((user) => user.id === selectedUserId);
  const visibleUsers = (searchQuery.data ?? []).filter((user) => !hiddenUserIds.has(user.id));

  return (
    <section className="rounded-lg border border-white/10 bg-slate-950/70 p-4">
      <h2 className="font-semibold text-white">Tìm người dùng</h2>
      <form onSubmit={submit} className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Nhập tên, email hoặc ID 10 số..."
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
        >
          <Search size={16} />
          Tìm
        </button>
      </form>

      <div className="mt-4 space-y-2">
        {searchQuery.isLoading && <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-400">Đang tìm...</div>}
        {query && !searchQuery.isLoading && visibleUsers.length === 0 && (
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-400">Không tìm thấy user phù hợp.</div>
        )}
        {visibleUsers.map((user) => (
          <div key={user.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button type="button" onClick={() => setSelectedUserId(selectedUserId === user.id ? '' : user.id)} className="flex min-w-0 items-center gap-3 text-left">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-200">
                  <UserRound size={20} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                  <p className="truncate text-xs text-slate-500">ID {user.publicId} · {user.email ?? 'Email ẩn'}</p>
                </div>
              </button>
              <FriendButton
                userId={user.id}
                status={user.friendStatus}
                size="sm"
                onError={onError}
                onStatusChange={(status) => {
                  setHiddenUserIds((current) => {
                    const next = new Set(current);
                    if (status === 'PENDING_OUTGOING') {
                      next.add(user.id);
                    } else {
                      next.delete(user.id);
                    }
                    return next;
                  });
                }}
              />
            </div>
            {selectedUser?.id === user.id && (
              <div className="mt-3">
                <UserMiniProfilePopover user={selectedUser} onError={onError} />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
