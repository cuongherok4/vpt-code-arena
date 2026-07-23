import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, UsersRound, X } from 'lucide-react';
import { chatApi, type ChatConversation, type ChatMessage } from '@/api/chat.api';
import { friendsApi } from '@/api/friends.api';
import { DMChatWindow } from '@/components/chat/DMChatWindow';
import { DMConversationList } from '@/components/chat/DMConversationList';
import { GlobalChatPanel } from '@/components/chat/GlobalChatPanel';
import { useChatSocket } from '@/hooks/useChatSocket';
import { useAuthStore } from '@/stores/authStore';

export function ChatDock() {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'global' | 'dm'>('global');
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const [selectedDmUserId, setSelectedDmUserId] = useState('');
  const [localUnreadByUserId, setLocalUnreadByUserId] = useState<Record<string, number>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const conversationsQuery = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: chatApi.conversations,
    enabled: isAuthenticated,
  });

  const friendsQuery = useQuery({
    queryKey: ['friends'],
    queryFn: friendsApi.friends,
    enabled: isAuthenticated && open,
    refetchInterval: 3000,
  });

  const appendMessage = useCallback((message: ChatMessage) => {
    setLiveMessages((prev) => prev.some((item) => item.id === message.id) ? prev : [...prev, message]);
    if (message.channel === 'GLOBAL') {
      queryClient.setQueryData<ChatMessage[]>(['chat-global'], (current = []) => mergeMessages(current, [message]));
    }
    if (message.channel === 'DM') {
      const otherUserId = message.senderId === user?.id ? message.receiverId : message.senderId;
      if (otherUserId) {
        queryClient.setQueryData<ChatMessage[]>(['chat-dm', otherUserId], (current = []) => mergeMessages(current, [message]));
        queryClient.setQueryData<ChatConversation[]>(['chat-conversations'], (current = []) => upsertConversation(current, message, otherUserId));
      }
      if (otherUserId && message.senderId !== user?.id) {
        const isViewingMessage = open && tab === 'dm' && selectedDmUserId === otherUserId;
        if (isViewingMessage) {
          setLocalUnreadByUserId(prev => ({ ...prev, [otherUserId]: 0 }));
          chatApi.markAsRead(otherUserId)
            .then(() => queryClient.invalidateQueries({ queryKey: ['chat-conversations'] }))
            .catch(console.error);
        } else {
          setLocalUnreadByUserId(prev => ({
            ...prev,
            [otherUserId]: (prev[otherUserId] ?? getServerUnreadCount(queryClient, otherUserId)) + 1,
          }));
        }
      }
    }
  }, [open, queryClient, selectedDmUserId, tab, user?.id]);

  const chatSocket = useChatSocket({
    onMessage: appendMessage,
    onDirectMessage: appendMessage,
    onError: setError,
  });

  if (!isAuthenticated) return null;

  const selectedFriend = friendsQuery.data?.find((friend) => friend.id === selectedDmUserId);
  const displayConversations = applyLocalUnreadCounts(conversationsQuery.data ?? [], localUnreadByUserId);
  const selectedConversation = displayConversations.find((conversation) => conversation.userId === selectedDmUserId);
  const selectedDmUserName = selectedFriend?.name ?? selectedConversation?.userName;
  const selectedDmUserEmail = selectedFriend?.email ?? selectedConversation?.userEmail;
  const totalUnreadCount = displayConversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);

  const openDmTab = () => {
    setOpen(true);
    setTab('dm');
    if (selectedDmUserId) markConversationAsViewed(selectedDmUserId, setLocalUnreadByUserId, queryClient);
  };

  const selectDmUser = (userId: string) => {
    setSelectedDmUserId(userId);
    markConversationAsViewed(userId, setLocalUnreadByUserId, queryClient);
  };

  return (
    <div className="fixed bottom-20 right-3 z-40 max-w-[calc(100vw-1.5rem)] sm:bottom-5 sm:right-5 lg:bottom-5">
      {open && (
        <div
          role="region"
          aria-label="Khung trò chuyện nhanh"
          className="mb-3 w-[calc(100vw-1.5rem)] max-w-[430px] overflow-hidden rounded-lg border border-cyan-400/20 bg-slate-950 shadow-[var(--shadow-app-popover)]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">Chat nhanh</p>
              <p className="text-xs text-slate-400">{user?.name ?? 'Tài khoản'} · {tab === 'global' ? 'Global' : 'Bạn bè'}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="app-icon-button"
              aria-label="Đóng chat nhanh"
              title="Thu nhỏ chat"
            >
              <X size={15} />
            </button>
          </div>

          {error && (
            <div role="alert" className="border-b border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-1 border-b border-white/10 p-2" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'global'}
              onClick={() => setTab('global')}
              className={`app-button py-1.5 ${tab === 'global' ? 'app-button-primary' : 'app-button-secondary'}`}
            >
              <MessageSquare size={15} />
              Global
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'dm'}
              onClick={openDmTab}
              className={`app-button py-1.5 relative ${tab === 'dm' ? 'app-button-primary' : 'app-button-secondary'}`}
            >
              <div className="relative flex items-center justify-center">
                <UsersRound size={15} />
                {totalUnreadCount > 0 && (
                  <span className="absolute -right-3 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-slate-950">
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </span>
                )}
              </div>
              Bạn bè
            </button>
          </div>

          {tab === 'global' ? (
            <GlobalChatPanel
              connected={chatSocket.connected}
              liveMessages={liveMessages}
              currentUserId={user?.id}
              joinGlobal={chatSocket.joinGlobal}
              sendGlobal={chatSocket.sendGlobal}
              onError={setError}
              className="h-[min(70vh,520px)] min-h-[360px] rounded-none border-0 bg-transparent p-3"
            />
          ) : (
            <div className="grid h-[min(72vh,560px)] min-h-[420px] grid-rows-[150px_minmax(0,1fr)] sm:grid-rows-[170px_minmax(0,1fr)]">
              <div className="min-h-0 border-b border-white/10 p-3">
                <DMConversationList
                  conversations={displayConversations}
                  friends={friendsQuery.data ?? []}
                  selectedUserId={selectedDmUserId}
                  onlineUserIds={chatSocket.onlineUserIds}
                  onSelect={selectDmUser}
                />
              </div>
              <DMChatWindow
                connected={chatSocket.connected}
                selectedUserId={selectedDmUserId}
                selectedUserName={selectedDmUserName}
                selectedUserEmail={selectedDmUserEmail}
                onlineUserIds={chatSocket.onlineUserIds}
                liveMessages={liveMessages}
                currentUserId={user?.id}
                sendDirect={chatSocket.sendDirect}
                onError={setError}
                className="h-full rounded-none border-0 bg-transparent p-3"
              />
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? 'Thu nhỏ cửa sổ chat' : 'Mở cửa sổ chat nhanh'}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-cyan-300/25 bg-slate-950/92 px-4 text-sm font-semibold text-cyan-100 shadow-[var(--shadow-app-popover)] backdrop-blur transition-colors hover:border-cyan-200/45 hover:bg-slate-900"
        title={open ? 'Thu nhỏ chat' : 'Mở chat nhanh'}
      >
        <span className="relative inline-flex">
          <MessageSquare size={20} />
          {totalUnreadCount > 0 ? (
            <span
              className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-slate-950"
              aria-label={`${totalUnreadCount} tin nhắn chưa đọc`}
            >
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </span>
          ) : (
            <span
              aria-label={chatSocket.connected ? 'Đã kết nối Socket.io' : 'Chưa kết nối Socket.io'}
              className={`absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full ring-2 ring-slate-950 ${chatSocket.connected ? 'bg-emerald-400' : 'bg-slate-500'}`}
            />
          )}
        </span>
        <span className="hidden sm:inline">{open ? 'Đóng' : 'Chat'}</span>
      </button>
    </div>
  );
}

function applyLocalUnreadCounts(conversations: ChatConversation[], localUnreadByUserId: Record<string, number>): ChatConversation[] {
  const knownUserIds = new Set(conversations.map((item) => item.userId));
  const rows = conversations.map((item) => ({
    ...item,
    unreadCount: localUnreadByUserId[item.userId] ?? item.unreadCount ?? 0,
  }));

  Object.entries(localUnreadByUserId).forEach(([userId, unreadCount]) => {
    if (!knownUserIds.has(userId) && unreadCount > 0) {
      rows.push({
        userId,
        userName: 'Tin nhắn mới',
        userEmail: '',
        lastMessage: 'Bạn có tin nhắn mới.',
        lastMessageAt: new Date().toISOString(),
        unreadCount,
      });
    }
  });

  return rows.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
}

function getServerUnreadCount(queryClient: ReturnType<typeof useQueryClient>, userId: string): number {
  return queryClient
    .getQueryData<ChatConversation[]>(['chat-conversations'])
    ?.find((item) => item.userId === userId)
    ?.unreadCount ?? 0;
}

function markConversationAsViewed(
  userId: string,
  setLocalUnreadByUserId: React.Dispatch<React.SetStateAction<Record<string, number>>>,
  queryClient: ReturnType<typeof useQueryClient>,
) {
  if (!userId) return;
  setLocalUnreadByUserId(prev => ({ ...prev, [userId]: 0 }));
  queryClient.setQueryData<ChatConversation[]>(['chat-conversations'], (current = []) =>
    current.map((item) => item.userId === userId ? { ...item, unreadCount: 0 } : item)
  );
  chatApi.markAsRead(userId)
    .then(() => queryClient.invalidateQueries({ queryKey: ['chat-conversations'] }))
    .catch(console.error);
}

function upsertConversation(conversations: ChatConversation[], message: ChatMessage, otherUserId: string): ChatConversation[] {
  const next = conversations.some((item) => item.userId === otherUserId)
    ? conversations.map((item) => item.userId === otherUserId
      ? {
          ...item,
          lastMessage: message.message,
          lastMessageAt: message.createdAt,
        }
      : item)
    : [
        {
          userId: otherUserId,
          userName: message.senderId === otherUserId ? message.senderName : message.receiverName ?? 'Bạn bè',
          userEmail: message.senderId === otherUserId ? message.senderEmail : '',
          lastMessage: message.message,
          lastMessageAt: message.createdAt,
          unreadCount: 0,
        },
        ...conversations,
      ];

  return next.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
}

function mergeMessages(history: ChatMessage[], live: ChatMessage[]): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();
  [...history, ...live].forEach((item) => byId.set(item.id, item));
  return Array.from(byId.values()).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}
