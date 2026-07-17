import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Copy, Loader2, LogOut, Play, Radio, Shield, Swords, Trophy, Users } from 'lucide-react';
import { battleApi, type BattleLeaderboardEntryDto, type BattleMemberDto, type BattleRoomDto, type BattleSubmissionDto } from '@/api/battle.api';
import { useBattleSocket } from '@/hooks/useBattleSocket';
import BattleArenaPage from './BattleArenaPage';
import CountdownTimer from '@/components/battle/CountdownTimer';
import RealTimeLeaderboard from '@/components/battle/RealTimeLeaderboard';

export const BattleRoomPage = () => {
  const roomId = getRoomIdFromPath();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem('userId') || '3fa85f64-5717-4562-b3fc-2c963f66afa6';
  const [readyByUser, setReadyByUser] = useState<Record<string, boolean>>({});
  const [socketError, setSocketError] = useState('');
  const [leaveError, setLeaveError] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [liveLeaderboard, setLiveLeaderboard] = useState<BattleLeaderboardEntryDto[]>([]);
  const [latestSubmission, setLatestSubmission] = useState<BattleSubmissionDto | undefined>();
  const [finalLeaderboard, setFinalLeaderboard] = useState<BattleLeaderboardEntryDto[] | null>(null);

  const roomQuery = useQuery({
    queryKey: ['battle-room', roomId],
    queryFn: () => battleApi.getRoom(roomId!),
    enabled: !!roomId,
  });

  const leaderboardQuery = useQuery({
    queryKey: ['battle-leaderboard', roomId],
    queryFn: () => battleApi.getLeaderboard(roomId!),
    enabled: !!roomId && (roomQuery.data?.status === 'IN_PROGRESS' || roomQuery.data?.status === 'FINISHED'),
    refetchInterval: roomQuery.data?.status === 'IN_PROGRESS' ? 10000 : false,
  });

  const refreshRoom = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['battle-room', roomId] });
    queryClient.invalidateQueries({ queryKey: ['battle-rooms'] });
  }, [queryClient, roomId]);

  const handleReadyUpdate = useCallback((event: { userId: string; isReady: boolean }) => {
    setReadyByUser(prev => ({ ...prev, [event.userId]: event.isReady }));
  }, []);

  const handleLeaderboardUpdate = useCallback((leaderboard: unknown[]) => {
    setLiveLeaderboard(leaderboard as BattleLeaderboardEntryDto[]);
  }, []);

  const handleSubmissionResult = useCallback((result: {
    submissionId: string;
    problemId: string;
    result: string;
    points: number;
    executionTime?: number | null;
    output?: string | null;
    errorOutput?: string | null;
  }) => {
    setLatestSubmission(prev => ({
      id: result.submissionId,
      submissionId: result.submissionId,
      roomId: roomId ?? '',
      userId: currentUserId,
      problemId: result.problemId,
      language: prev?.language ?? 'python',
      result: result.result as BattleSubmissionDto['result'],
      status: result.result as BattleSubmissionDto['result'],
      points: result.points,
      executionTime: result.executionTime,
      output: result.output ?? null,
      errorOutput: result.errorOutput ?? null,
      submittedAt: prev?.submittedAt ?? new Date().toISOString(),
    }));
    queryClient.invalidateQueries({ queryKey: ['battle-leaderboard', roomId] });
  }, [currentUserId, queryClient, roomId]);

  const handleFinished = useCallback((leaderboard: unknown[]) => {
    const finalEntries = leaderboard as BattleLeaderboardEntryDto[];
    setFinalLeaderboard(finalEntries);
    queryClient.setQueryData(['battle-leaderboard', roomId], finalEntries);
    setRemainingSeconds(0);
    refreshRoom();
  }, [queryClient, refreshRoom, roomId]);

  const { mutate: finishBattleRoom, isPending: finishingRoom } = useMutation({
    mutationFn: () => battleApi.finishRoom(roomId!),
    onSuccess: (leaderboard) => {
      setFinalLeaderboard(leaderboard);
      queryClient.setQueryData(['battle-leaderboard', roomId], leaderboard);
      setRemainingSeconds(0);
      refreshRoom();
    },
    onError: refreshRoom,
  });

  const handleTimeExpired = useCallback(() => {
    if (!roomId || finishingRoom) return;
    setRemainingSeconds(0);
    finishBattleRoom();
  }, [finishBattleRoom, finishingRoom, roomId]);

  const { connected, setReady } = useBattleSocket({
    roomId,
    onJoined: refreshRoom,
    onMemberChange: refreshRoom,
    onStarted: refreshRoom,
    onReadyUpdate: handleReadyUpdate,
    onTick: setRemainingSeconds,
    onLeaderboardUpdate: handleLeaderboardUpdate,
    onSubmissionResult: handleSubmissionResult,
    onFinished: handleFinished,
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
      queryClient.removeQueries({ queryKey: ['battle-room', roomId] });
      navigate('/battle', { replace: true });
    },
    onError: () => {
      setLeaveError('Không thể rời phòng. Kiểm tra userId hiện tại có phải thành viên phòng này không.');
    },
  });

  const room = roomQuery.data;
  const members = useMemo(() => mergeReady(room, readyByUser), [room, readyByUser]);
  const leaderboard = liveLeaderboard.length > 0 ? liveLeaderboard : (leaderboardQuery.data ?? []);
  const finalEntries = finalLeaderboard ?? (room?.status === 'FINISHED' ? leaderboard : null);
  const me = members.find(member => member.userId === currentUserId);
  const isCreator = room?.creatorId === currentUserId;
  const canStart = !!room && room.status === 'WAITING' && isCreator && room.memberCount >= 2;
  const shownRemainingSeconds = remainingSeconds ?? secondsUntil(room?.endTime);
  const maxBattlePoints = totalBattlePoints(room?.problems ?? []);

  const toggleReady = () => {
    const nextReady = !(me?.ready ?? false);
    setReadyByUser(prev => ({ ...prev, [currentUserId]: nextReady }));
    setReady(nextReady);
  };

  const confirmLeave = () => {
    if (!room) return;
    const message = room.status === 'IN_PROGRESS'
      ? 'Bạn có chắc chắn muốn rời trận đang diễn ra? Bạn sẽ không thể tiếp tục submit trong phòng này.'
      : 'Bạn có chắc chắn muốn rời phòng battle?';
    if (window.confirm(message)) {
      setLeaveError('');
      leaveMutation.mutate();
    }
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
        {me ? (
          <button
            type="button"
            onClick={confirmLeave}
            disabled={leaveMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200 hover:bg-red-500/15 disabled:opacity-50"
          >
            {leaveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
            {room.status === 'IN_PROGRESS' ? 'Rời trận' : 'Rời phòng'}
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

      {leaveError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{leaveError}</div>
      )}

      {room.status === 'IN_PROGRESS' && !finalEntries && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CountdownTimer remainingSeconds={shownRemainingSeconds} endTime={room.endTime} onExpire={handleTimeExpired} />
            <span className="text-sm text-slate-400">
              {finishingRoom ? 'Đang tổng kết trận...' : `${room.problems.length} bài · tối đa ${maxBattlePoints} điểm`}
            </span>
          </div>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <BattleArenaPage
              roomId={room.id}
              problems={room.problems}
              latestSubmission={latestSubmission}
              onSubmitted={setLatestSubmission}
            />
            <RealTimeLeaderboard entries={leaderboard} maxPoints={maxBattlePoints} />
          </div>
        </>
      )}

      {finalEntries && (
        <FinalResults entries={finalEntries} maxPoints={maxBattlePoints} loading={leaderboardQuery.isLoading} />
      )}

      {room.status === 'WAITING' && <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
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
                    onClick={confirmLeave}
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
        </aside>
      </div>}

      {room.status === 'WAITING' && room.problems.length > 0 && (
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

function secondsUntil(endTime?: string | null): number {
  if (!endTime) return 0;
  return Math.max(0, Math.ceil((new Date(endTime).getTime() - Date.now()) / 1000));
}

function totalBattlePoints(problems: BattleRoomDto['problems']): number {
  return problems.reduce((sum, problem) => sum + pointsForDifficulty(problem.difficulty), 0);
}

function pointsForDifficulty(difficulty: BattleRoomDto['problems'][number]['difficulty']): number {
  return ({ EASY: 100, MEDIUM: 200, HARD: 300 })[difficulty];
}

const FinalResults = ({
  entries,
  maxPoints,
  loading,
}: {
  entries: BattleLeaderboardEntryDto[];
  maxPoints: number;
  loading: boolean;
}) => (
  <section className="rounded-lg border border-amber-500/20 bg-slate-950/80">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4">
      <div className="flex items-center gap-2">
        <Trophy size={20} className="text-amber-300" />
        <div>
          <h2 className="font-semibold text-white">Kết quả cuối cùng</h2>
          <p className="text-xs text-slate-500">Trận đã kết thúc, editor và submit đã được khóa.</p>
        </div>
      </div>
      <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs font-semibold text-slate-300">
        Tối đa {maxPoints} điểm
      </span>
    </div>
    <div className="p-4">
      {loading && entries.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 size={16} className="animate-spin" />
          Đang tải bảng xếp hạng...
        </div>
      )}
      {!loading && entries.length === 0 && (
        <p className="text-sm text-slate-400">Chưa có kết quả xếp hạng.</p>
      )}
      <div className="space-y-2">
        {entries.map(entry => (
          <div
            key={entry.userId}
            className="grid grid-cols-[52px_minmax(0,1fr)_110px] items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3"
          >
            <span className="text-lg font-bold text-amber-200">#{entry.rank}</span>
            <div className="min-w-0">
              <p className="truncate font-medium text-white">{entry.name}</p>
              <p className="text-xs text-slate-500">{entry.acceptedCount} bài Accepted</p>
            </div>
            <span className="text-right font-semibold text-emerald-300">
              {entry.totalPoints}/{maxPoints}
            </span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

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
