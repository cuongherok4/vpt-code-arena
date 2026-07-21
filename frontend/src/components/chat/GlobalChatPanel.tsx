import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, MessageSquare } from 'lucide-react';
import { chatApi, type ChatMessage } from '@/api/chat.api';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { MessageList } from '@/components/chat/MessageList';

type GlobalChatPanelProps = {
  connected: boolean;
  liveMessages: ChatMessage[];
  currentUserId?: string;
  joinGlobal: () => Promise<{ success: boolean; message?: string }>;
  sendGlobal: (message: string) => Promise<{ success: boolean; message?: unknown }>;
  onError: (message: string) => void;
  className?: string;
};

export const GlobalChatPanel = ({
  connected,
  liveMessages,
  currentUserId,
  joinGlobal,
  sendGlobal,
  onError,
  className,
}: GlobalChatPanelProps) => {
  const historyQuery = useQuery({
    queryKey: ['chat-global'],
    queryFn: chatApi.globalHistory,
  });

  useEffect(() => {
    if (!connected) return;
    joinGlobal().then((response) => {
      if (!response.success) onError(response.message || 'Không thể vào global chat.');
    });
  }, [connected, joinGlobal, onError]);

  const messages = mergeMessages(historyQuery.data ?? [], liveMessages.filter((item) => item.channel === 'GLOBAL'));

  return (
    <section className={`flex h-[640px] min-h-0 flex-col rounded-lg border border-white/10 bg-slate-950/70 p-4 ${className ?? ''}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-cyan-300" />
          <h2 className="font-semibold text-white">Global Chat</h2>
        </div>
        <span className={`text-xs font-medium ${connected ? 'text-emerald-300' : 'text-slate-500'}`}>
          {connected ? 'Đã kết nối' : 'Mất kết nối'}
        </span>
      </div>

      {historyQuery.isLoading ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-sm text-slate-400">
          <Loader2 size={18} className="animate-spin text-cyan-300" />
          Đang tải...
        </div>
      ) : (
        <MessageList messages={messages} currentUserId={currentUserId} onError={onError} />
      )}

      <ChatComposer disabled={!connected} placeholder="Nhắn vào cộng đồng..." onSend={async (message) => {
        const response = await sendGlobal(message);
        if (!response.success) onError(errorMessage(response.message, 'Không thể gửi tin nhắn.'));
      }} />
    </section>
  );
};

function mergeMessages(history: ChatMessage[], live: ChatMessage[]): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();
  [...history, ...live].forEach((item) => byId.set(item.id, item));
  return Array.from(byId.values()).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

function errorMessage(value: unknown, fallback: string): string {
  return typeof value === 'string' && value ? value : fallback;
}
