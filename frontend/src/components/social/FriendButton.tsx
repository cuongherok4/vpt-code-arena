import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Clock, UserPlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { friendsApi, type FriendStatus } from '@/api/friends.api';

type FriendButtonProps = {
  userId: string;
  status?: FriendStatus | null;
  size?: 'sm' | 'md';
  onError?: (message: string) => void;
  onStatusChange?: (status: FriendStatus) => void;
};

export const FriendButton = ({ userId, status = 'NONE', size = 'md', onError, onStatusChange }: FriendButtonProps) => {
  const queryClient = useQueryClient();
  const [localStatus, setLocalStatus] = useState<FriendStatus | null>(status);

  useEffect(() => {
    setLocalStatus(status);
  }, [status]);

  const updateSearchStatus = (nextStatus: FriendStatus) => {
    queryClient.setQueriesData({ queryKey: ['friend-search'] }, (oldData) => {
      if (!Array.isArray(oldData)) {
        return oldData;
      }

      return oldData.map((user) => (user?.id === userId ? { ...user, friendStatus: nextStatus } : user));
    });
  };

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['friends'] });
    queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    queryClient.invalidateQueries({ queryKey: ['friend-search'] });
  };

  const sendMutation = useMutation({
    mutationFn: () => friendsApi.sendRequest(userId),
    onMutate: () => {
      setLocalStatus('PENDING_OUTGOING');
      updateSearchStatus('PENDING_OUTGOING');
      onStatusChange?.('PENDING_OUTGOING');
    },
    onSuccess: refresh,
    onError: () => {
      setLocalStatus(status);
      updateSearchStatus(status ?? 'NONE');
      onStatusChange?.(status ?? 'NONE');
      onError?.('Không thể gửi lời mời kết bạn.');
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => friendsApi.removeFriend(userId),
    onMutate: () => {
      setLocalStatus('NONE');
      updateSearchStatus('NONE');
      onStatusChange?.('NONE');
    },
    onSuccess: refresh,
    onError: () => {
      setLocalStatus(status);
      updateSearchStatus(status ?? 'NONE');
      onStatusChange?.(status ?? 'NONE');
      onError?.('Không thể xóa bạn.');
    },
  });

  const compact = size === 'sm';
  const baseClass = `inline-flex items-center justify-center gap-2 rounded-lg border font-medium transition-colors disabled:opacity-60 ${
    compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'
  }`;

  if (localStatus === 'FRIENDS') {
    return (
      <button
        type="button"
        onClick={() => removeMutation.mutate()}
        disabled={removeMutation.isPending}
        className={`${baseClass} border-red-500/20 bg-red-500/10 text-red-200 hover:bg-red-500/15`}
      >
        <X size={compact ? 14 : 16} />
        Xóa bạn
      </button>
    );
  }

  if (localStatus === 'PENDING_OUTGOING') {
    return (
      <span className={`${baseClass} border-amber-500/20 bg-amber-500/10 text-amber-200`}>
        <Clock size={compact ? 14 : 16} />
        Đã gửi
      </span>
    );
  }

  if (localStatus === 'PENDING_INCOMING') {
    return (
      <span className={`${baseClass} border-cyan-500/20 bg-cyan-500/10 text-cyan-200`}>
        <Check size={compact ? 14 : 16} />
        Đang chờ bạn duyệt
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => sendMutation.mutate()}
      disabled={sendMutation.isPending}
      className={`${baseClass} border-cyan-500/20 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/15`}
    >
      <UserPlus size={compact ? 14 : 16} />
      Kết bạn
    </button>
  );
};
