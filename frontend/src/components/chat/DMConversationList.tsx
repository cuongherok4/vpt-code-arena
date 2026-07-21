import { useState } from 'react';
import { MessageCirclePlus, Search, UserRound } from 'lucide-react';
import type { ChatConversation } from '@/api/chat.api';
import type { Friend } from '@/api/friends.api';

type DMConversationListProps = {
  conversations: ChatConversation[];
  friends: Friend[];
  selectedUserId: string;
  onlineUserIds: Set<string>;
  onSelect: (userId: string) => void;
  className?: string;
};

export const DMConversationList = ({
  conversations,
  friends,
  selectedUserId,
  onlineUserIds,
  onSelect,
  className = '',
}: DMConversationListProps) => {
  const [filter, setFilter] = useState('');

  const conversationByUserId = new Map(conversations.map((item) => [item.userId, item]));
  const friendRows = friends.map((friend) => ({
    userId: friend.id,
    userName: friend.name,
    userEmail: friend.email,
    lastMessage: conversationByUserId.get(friend.id)?.lastMessage ?? 'Bắt đầu nhắn tin...',
    lastMessageAt: conversationByUserId.get(friend.id)?.lastMessageAt ?? '',
    unreadCount: conversationByUserId.get(friend.id)?.unreadCount ?? 0,
  }));

  const otherConversations = conversations.filter(
    (item) => !friends.some((friend) => friend.id === item.userId)
  );

  const allRows = [...friendRows, ...otherConversations]
    .sort((a, b) => messageTime(b.lastMessageAt) - messageTime(a.lastMessageAt));

  const filteredRows = filter.trim()
    ? allRows.filter(
        (item) =>
          item.userName.toLowerCase().includes(filter.toLowerCase()) ||
          item.userEmail?.toLowerCase().includes(filter.toLowerCase())
      )
    : allRows;

  return (
    <div className={`flex flex-col h-full min-h-0 ${className}`}>
      {/* Search Bar */}
      <div className="mb-2 shrink-0">
        <div className="relative flex items-center rounded-lg border border-white/10 bg-slate-900/80 px-2.5 py-1.5 focus-within:border-cyan-400/50">
          <Search size={14} className="shrink-0 text-slate-400" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Tìm bạn bè..."
            aria-label="Tìm bạn bè trong danh sách"
            className="ml-2 w-full bg-transparent text-xs text-white placeholder-slate-400 outline-none"
          />
        </div>
      </div>

      {/* List Container */}
      <div
        role="listbox"
        aria-label="Danh sách bạn bè"
        className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-0.5 custom-scrollbar"
      >
        {filteredRows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-800 bg-slate-900/30 p-4 text-center text-xs text-slate-400">
            <MessageCirclePlus size={20} className="mx-auto mb-2 text-cyan-300/70" />
            {filter ? 'Không tìm thấy bạn bè phù hợp' : 'Chưa có bạn bè trong danh sách'}
          </div>
        ) : (
          filteredRows.map((item) => {
            const isSelected = selectedUserId === item.userId;
            const isOnline = onlineUserIds.has(item.userId);

            return (
              <button
                key={item.userId}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelect(item.userId)}
                className={`group w-full flex items-center gap-2.5 rounded-xl border p-2 text-left transition-all duration-150 focus-visible:outline-none ${
                  isSelected
                    ? 'border-cyan-400/40 bg-cyan-400/[0.12] text-cyan-100 ring-1 ring-cyan-400/20 shadow-sm'
                    : 'border-white/5 bg-white/[0.025] text-slate-300 hover:border-white/15 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                {/* Avatar with Status */}
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-200 font-semibold text-xs border border-cyan-500/20">
                  {item.userName.charAt(0).toUpperCase() || <UserRound size={16} />}
                  <span
                    aria-label={isOnline ? 'Đang online' : 'Ngoại tuyến'}
                    className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-slate-950 ${
                      isOnline ? 'bg-emerald-400 ring-2 ring-emerald-400/30 animate-pulse' : 'bg-slate-600'
                    }`}
                  />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-xs font-semibold leading-tight">{item.userName}</span>
                    {item.unreadCount > 0 && (
                      <span
                        className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-bold leading-none text-white shadow-sm ring-1 ring-cyan-400/50"
                        aria-label={`${item.unreadCount} tin nhắn chưa đọc`}
                      >
                        {item.unreadCount > 99 ? '99+' : item.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[11px] leading-tight text-slate-400 mt-0.5">
                    {item.lastMessage}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

function messageTime(value?: string): number {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}
