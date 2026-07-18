import { MessageCirclePlus } from 'lucide-react';
import { OnlineIndicator } from '@/components/chat/OnlineIndicator';
import type { ChatConversation } from '@/api/chat.api';

type DMConversationListProps = {
  conversations: ChatConversation[];
  selectedUserId: string;
  onlineUserIds: Set<string>;
  onSelect: (userId: string) => void;
};

export const DMConversationList = ({ conversations, selectedUserId, onlineUserIds, onSelect }: DMConversationListProps) => (
  <div className="min-h-0 overflow-y-auto">
    {conversations.length === 0 ? (
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-500">
        <MessageCirclePlus size={20} className="mb-2 text-cyan-300" />
        Chưa có hội thoại.
      </div>
    ) : (
      <div className="space-y-2">
        {conversations.map((item) => (
          <button
            key={item.userId}
            type="button"
            onClick={() => onSelect(item.userId)}
            className={`w-full rounded-lg border p-3 text-left transition-colors ${
              selectedUserId === item.userId
                ? 'border-cyan-400/40 bg-cyan-500/10'
                : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
            }`}
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-sm font-medium text-white">{item.userName}</span>
              <OnlineIndicator online={onlineUserIds.has(item.userId)} />
            </div>
            <p className="truncate text-xs text-slate-500">{item.lastMessage}</p>
          </button>
        ))}
      </div>
    )}
  </div>
);
