import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Copy, Loader2, Lock, LogOut, MessageSquare, Play, Radio, Shield, Swords, Trophy, UserMinus, UserPlus, Users } from 'lucide-react';
import { battleApi, type BattleLeaderboardEntryDto, type BattleMemberDto, type BattleRoomDto, type BattleSubmissionDto } from '@/api/battle.api';
import { friendsApi, type FriendStatus } from '@/api/friends.api';
import { FriendButton } from '@/components/social/FriendButton';
import { useBattleSocket } from '@/hooks/useBattleSocket';
import { useChatSocket } from '@/hooks/useChatSocket';
import BattleArenaPage from './BattleArenaPage';
import CountdownTimer from '@/components/battle/CountdownTimer';
import RealTimeLeaderboard from '@/components/battle/RealTimeLeaderboard';
import { useAuthStore } from '@/stores/authStore';

export const BattleRoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const currentUserId = user?.id ?? '';
  const [readyByUser, setReadyByUser] = useState<Record<string, boolean>>({});
  const [socketError, setSocketError] = useState('');
  const [leaveError, setLeaveError] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [liveLeaderboard, setLiveLeaderboard] = useState<BattleLeaderboardEntryDto[]>([]);
  const [latestSubmission, setLatestSubmission] = useState<BattleSubmissionDto | undefined>();
  const [finalLeaderboard, setFinalLeaderboard] = useState<BattleLeaderboardEntryDto[] | null>(null);
  const chatSocket = useChatSocket({ enabled: isAuthenticated });

  const roomQuery = useQuery({
    queryKey: ['battle-room', roomId],
    queryFn: () => battleApi.getRoom(roomId!),
    enabled: !!roomId && isAuthenticated,
    refetchInterval: 1000,
    refetchIntervalInBackground: true,
  });

  const leaderboardQuery = useQuery({
    queryKey: ['battle-leaderboard', roomId],
    queryFn: () => battleApi.getLeaderboard(roomId!),
    enabled: !!roomId && isAuthenticated && (roomQuery.data?.status === 'IN_PROGRESS' || roomQuery.data?.status === 'FINISHED'),
    refetchInterval: roomQuery.data?.status === 'IN_PROGRESS' ? 10000 : false,
  });

  const friendsQuery = useQuery({
    queryKey: ['friends'],
    queryFn: friendsApi.friends,
    enabled: !!roomId && isAuthenticated,
    refetchInterval: 1000,
    refetchIntervalInBackground: true,
  });

  const requestsQuery = useQuery({
    queryKey: ['friend-requests'],
    queryFn: friendsApi.requests,
    enabled: !!roomId && isAuthenticated,
    refetchInterval: 1000,
    refetchIntervalInBackground: true,
  });

  const refreshRoom = useCallback(() => {
    queryClient.refetchQueries({ queryKey: ['battle-room', roomId], type: 'active' });
    queryClient.refetchQueries({ queryKey: ['battle-rooms'], type: 'active' });
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

  const handleKicked = useCallback((event: { roomId: string; userId: string }) => {
    if (event.roomId !== roomId || event.userId !== currentUserId) return;
    queryClient.invalidateQueries({ queryKey: ['battle-rooms'] });
    queryClient.removeQueries({ queryKey: ['battle-room', roomId] });
    navigate('/battle', { replace: true });
  }, [currentUserId, navigate, queryClient, roomId]);

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
    roomId: isAuthenticated ? roomId : undefined,
    onJoined: refreshRoom,
    onMemberChange: refreshRoom,
    onKicked: handleKicked,
    onStarted: refreshRoom,
    onReadyUpdate: handleReadyUpdate,
    onTick: setRemainingSeconds,
    onLeaderboardUpdate: handleLeaderboardUpdate,
    onSubmissionResult: handleSubmissionResult,
    onFinished: handleFinished,
    onError: setSocketError,
  });
  const [globalInviteSent, setGlobalInviteSent] = useState(false);
  const sendGlobalBattleInvite = async () => {
    if (!room?.id) return;
    const response = await chatSocket.sendBattleInvite(room.id, room.name, room.code);
    if (!response.success) {
      setSocketError(typeof response.message === 'string' ? response.message : 'Không thể gửi lời mời vào chat thế giới.');
      return;
    }
    setGlobalInviteSent(true);
  };

  const joinMutation = useMutation({
    mutationFn: () => {
      if (room?.locked) {
        return battleApi.joinRoomByCode(room.code, joinPassword.trim());
      }
      return battleApi.joinRoom(roomId!);
    },
    onSuccess: () => {
      setJoinPassword('');
      refreshRoom();
    },
    onError: (error) => setSocketError(apiErrorMessage(error, 'Không thể vào phòng. Kiểm tra mật khẩu phòng.')),
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

  const inviteMutation = useMutation({
    mutationFn: (friendId: string) => battleApi.inviteFriend(roomId!, friendId),
    onError: (error) => setSocketError(apiErrorMessage(error, 'Không thể gửi lời mời. Chỉ mời được bạn bè khi phòng còn chờ và còn chỗ.')),
  });

  const kickMutation = useMutation({
    mutationFn: (userId: string) => battleApi.kickMember(roomId!, userId),
    onSuccess: (room) => {
      queryClient.setQueryData(['battle-room', roomId], room);
      queryClient.invalidateQueries({ queryKey: ['battle-rooms'] });
    },
    onError: (error) => setSocketError(apiErrorMessage(error, 'Không thể kick thành viên. Chỉ chủ phòng được kick khi phòng còn chờ.')),
  });

  const room = roomQuery.data;
  const members = useMemo(() => mergeReady(room, readyByUser), [room, readyByUser]);
  const leaderboard = liveLeaderboard.length > 0 ? liveLeaderboard : (leaderboardQuery.data ?? []);
  const finalEntries = finalLeaderboard ?? (room?.status === 'FINISHED' ? leaderboard : null);
  const me = members.find(member => member.userId === currentUserId);
  const isCreator = room?.creatorId === currentUserId;
  const canStart = !!room && room.status === 'WAITING' && isCreator && room.memberCount >= 2;
  const invitedFriendIds = new Set(members.map(member => member.userId));
  const invitableFriends = (friendsQuery.data ?? []).filter(friend => !invitedFriendIds.has(friend.id));
  const friendIds = useMemo(() => new Set((friendsQuery.data ?? []).map(friend => friend.id)), [friendsQuery.data]);
  const incomingRequestIds = useMemo(() => new Set((requestsQuery.data?.incoming ?? []).map(request => request.user.id)), [requestsQuery.data]);
  const outgoingRequestIds = useMemo(() => new Set((requestsQuery.data?.outgoing ?? []).map(request => request.user.id)), [requestsQuery.data]);
  const shownRemainingSeconds = remainingSeconds ?? secondsUntil(room?.endTime);
  const maxBattlePoints = totalBattlePoints(room?.problems ?? []);

  const toggleReady = () => {
    if (!currentUserId) return;
    const nextReady = !(me?.ready ?? false);
    setReadyByUser(prev => ({ ...prev, [currentUserId]: nextReady }));
    setReady(nextReady);
  };

  if (!isAuthenticated) {
    return (
      <div className="app-panel mx-auto max-w-xl p-6 text-center">
        <Lock size={32} className="mx-auto mb-3 text-cyan-300" />
        <h1 className="text-xl font-semibold text-white">Cần đăng nhập để vào phòng battle</h1>
        <p className="mt-2 text-sm text-slate-400">Phòng battle dùng tài khoản thật để đồng bộ thành viên, ready và submit.</p>
        <Link to="/login" className="app-button app-button-primary mt-5">
          Đăng nhập
        </Link>
      </div>
    );
  }

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
        <Loader2 size={18} className="animate-spin text-cyan-300" />
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
          <a href="/battle" className="app-button app-button-secondary">
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

      <section className="app-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-bold text-white">{room.name}</h1>
              <span className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-xs font-semibold text-cyan-100">{room.status}</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
              <span>{room.numProblems} bài</span>
              <span>{room.timeLimitMin} phút</span>
              <span>{room.difficulty || 'Mixed'}</span>
              <span>{room.topic || 'all topics'}</span>
            </div>
            <div className="mt-3 flex max-w-full flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Mã phòng</span>
              <code className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 font-mono text-base font-bold text-cyan-100">
                {room.code || 'Chưa có mã'}
              </code>
            </div>
          </div>
          <button
            type="button"
            onClick={() => room.code && navigator.clipboard?.writeText(room.code)}
            disabled={!room.code}
            className="app-button app-button-secondary"
          >
            <Copy size={16} />
            Copy mã phòng
          </button>
          {me && room.status === 'WAITING' && (
            <button
              type="button"
              onClick={sendGlobalBattleInvite}
              disabled={!chatSocket.connected || globalInviteSent || room.locked}
              className="app-button app-button-primary"
              title={room.locked ? 'Phòng có khóa không thể mời global' : 'Gửi lời mời vào chat thế giới'}
            >
              <MessageSquare size={16} />
              {room.locked ? 'Phòng khóa' : globalInviteSent ? 'Đã gửi lên global' : 'Mời global'}
            </button>
          )}
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
        <section className="app-panel">
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-cyan-300" />
              <h2 className="font-semibold text-white">Thành viên</h2>
            </div>
            <span className="text-sm text-slate-400">{members.length}/{room.maxMembers}</span>
          </div>
          <div className="divide-y divide-white/10">
            {members.map(member => (
              <MemberRow
                key={member.userId}
                member={member}
                current={member.userId === currentUserId}
                canKick={isCreator && member.userId !== currentUserId && room.status === 'WAITING'}
                kicking={kickMutation.isPending}
                friendStatus={getFriendStatus(member.userId, currentUserId, friendIds, incomingRequestIds, outgoingRequestIds)}
                onFriendError={setSocketError}
                onKick={() => {
                  if (window.confirm(`Kick ${member.name || member.publicId || 'thành viên này'} khỏi phòng?`)) {
                    kickMutation.mutate(member.userId);
                  }
                }}
              />
            ))}
          </div>
        </section>

        <aside className="space-y-3">
          {isCreator && (
            <section className="app-panel p-3">
              <div className="mb-3 flex items-center gap-2">
                <UserPlus size={17} className="text-cyan-300" />
                <h3 className="text-sm font-semibold text-white">Mời bạn bè</h3>
              </div>
              {friendsQuery.isLoading ? (
                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-400">
                  <Loader2 size={15} className="animate-spin" />
                  Đang tải bạn bè...
                </div>
              ) : invitableFriends.length === 0 ? (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-500">
                  Không còn bạn bè phù hợp để mời.
                </div>
              ) : (
                <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                  {invitableFriends.map(friend => {
                    const online = chatSocket.onlineUserIds.has(friend.id) || friend.online;
                    return (
                      <div
                        key={friend.id}
                        className={`flex items-center justify-between gap-2 rounded-lg border p-2 ${
                          online
                            ? 'border-emerald-400/25 bg-emerald-400/[0.06]'
                            : 'border-white/10 bg-white/[0.03]'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${online ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                            <p className={`truncate text-sm font-medium ${online ? 'text-emerald-100' : 'text-white'}`}>
                              {friend.name}
                            </p>
                          </div>
                          <p className="mt-1 truncate text-xs text-slate-500">ID {friend.publicId}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => inviteMutation.mutate(friend.id)}
                          disabled={inviteMutation.isPending || !online}
                          className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                            online
                              ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300'
                              : 'border border-white/10 text-slate-500'
                          }`}
                          title={online ? 'Mời vào phòng' : 'Bạn này đang offline'}
                        >
                          <UserPlus size={13} />
                          {online ? 'Mời' : 'Offline'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
          <>
              {!me && (
                <div className="space-y-2">
                  <input
                    type="password"
                    value={joinPassword}
                    onChange={event => setJoinPassword(event.target.value)}
                    className={`app-field border-amber-300/40 bg-amber-300/[0.04] ${room.locked ? 'block' : 'hidden'}`}
                    placeholder="Nhập mật khẩu phòng"
                  />
                  <button
                    type="button"
                    onClick={() => joinMutation.mutate()}
                    disabled={joinMutation.isPending || (room.locked && !joinPassword.trim())}
                    className="app-button app-button-primary w-full py-2.5"
                  >
                    {joinMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Swords size={16} />}
                    Join phòng
                  </button>
                </div>
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
                  className="app-button app-button-secondary w-full py-2.5"
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
        <section className="app-panel">
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

function getFriendStatus(
  userId: string,
  currentUserId: string,
  friendIds: Set<string>,
  incomingRequestIds: Set<string>,
  outgoingRequestIds: Set<string>,
): FriendStatus {
  if (userId === currentUserId) return 'SELF';
  if (friendIds.has(userId)) return 'FRIENDS';
  if (incomingRequestIds.has(userId)) return 'PENDING_INCOMING';
  if (outgoingRequestIds.has(userId)) return 'PENDING_OUTGOING';
  return 'NONE';
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

function apiErrorMessage(error: unknown, fallback: string): string {
  const response = typeof error === 'object' && error !== null && 'response' in error
    ? (error as { response?: { data?: unknown } }).response
    : undefined;
  const data = response?.data;
  if (typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string') {
    return data.message;
  }
  if (typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string') {
    return data.error;
  }
  return fallback;
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

const MemberRow = ({
  member,
  current,
  canKick,
  kicking,
  friendStatus,
  onFriendError,
  onKick,
}: {
  member: BattleMemberDto;
  current: boolean;
  canKick?: boolean;
  kicking?: boolean;
  friendStatus: FriendStatus;
  onFriendError?: (message: string) => void;
  onKick?: () => void;
}) => (
  <div className="flex items-center justify-between gap-3 p-4">
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <p className="truncate font-medium text-white">{member.name || 'Người dùng VPT'}</p>
        {current && <span className="rounded border border-white/10 px-1.5 py-0.5 text-[11px] text-slate-400">Bạn</span>}
        {member.creator && <Shield size={14} className="text-amber-300" />}
      </div>
      <p className="mt-1 truncate text-xs text-slate-500">ID {member.publicId ?? '----------'}</p>
    </div>
    <div className="flex shrink-0 items-center gap-2">
      <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${
        member.ready ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-white/10 bg-white/5 text-slate-400'
      }`}>
        {member.ready ? 'Ready' : 'Waiting'}
      </span>
      {!current && (
        <FriendButton
          userId={member.userId}
          status={friendStatus}
          size="sm"
          onError={onFriendError}
        />
      )}
      {canKick && (
        <button
          type="button"
          onClick={onKick}
          disabled={kicking}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-200 hover:bg-red-500/15 disabled:opacity-50"
          title="Kick khỏi phòng"
        >
          <UserMinus size={15} />
        </button>
      )}
    </div>
  </div>
);

export default BattleRoomPage;
