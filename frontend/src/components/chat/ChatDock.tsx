import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, UsersRound, X } from 'lucide-react';
import { chatApi, type ChatMessage } from '@/api/chat.api';
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
  const [error, setError] = useState('');

  const conversationsQuery = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: chatApi.conversations,
    enabled: isAuthenticated && open,
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
      }
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    }
  }, [queryClient, user?.id]);

  const chatSocket = useChatSocket({
    onMessage: appendMessage,
    onDirectMessage: appendMessage,
    onError: setError,
  });

  if (!isAuthenticated) return null;

  const selectedFriend = friendsQuery.data?.find((friend) => friend.id === selectedDmUserId);
  const selectedConversation = conversationsQuery.data?.find((conversation) => conversation.userId === selectedDmUserId);
  const selectedDmUserName = selectedFriend?.name ?? selectedConversation?.userName;
  const selectedDmUserEmail = selectedFriend?.email ?? selectedConversation?.userEmail;

  return (
    <div className="fixed bottom-20 right-3 z-40 sm:bottom-5 sm:right-5 lg:bottom-5">
      {open && (
        <div className="mb-3 w-[calc(100vw-1.5rem)] max-w-[430px] overflow-hidden rounded-lg border border-cyan-400/20 bg-slate-950 shadow-[var(--shadow-app-popover)]">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">Chat nhanh</p>
              <p className="text-xs text-slate-500">{user?.name ?? 'Tài khoản'} · {tab === 'global' ? 'Global' : 'Bạn bè'}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="app-icon-button"
              title="Thu nhỏ chat"
            >
              <X size={15} />
            </button>
          </div>

          {error && (
            <div className="border-b border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-1 border-b border-white/10 p-2">
            <button
              type="button"
              onClick={() => setTab('global')}
              className={`app-button py-1.5 ${tab === 'global' ? 'app-button-primary' : 'app-button-secondary'}`}
            >
              <MessageSquare size={15} />
              Global
            </button>
            <button
              type="button"
              onClick={() => setTab('dm')}
              className={`app-button py-1.5 ${tab === 'dm' ? 'app-button-primary' : 'app-button-secondary'}`}
            >
              <UsersRound size={15} />
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
              className="h-[min(70vh,520px)] rounded-none border-0 bg-transparent p-3"
            />
          ) : (
            <div className="grid h-[min(70vh,560px)] min-h-0 grid-rows-[170px_minmax(0,1fr)]">
              <div className="min-h-0 border-b border-white/10 p-3">
                <DMConversationList
                  conversations={conversationsQuery.data ?? []}
                  friends={friendsQuery.data ?? []}
                  selectedUserId={selectedDmUserId}
                  onlineUserIds={chatSocket.onlineUserIds}
                  onSelect={setSelectedDmUserId}
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
        onClick={() => setOpen((value) => !value)}
        className="flex h-12 min-w-12 items-center justify-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400 px-4 text-sm font-bold text-slate-950 shadow-[var(--shadow-app-popover)] transition-colors hover:bg-cyan-300"
        title={open ? 'Thu nhỏ chat' : 'Mở chat nhanh'}
      >
        <span className="relative inline-flex">
          <MessageSquare size={20} />
          <span className={`absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full ring-2 ring-cyan-400 ${chatSocket.connected ? 'bg-emerald-500' : 'bg-slate-500'}`} />
        </span>
        <span className="hidden sm:inline">{open ? 'Đóng' : 'Chat'}</span>
      </button>
    </div>
  );
}

function mergeMessages(history: ChatMessage[], live: ChatMessage[]): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();
  [...history, ...live].forEach((item) => byId.set(item.id, item));
  return Array.from(byId.values()).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}
