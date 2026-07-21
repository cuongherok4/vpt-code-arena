import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Lock, RefreshCw } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { chatApi, type ChatMessage } from '@/api/chat.api';
import { friendsApi } from '@/api/friends.api';
import { DMChatWindow } from '@/components/chat/DMChatWindow';
import { DMConversationList } from '@/components/chat/DMConversationList';
import { GlobalChatPanel } from '@/components/chat/GlobalChatPanel';
import { useChatSocket } from '@/hooks/useChatSocket';
import { useAuthStore } from '@/stores/authStore';

const tabs = [
  { value: 'global', label: 'Global' },
  { value: 'dm', label: 'DM' },
] as const;

type ChatTab = (typeof tabs)[number]['value'];

export const ChatPage = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuthStore();
  const initialDmUserId = searchParams.get('dm') ?? '';
  const initialTab = searchParams.get('tab') === 'dm' ? 'dm' : 'global';
  const [tab, setTab] = useState<ChatTab>(initialDmUserId || initialTab === 'dm' ? 'dm' : 'global');
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const [selectedDmUserId, setSelectedDmUserId] = useState(initialDmUserId);
  const [error, setError] = useState('');

  const conversationsQuery = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: chatApi.conversations,
    enabled: isAuthenticated,
  });

  const friendsQuery = useQuery({
    queryKey: ['friends'],
    queryFn: friendsApi.friends,
    enabled: isAuthenticated,
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
  });
  const refetchConversations = conversationsQuery.refetch;

  useEffect(() => {
    if (!initialDmUserId) return;
    setTab('dm');
    setSelectedDmUserId(initialDmUserId);
  }, [initialDmUserId]);

  const appendMessage = useCallback((message: ChatMessage) => {
    setLiveMessages((prev) => prev.some((item) => item.id === message.id) ? prev : [...prev, message]);
    if (message.channel === 'GLOBAL') {
      queryClient.setQueryData<ChatMessage[]>(['chat-global'], (current = []) => mergeMessages(current, [message]));
    }
    if (message.channel === 'ROOM' && message.roomId) {
      queryClient.setQueryData<ChatMessage[]>(['chat-room', message.roomId], (current = []) => mergeMessages(current, [message]));
    }
    if (message.channel === 'DM') {
      const otherUserId = message.senderId === user?.id ? message.receiverId : message.senderId;
      if (otherUserId) {
        queryClient.setQueryData<ChatMessage[]>(['chat-dm', otherUserId], (current = []) => mergeMessages(current, [message]));
      }
    }
    if (message.channel === 'DM') refetchConversations();
  }, [queryClient, refetchConversations, user?.id]);

  const showError = useCallback((message: string) => setError(message), []);
  const chatSocket = useChatSocket({
    onMessage: appendMessage,
    onDirectMessage: appendMessage,
    onError: showError,
  });

  const selectedFriend = friendsQuery.data?.find((friend) => friend.id === selectedDmUserId);
  const selectedConversation = conversationsQuery.data?.find((conversation) => conversation.userId === selectedDmUserId);
  const selectedDmUserName = selectedFriend?.name ?? selectedConversation?.userName;
  const selectedDmUserEmail = selectedFriend?.email ?? selectedConversation?.userEmail;
  const selectDmUser = useCallback((userId: string) => {
    setSelectedDmUserId(userId);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('dm', userId);
      return next;
    });
  }, [setSearchParams]);

  useEffect(() => {
    if (!chatSocket.connected) return;
    chatSocket.joinGlobal().then((response) => {
      if (!response.success) showError(errorMessage(response.message, 'Không thể vào global chat.'));
    });
  }, [chatSocket.connected, chatSocket.joinGlobal, showError]);

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-xl rounded-lg border border-white/10 bg-slate-950/70 p-6 text-center">
        <Lock size={32} className="mx-auto mb-3 text-cyan-300" />
        <h1 className="text-xl font-semibold text-white">Cần đăng nhập để dùng chat</h1>
        <p className="mt-2 text-sm text-slate-400">Chat realtime dùng JWT để lưu tin nhắn và đồng bộ online status.</p>
        <Link to="/login" className="mt-5 inline-flex rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400">
          Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Community Chat</h1>
          <p className="mt-1 text-sm text-slate-400">Global và direct message theo thời gian thực.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-300">
          <span className={`h-2.5 w-2.5 rounded-full ${chatSocket.connected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
          {chatSocket.connected ? 'Realtime online' : 'Đang kết nối'}
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">
          <span className="flex items-center gap-2"><AlertCircle size={16} /> {error}</span>
          <button type="button" onClick={() => setError('')} className="text-amber-100 hover:text-white">Đóng</button>
        </div>
      )}

      <div className="mb-4 flex rounded-lg border border-white/10 bg-white/[0.03] p-1">
        {tabs.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setTab(item.value)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === item.value ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'global' && (
        <GlobalChatPanel
          connected={chatSocket.connected}
          liveMessages={liveMessages}
          currentUserId={user?.id}
          joinGlobal={chatSocket.joinGlobal}
          sendGlobal={chatSocket.sendGlobal}
          onError={showError}
        />
      )}

      {tab === 'dm' && (
        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="flex h-[640px] min-h-0 flex-col rounded-lg border border-white/10 bg-slate-950/70 p-4">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="font-semibold text-white">Hội thoại</h2>
              <button
                type="button"
                onClick={() => conversationsQuery.refetch()}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-300 hover:bg-white/5"
                title="Làm mới"
              >
                <RefreshCw size={16} className={conversationsQuery.isFetching ? 'animate-spin' : ''} />
              </button>
            </div>
            <DMConversationList
              conversations={conversationsQuery.data ?? []}
              friends={friendsQuery.data ?? []}
              selectedUserId={selectedDmUserId}
              onlineUserIds={chatSocket.onlineUserIds}
              onSelect={selectDmUser}
            />
          </aside>
          <DMChatWindow
            connected={chatSocket.connected}
            selectedUserId={selectedDmUserId}
            selectedUserName={selectedDmUserName}
            selectedUserEmail={selectedDmUserEmail}
            onlineUserIds={chatSocket.onlineUserIds}
            liveMessages={liveMessages}
            currentUserId={user?.id}
            sendDirect={chatSocket.sendDirect}
            onError={showError}
          />
        </div>
      )}
    </div>
  );
};

export default ChatPage;

function mergeMessages(history: ChatMessage[], live: ChatMessage[]): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();
  [...history, ...live].forEach((item) => byId.set(item.id, item));
  return Array.from(byId.values()).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

function errorMessage(value: unknown, fallback: string): string {
  return typeof value === 'string' && value ? value : fallback;
}
