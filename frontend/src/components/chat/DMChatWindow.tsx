import { useQuery } from '@tanstack/react-query';
import { Loader2, MessagesSquare } from 'lucide-react';
import { chatApi, type ChatMessage } from '@/api/chat.api';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { MessageList } from '@/components/chat/MessageList';
import { OnlineIndicator } from '@/components/chat/OnlineIndicator';

type DMChatWindowProps = {
  connected: boolean;
  selectedUserId: string;
  selectedUserName?: string;
  selectedUserEmail?: string | null;
  onlineUserIds: Set<string>;
  liveMessages: ChatMessage[];
  currentUserId?: string;
  sendDirect: (toUserId: string, message: string) => Promise<{ success: boolean; message?: unknown }>;
  onError: (message: string) => void;
};

export const DMChatWindow = ({
  connected,
  selectedUserId,
  selectedUserName,
  selectedUserEmail,
  onlineUserIds,
  liveMessages,
  currentUserId,
  sendDirect,
  onError,
}: DMChatWindowProps) => {
  const activeUserId = selectedUserId.trim();
  const historyQuery = useQuery({
    queryKey: ['chat-dm', activeUserId],
    queryFn: () => chatApi.directHistory(activeUserId),
    enabled: Boolean(activeUserId),
  });

  const messages = mergeMessages(
    historyQuery.data ?? [],
    liveMessages.filter((item) => isDirectBetween(item, currentUserId, activeUserId)),
  );

  return (
    <section className="flex h-[640px] min-h-0 flex-col rounded-lg border border-white/10 bg-slate-950/70 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <MessagesSquare size={18} className="shrink-0 text-cyan-300" />
          <div className="min-w-0">
            <h2 className="truncate font-semibold text-white">{selectedUserName ?? 'Chọn bạn bè để nhắn tin'}</h2>
            {selectedUserEmail && <p className="truncate text-xs text-slate-500">{selectedUserEmail}</p>}
          </div>
        </div>
        {activeUserId && <OnlineIndicator online={onlineUserIds.has(activeUserId)} />}
      </div>

      {!activeUserId ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-slate-400">
          Chọn một người bạn ở danh sách bên trái để bắt đầu nhắn tin.
        </div>
      ) : historyQuery.isLoading ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-sm text-slate-400">
          <Loader2 size={18} className="animate-spin text-cyan-300" />
          Đang tải...
        </div>
      ) : (
        <MessageList messages={messages} currentUserId={currentUserId} onError={onError} />
      )}

      <ChatComposer disabled={!connected || !activeUserId} placeholder="Nhắn riêng..." onSend={async (message) => {
        const response = await sendDirect(activeUserId, message);
        if (!response.success) onError(errorMessage(response.message, 'Không thể gửi tin nhắn riêng.'));
      }} />
    </section>
  );
};

function isDirectBetween(message: ChatMessage, currentUserId: string | undefined, selectedUserId: string): boolean {
  if (message.channel !== 'DM' || !currentUserId || !selectedUserId) return false;
  return message.senderId === selectedUserId
    || message.receiverId === selectedUserId
    || (message.senderId === currentUserId && message.receiverId === selectedUserId);
}

function errorMessage(value: unknown, fallback: string): string {
  return typeof value === 'string' && value ? value : fallback;
}

function mergeMessages(history: ChatMessage[], live: ChatMessage[]): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();
  [...history, ...live].forEach((item) => byId.set(item.id, item));
  return Array.from(byId.values()).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}
