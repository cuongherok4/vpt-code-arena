import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ChatMessage } from '@/api/chat.api';
import { friendsApi, type FriendStatus } from '@/api/friends.api';
import { UserMiniProfilePopover } from '@/components/social/UserMiniProfilePopover';

type MessageListProps = {
  messages: ChatMessage[];
  currentUserId?: string;
  onError?: (message: string) => void;
};

export const MessageList = ({ messages, currentUserId, onError }: MessageListProps) => {
  const [selectedSenderId, setSelectedSenderId] = useState('');
  const friendsQuery = useQuery({
    queryKey: ['friends'],
    queryFn: friendsApi.friends,
    enabled: Boolean(currentUserId),
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
  });
  const requestsQuery = useQuery({
    queryKey: ['friend-requests'],
    queryFn: friendsApi.requests,
    enabled: Boolean(currentUserId),
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
  });

  const userById = useMemo(() => {
    const users = new Map<string, {
      id: string;
      publicId?: string;
      name: string;
      email?: string | null;
      friendStatus?: FriendStatus;
    }>();
    messages.forEach((message) => {
      users.set(message.senderId, {
        id: message.senderId,
        name: message.senderName,
        email: message.senderEmail,
        friendStatus: friendStatus(message.senderId, currentUserId, friendsQuery.data ?? [], requestsQuery.data),
      });
    });
    return users;
  }, [currentUserId, friendsQuery.data, messages, requestsQuery.data]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
      {messages.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-500">
          Chưa có tin nhắn.
        </div>
      ) : (
        messages.map((item) => {
          const mine = item.senderId === currentUserId;
          const selectedUser = userById.get(item.senderId);
          return (
            <div key={item.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] rounded-lg border px-3 py-2 ${mine ? 'border-cyan-400/25 bg-cyan-500/12' : 'border-white/10 bg-white/[0.05]'}`}>
                <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
                  {mine ? (
                    <span className="max-w-[160px] truncate font-medium text-slate-200">Bạn</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedSenderId(selectedSenderId === item.senderId ? '' : item.senderId)}
                      className="max-w-[160px] truncate font-medium text-slate-200 hover:text-cyan-200"
                    >
                      {item.senderName}
                    </button>
                  )}
                  <span>{formatTime(item.createdAt)}</span>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-100">{item.deleted ? 'Tin nhắn đã bị xóa' : item.message}</p>
                {!mine && selectedSenderId === item.senderId && selectedUser && (
                  <div className="mt-3">
                    <UserMiniProfilePopover user={selectedUser} onError={onError} />
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

function friendStatus(
  userId: string,
  currentUserId: string | undefined,
  friends: Array<{ id: string; publicId?: string }>,
  requests: Awaited<ReturnType<typeof friendsApi.requests>> | undefined,
): FriendStatus {
  if (userId === currentUserId) return 'SELF';
  if (friends.some((friend) => friend.id === userId)) return 'FRIENDS';
  if (requests?.incoming.some((request) => request.user.id === userId)) return 'PENDING_INCOMING';
  if (requests?.outgoing.some((request) => request.user.id === userId)) return 'PENDING_OUTGOING';
  return 'NONE';
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}
