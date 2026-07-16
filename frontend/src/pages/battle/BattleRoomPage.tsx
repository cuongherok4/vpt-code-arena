import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Copy, Loader2, LogOut, Play, Radio, Shield, Swords, Users } from 'lucide-react';
import { battleApi, type BattleMemberDto, type BattleRoomDto } from '@/api/battle.api';
import { useBattleSocket } from '@/hooks/useBattleSocket';

export const BattleRoomPage = () => {
  const roomId = getRoomIdFromPath();
  const queryClient = useQueryClient();
  const currentUserId = localStorage.getItem('userId') || '3fa85f64-5717-4562-b3fc-2c963f66afa6';
  const [readyByUser, setReadyByUser] = useState<Record<string, boolean>>({});
  const [socketError, setSocketError] = useState('');

  const roomQuery = useQuery({
    queryKey: ['battle-room', roomId],
    queryFn: () => battleApi.getRoom(roomId!),
    enabled: !!roomId,
  });

  const refreshRoom = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['battle-room', roomId] });
    queryClient.invalidateQueries({ queryKey: ['battle-rooms'] });
  }, [queryClient, roomId]);

  const handleReadyUpdate = useCallback((event: { userId: string; isReady: boolean }) => {
    setReadyByUser(prev => ({ ...prev, [event.userId]: event.isReady }));
  }, []);

  const { connected, setReady } = useBattleSocket({
    roomId,
    onJoined: refreshRoom,
    onMemberChange: refreshRoom,
    onStarted: refreshRoom,
    onReadyUpdate: handleReadyUpdate,
    onError: setSocketError,
  });

  const joinMutation = useMutation({
    mutationFn: () => battleApi.joinRoom(roomId!),
    onSuccess: refreshRoom,
  });

  const startMutation = useMutation({
    mutationFn: () => battleApi.startRoom(roomId!),
    onSuccess: (room) => {
      queryClient.setQueryData(['battle-room', roomId], room);
      refreshRoom();
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => battleApi.leaveRoom(roomId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['battle-rooms'] });
      window.location.href = '/battle';
    },
  });

  const room = roomQuery.data;
  const members = useMemo(() => mergeReady(room, readyByUser), [room, readyByUser]);
  const me = members.find(member => member.userId === currentUserId);
  const isCreator = room?.creatorId === currentUserId;
  const canStart = !!room && room.status === 'WAITING' && isCreator && room.memberCount >= 2;

  const toggleReady = () => {
    const nextReady = !(me?.ready ?? false);
    setReadyByUser(prev => ({ ...prev, [currentUserId]: nextReady }));
    setReady(nextReady);
  };

  if (roomQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-32 text-sm text-slate-400">
        <Loader2 size={18} className="animate-spin text-violet-300" />
        Đang tải phòng battle...
      </div>
    );
  }

  if (!room) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-red-500/20 bg-red-500/10 p-5 text-red-200">
        Không tìm thấy phòng battle.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {me && room.status === 'WAITING' ? (
          <button
            type="button"
            onClick={() => leaveMutation.mutate()}
            disabled={leaveMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white disabled:opacity-50"
          >
            {leaveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <ArrowLeft size={16} />}
            Rời về lobby
          </button>
        ) : (
          <a href="/battle" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
            <ArrowLeft size={16} />
            Lobby
          </a>
        )}
        <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
          connected ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
        }`}>
          <Radio size={16} />
          {connected ? 'Realtime connected' : 'Realtime offline'}
        </div>
      </div>

      <section className="rounded-lg border border-white/10 bg-slate-950/70 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-bold text-white">{room.name}</h1>
              <span className="rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-xs font-semibold text-violet-200">{room.status}</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
              <span>{room.numProblems} bài</span>
              <span>{room.timeLimitMin} phút</span>
              <span>{room.difficulty || 'Mixed'}</span>
              <span>{room.topic || 'all topics'}</span>
            </div>
            <div className="mt-3 flex max-w-full flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Mã phòng</span>
              <code className="break-all rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-violet-200">
                {room.id}
              </code>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(room.id)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <Copy size={16} />
            Copy mã phòng
          </button>
        </div>
      </section>

      {socketError && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">{socketError}</div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-lg border border-white/10 bg-slate-950/70">
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-violet-300" />
              <h2 className="font-semibold text-white">Thành viên</h2>
            </div>
            <span className="text-sm text-slate-400">{members.length}/{room.maxMembers}</span>
          </div>
          <div className="divide-y divide-white/10">
            {members.map(member => (
              <MemberRow key={member.userId} member={member} current={member.userId === currentUserId} />
            ))}
          </div>
        </section>

        <aside className="space-y-3">
          {room.status === 'WAITING' && (
            <>
              {!me && (
                <button
                  type="button"
                  onClick={() => joinMutation.mutate()}
                  disabled={joinMutation.isPending}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-400 disabled:opacity-50"
                >
                  {joinMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Swords size={16} />}
                  Join phòng
                </button>
              )}

              {me && (
                <>
                  <button
                    type="button"
                    onClick={toggleReady}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold ${
                      me.ready ? 'bg-emerald-500 text-white hover:bg-emerald-400' : 'bg-white/10 text-slate-100 hover:bg-white/15'
                    }`}
                  >
                    <CheckCircle2 size={16} />
                    {me.ready ? 'Đã sẵn sàng' : 'Sẵn sàng'}
                  </button>
                  <button
                    type="button"
                    onClick={() => leaveMutation.mutate()}
                    disabled={leaveMutation.isPending}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {leaveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                    Rời phòng
                  </button>
                </>
              )}

              {isCreator && (
                <button
                  type="button"
                  onClick={() => startMutation.mutate()}
                  disabled={!canStart || startMutation.isPending}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-100 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {startMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                  Bắt đầu
                </button>
              )}

              <p className="text-xs leading-5 text-slate-500">Chủ phòng có thể bắt đầu khi có ít nhất 2 thành viên. Trạng thái ready sync realtime giữa các client.</p>
            </>
          )}

          {room.status !== 'WAITING' && (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              Trận đã bắt đầu. Arena coding sẽ được hoàn thiện ở 4.6.
            </div>
          )}
        </aside>
      </div>

      {room.problems.length > 0 && (
        <section className="rounded-lg border border-white/10 bg-slate-950/70">
          <div className="border-b border-white/10 p-4 font-semibold text-white">Bài trong trận</div>
          <div className="grid gap-2 p-4 md:grid-cols-2">
            {room.problems.map(problem => (
              <div key={problem.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="text-sm font-semibold text-white">#{problem.order} {problem.title}</div>
                <div className="mt-1 text-xs text-slate-500">{problem.difficulty} · {problem.topic}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

function mergeReady(room: BattleRoomDto | undefined, readyByUser: Record<string, boolean>): BattleMemberDto[] {
  return (room?.members ?? []).map(member => ({
    ...member,
    ready: readyByUser[member.userId] ?? member.ready,
  }));
}

function getRoomIdFromPath(): string | undefined {
  const match = window.location.pathname.match(/\/battle\/rooms\/([^/]+)/);
  return match?.[1];
}

const MemberRow = ({ member, current }: { member: BattleMemberDto; current: boolean }) => (
  <div className="flex items-center justify-between gap-3 p-4">
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <p className="truncate font-medium text-white">{member.name || member.userId}</p>
        {current && <span className="rounded border border-white/10 px-1.5 py-0.5 text-[11px] text-slate-400">Bạn</span>}
        {member.creator && <Shield size={14} className="text-amber-300" />}
      </div>
      <p className="mt-1 truncate text-xs text-slate-500">{member.userId}</p>
    </div>
    <span className={`shrink-0 rounded-md border px-2 py-1 text-xs font-semibold ${
      member.ready ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-white/10 bg-white/5 text-slate-400'
    }`}>
      {member.ready ? 'Ready' : 'Waiting'}
    </span>
  </div>
);

export default BattleRoomPage;
