import type { ChatMessage } from '@/api/chat.api';

type MessageListProps = {
  messages: ChatMessage[];
  currentUserId?: string;
};

export const MessageList = ({ messages, currentUserId }: MessageListProps) => (
  <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
    {messages.length === 0 ? (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-500">
        Chưa có tin nhắn.
      </div>
    ) : (
      messages.map((item) => {
        const mine = item.senderId === currentUserId;
        return (
          <div key={item.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[78%] rounded-lg border px-3 py-2 ${mine ? 'border-cyan-400/25 bg-cyan-500/12' : 'border-white/10 bg-white/[0.05]'}`}>
              <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
                <span className="max-w-[160px] truncate font-medium text-slate-200">{mine ? 'Bạn' : item.senderName}</span>
                <span>{formatTime(item.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-100">{item.deleted ? 'Tin nhắn đã bị xóa' : item.message}</p>
            </div>
          </div>
        );
      })
    )}
  </div>
);

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}
