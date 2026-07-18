import { Check, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type React from 'react';
import { friendsApi, type FriendRequestItem, type FriendRequests } from '@/api/friends.api';

type FriendRequestsPanelProps = {
  requests?: FriendRequests;
  loading?: boolean;
  onError?: (message: string) => void;
};

export const FriendRequestsPanel = ({ requests, loading, onError }: FriendRequestsPanelProps) => {
  const queryClient = useQueryClient();
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['friends'] });
    queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    queryClient.invalidateQueries({ queryKey: ['friend-search'] });
  };

  const acceptMutation = useMutation({
    mutationFn: friendsApi.acceptRequest,
    onSuccess: refresh,
    onError: () => onError?.('Không thể chấp nhận lời mời.'),
  });

  const rejectMutation = useMutation({
    mutationFn: friendsApi.rejectRequest,
    onSuccess: refresh,
    onError: () => onError?.('Không thể từ chối lời mời.'),
  });

  const incoming = requests?.incoming ?? [];
  const outgoing = requests?.outgoing ?? [];

  return (
    <section className="rounded-lg border border-white/10 bg-slate-950/70 p-4">
      <h2 className="font-semibold text-white">Lời mời kết bạn</h2>
      {loading ? (
        <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">Đang tải lời mời...</div>
      ) : (
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <RequestColumn
            title="Lời mời đến"
            empty="Chưa có lời mời đến."
            requests={incoming}
            renderActions={(request) => (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => acceptMutation.mutate(request.requestId)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/20"
                  title="Chấp nhận"
                >
                  <Check size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => rejectMutation.mutate(request.requestId)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15 text-red-200 hover:bg-red-500/20"
                  title="Từ chối"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          />
          <RequestColumn
            title="Đã gửi"
            empty="Bạn chưa gửi lời mời nào."
            requests={outgoing}
            renderActions={() => <span className="rounded-lg bg-amber-500/10 px-2 py-1 text-xs text-amber-200">Đang chờ</span>}
          />
        </div>
      )}
    </section>
  );
};

type RequestColumnProps = {
  title: string;
  empty: string;
  requests: FriendRequestItem[];
  renderActions: (request: FriendRequestItem) => React.ReactNode;
};

function RequestColumn({ title, empty, requests, renderActions }: RequestColumnProps) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-slate-300">{title}</h3>
      {requests.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-500">{empty}</div>
      ) : (
        <div className="space-y-2">
          {requests.map((request) => (
            <div key={request.requestId} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{request.user.name}</p>
                <p className="truncate text-xs text-slate-500">ID {request.user.publicId} · {request.user.email ?? 'Email ẩn'}</p>
              </div>
              {renderActions(request)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
