import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DoorOpen, Loader2 } from 'lucide-react';
import { chatApi, type ChatMessage } from '@/api/chat.api';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { MessageList } from '@/components/chat/MessageList';

type RoomChatPanelProps = {
  connected: boolean;
  liveMessages: ChatMessage[];
  currentUserId?: string;
  joinRoom: (roomId: string) => Promise<{ success: boolean; message?: string }>;
  leaveRoom: (roomId: string) => Promise<{ success: boolean }>;
  sendRoom: (roomId: string, message: string) => Promise<{ success: boolean; message?: unknown }>;
  onError: (message: string) => void;
};

export const RoomChatPanel = ({ connected, liveMessages, currentUserId, joinRoom, leaveRoom, sendRoom, onError }: RoomChatPanelProps) => {
  const [roomId, setRoomId] = useState('');
  const activeRoomId = roomId.trim();

  const historyQuery = useQuery({
    queryKey: ['chat-room', activeRoomId],
    queryFn: () => chatApi.roomHistory(activeRoomId),
    enabled: Boolean(activeRoomId),
  });

  useEffect(() => {
    if (!connected || !activeRoomId) return;
    joinRoom(activeRoomId).then((response) => {
      if (!response.success) onError(response.message || 'Không thể vào room chat.');
    });
    return () => {
      leaveRoom(activeRoomId);
    };
  }, [activeRoomId, connected, joinRoom, leaveRoom, onError]);

  const messages = mergeMessages(
    historyQuery.data ?? [],
    liveMessages.filter((item) => item.channel === 'ROOM' && item.roomId === activeRoomId),
  );

  return (
    <section className="flex h-[640px] min-h-0 flex-col rounded-lg border border-white/10 bg-slate-950/70 p-4">
      <div className="mb-4 flex items-center gap-2">
        <DoorOpen size={18} className="text-amber-300" />
        <h2 className="font-semibold text-white">Room Chat</h2>
      </div>
      <input
        value={roomId}
        onChange={(event) => setRoomId(event.target.value)}
        className="mb-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-300/50"
        placeholder="Room UUID"
      />

      {historyQuery.isLoading ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-sm text-slate-400">
          <Loader2 size={18} className="animate-spin text-amber-300" />
          Đang tải...
        </div>
      ) : (
        <MessageList messages={messages} currentUserId={currentUserId} />
      )}

      <ChatComposer disabled={!connected || !activeRoomId} placeholder="Nhắn trong phòng..." onSend={async (message) => {
        const response = await sendRoom(activeRoomId, message);
        if (!response.success) onError(errorMessage(response.message, 'Không thể gửi tin nhắn room.'));
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
