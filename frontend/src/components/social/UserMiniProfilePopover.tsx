import { MessageSquare, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Friend, UserSearchResult } from '@/api/friends.api';
import { FriendButton } from './FriendButton';

type MiniUser = Partial<Friend> & Partial<UserSearchResult> & {
  id: string;
  name: string;
  email?: string | null;
};

type UserMiniProfilePopoverProps = {
  user: MiniUser;
  onError?: (message: string) => void;
};

export const UserMiniProfilePopover = ({ user, onError }: UserMiniProfilePopoverProps) => {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/90 p-4 shadow-xl">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-200">
          <UserRound size={22} />
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-white">{user.name}</p>
          <p className="truncate text-xs text-slate-400">ID {user.publicId ?? '----------'} · {user.email ?? 'Email ẩn'}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          to={`/chat?dm=${user.id}`}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/5"
        >
          <MessageSquare size={16} />
          Nhắn tin
        </Link>
        <FriendButton userId={user.id} status={user.friendStatus ?? 'FRIENDS'} onError={onError} />
      </div>
    </div>
  );
};
