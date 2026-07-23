import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { ChatMessage } from '@/api/chat.api';
import { battleApi } from '@/api/battle.api';
import { friendsApi, type FriendStatus } from '@/api/friends.api';
import { UserMiniProfilePopover } from '@/components/social/UserMiniProfilePopover';

type MessageListProps = {
  messages: ChatMessage[];
  currentUserId?: string;
  onError?: (message: string) => void;
};

export const MessageList = ({ messages, currentUserId, onError }: MessageListProps) => {
  const [selectedSenderId, setSelectedSenderId] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const joinBattleMutation = useMutation({
    mutationFn: (roomId: string) => battleApi.joinRoom(roomId),
    onSuccess: (room) => {
      queryClient.invalidateQueries({ queryKey: ['battle-rooms'] });
      navigate(`/battle/rooms/${room.id}`);
    },
    onError: (error) => onError?.(apiErrorMessage(error, 'Không thể vào phòng. Phòng có thể đã đầy hoặc đã bắt đầu.')),
  });
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
          const battleInvite = parseBattleInvite(item);
          return (
            <div key={item.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[88%] rounded-lg border px-3 py-2 sm:max-w-[78%] ${mine ? 'border-cyan-400/25 bg-cyan-500/12' : 'border-white/10 bg-white/[0.05]'}`}>
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
                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-100">
                  {item.deleted ? 'Tin nhắn đã bị xóa' : battleInvite ? 'Mời mọi người vào phòng thách đấu.' : item.message}
                </p>
                {!item.deleted && battleInvite && (
                  <div className="mt-3 rounded-lg border border-cyan-400/25 bg-cyan-400/10 p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-cyan-200">Lời mời thách đấu</div>
                    <div className="mt-1 truncate text-sm font-semibold text-white">{battleInvite.name}</div>
                    {battleInvite.code && (
                      <div className="mt-1 font-mono text-xs text-slate-400">Mã {battleInvite.code}</div>
                    )}
                    <button
                      type="button"
                      onClick={() => joinBattleMutation.mutate(battleInvite.roomId)}
                      disabled={joinBattleMutation.isPending}
                      className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-cyan-400 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
                    >
                      {joinBattleMutation.isPending ? 'Đang vào...' : 'Vào phòng'}
                    </button>
                  </div>
                )}
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

function parseBattleInvite(message: ChatMessage): { roomId: string; code: string; name: string } | null {
  if (message.battleRoomId) {
    return {
      roomId: message.battleRoomId,
      code: message.battleRoomCode ?? '',
      name: message.battleRoomName ?? 'Phòng battle',
    };
  }
  if (!message.message?.startsWith('__BATTLE_INVITE__|')) return null;
  const [, roomId = '', code = '', name = 'Phòng battle'] = message.message.split('|');
  return roomId ? { roomId, code, name } : null;
}

function apiErrorMessage(error: unknown, fallback: string): string {
  const response = typeof error === 'object' && error !== null && 'response' in error
    ? (error as { response?: { data?: unknown } }).response
    : undefined;
  const data = response?.data;
  if (typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string') return data.message;
  if (typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string') return data.error;
  return fallback;
}
