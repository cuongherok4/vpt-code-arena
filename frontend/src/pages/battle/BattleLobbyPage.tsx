import { useCallback, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, DoorOpen, Loader2, Lock, Plus, RefreshCw, Search, Swords, Users } from 'lucide-react';
import { battleApi, type BattleRoomCreateRequest, type BattleRoomDto, type Difficulty } from '@/api/battle.api';
import { useBattleLobbySocket } from '@/hooks/useBattleLobbySocket';
import { useAuthStore } from '@/stores/authStore';

const difficulties: Array<{ value: Difficulty | ''; label: string }> = [
  { value: '', label: 'Mixed' },
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
];

export const BattleLobbyPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [searchCode, setSearchCode] = useState('');
  const [lockedRoom, setLockedRoom] = useState<Pick<BattleRoomDto, 'id' | 'code' | 'name'> | null>(null);
  const [joinPassword, setJoinPassword] = useState('');
  const joinPasswordRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<BattleRoomCreateRequest>({
    name: createRandomRoomName(),
    password: '',
    isPublic: true,
    maxMembers: 4,
    numProblems: 3,
    timeLimitMin: 30,
    difficulty: null,
    topic: '',
  });

  const roomsQuery = useQuery({
    queryKey: ['battle-rooms'],
    queryFn: battleApi.getRooms,
    enabled: isAuthenticated,
    refetchInterval: 1000,
    refetchIntervalInBackground: true,
  });

  const refreshRooms = useCallback(() => {
    queryClient.refetchQueries({ queryKey: ['battle-rooms'], type: 'active' });
  }, [queryClient]);

  const lobbySocket = useBattleLobbySocket(refreshRooms);

  const createMutation = useMutation({
    mutationFn: () => {
      return battleApi.createRoom({
        ...form,
        name: form.name.trim() || createRandomRoomName(),
        password: form.isPublic ? undefined : form.password?.trim(),
        difficulty: form.difficulty || null,
        topic: form.topic?.trim() || null,
      });
    },
    onSuccess: (room) => {
      queryClient.refetchQueries({ queryKey: ['battle-rooms'], type: 'active' });
      navigate(`/battle/rooms/${room.id}`);
    },
  });

  const joinMutation = useMutation({
    mutationFn: ({ roomId, code, password }: { roomId?: string; code?: string; password?: string }) => {
      if (code) return battleApi.joinRoomByCode(code, password);
      return battleApi.joinRoom(roomId!);
    },
    onSuccess: (room) => {
      setJoinPassword('');
      setLockedRoom(null);
      queryClient.refetchQueries({ queryKey: ['battle-rooms'], type: 'active' });
      navigate(`/battle/rooms/${room.id}`);
    },
  });

  const rooms = useMemo(() => roomsQuery.data ?? [], [roomsQuery.data]);
  const filteredRooms = useMemo(() => {
    const query = searchCode.trim().toLowerCase();
    if (!query) return rooms;
    return rooms.filter(room =>
      room.code?.toLowerCase().includes(query) || room.name.toLowerCase().includes(query)
    );
  }, [rooms, searchCode]);
  const busy = createMutation.isPending || joinMutation.isPending;
  const error = useMemo(() => {
    if (createMutation.error) return apiErrorMessage(createMutation.error, 'Tên phòng đã tồn tại.');
    if (joinMutation.error) return apiErrorMessage(joinMutation.error, 'Không thể vào phòng battle. Kiểm tra mã phòng, mật khẩu và phòng còn chỗ.');
    return '';
  }, [createMutation.error, joinMutation.error]);

  const submitCreate = (event: FormEvent) => {
    event.preventDefault();
    if (!isAuthenticated) return;
    if (!form.isPublic && !form.password?.trim()) return;
    createMutation.mutate();
  };

  const selectRoom = (room: BattleRoomDto) => {
    if (!room.locked) {
      joinMutation.mutate({ roomId: room.id });
      return;
    }
    setLockedRoom({ id: room.id, code: room.code, name: room.name });
    setJoinPassword('');
    window.setTimeout(() => joinPasswordRef.current?.focus(), 0);
  };

  const submitLockedJoin = (event: FormEvent) => {
    event.preventDefault();
    if (!lockedRoom?.code || !joinPassword.trim()) return;
    joinMutation.mutate({ code: lockedRoom.code, password: joinPassword.trim() });
  };

  if (!isAuthenticated) {
    return (
      <div className="app-panel mx-auto max-w-xl p-6 text-center">
        <Lock size={32} className="mx-auto mb-3 text-cyan-300" />
        <h1 className="text-xl font-semibold text-white">Cần đăng nhập để vào đấu trường</h1>
        <p className="mt-2 text-sm text-slate-400">Battle dùng tài khoản thật để tạo phòng, join phòng, ready và submit.</p>
        <Link to="/login" className="app-button app-button-primary mt-5">
          Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid min-w-0 max-w-7xl gap-5 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className="min-w-0">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="app-kicker">
              <Swords size={18} />
              Đấu trường
            </div>
            <h1 className="app-page-heading">Battle Lobby</h1>
            <p className="app-page-subtitle">Tạo phòng hoặc click một phòng đang chờ để tham gia ngay.</p>
          </div>
          <button
            type="button"
            onClick={() => roomsQuery.refetch()}
            className="app-button app-button-secondary"
          >
            <RefreshCw size={16} className={roomsQuery.isFetching ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-400">
          <span className={`h-2 w-2 rounded-full ${lobbySocket.connected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
          {lobbySocket.connected ? 'Lobby realtime' : 'Đang kết nối lobby'}
        </div>

        <div className="mb-4 flex min-w-0 gap-2">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={searchCode}
              onChange={event => setSearchCode(event.target.value)}
              className="app-field pl-9"
              inputMode="numeric"
              placeholder="Tìm mã phòng hoặc tên phòng"
            />
          </div>
        </div>

        <form
          onSubmit={submitLockedJoin}
          className={`mb-4 rounded-lg border border-amber-300/25 bg-amber-300/10 p-4 ${
            lockedRoom ? 'block' : 'hidden'
          }`}
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-100">
                <Lock size={16} />
                Phòng có khóa
              </div>
              <p className="mt-1 text-xs text-amber-100/75">
                {lockedRoom?.name ?? 'Phòng'} · mã {lockedRoom?.code ?? '------'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setLockedRoom(null);
                setJoinPassword('');
              }}
              className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-300 hover:bg-white/5"
            >
              Hủy
            </button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              ref={joinPasswordRef}
              type="password"
              value={joinPassword}
              onChange={event => setJoinPassword(event.target.value)}
              className="app-field border-amber-300/40 bg-amber-300/[0.04]"
              placeholder="Nhập mật khẩu phòng"
            />
            <button
              type="submit"
              disabled={busy || !joinPassword.trim()}
              className="app-button app-button-primary shrink-0"
            >
              {joinMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <DoorOpen size={16} />}
              Join
            </button>
          </div>
        </form>

        {roomsQuery.isLoading && (
          <div className="app-panel flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
            <Loader2 size={18} className="animate-spin text-cyan-300" />
            Đang tải phòng...
          </div>
        )}

        {roomsQuery.isError && (
          <div className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            <AlertCircle size={18} />
            Không thể tải danh sách phòng battle.
          </div>
        )}

        {!roomsQuery.isLoading && !roomsQuery.isError && rooms.length === 0 && (
          <div className="app-panel py-16 text-center">
            <Swords size={42} className="mx-auto mb-3 text-cyan-300" />
            <p className="font-medium text-white">Chưa có phòng đang chờ.</p>
            <p className="mt-1 text-sm text-slate-500">Tạo phòng mới để bắt đầu một trận battle.</p>
          </div>
        )}

        {!roomsQuery.isLoading && !roomsQuery.isError && rooms.length > 0 && filteredRooms.length === 0 && (
          <div className="app-panel py-12 text-center text-sm text-slate-400">
            Không tìm thấy phòng phù hợp với mã đang nhập.
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          {filteredRooms.map(room => (
            <button
              type="button"
              key={room.id}
              onClick={() => selectRoom(room)}
              disabled={joinMutation.isPending}
            className="app-card min-w-0 p-4 text-left transition-colors hover:border-cyan-400/40 hover:bg-white/[0.06]"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate font-semibold text-white">{room.name}</h2>
                    {room.locked && <Lock size={15} className="shrink-0 text-amber-300" />}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 font-mono text-sm font-semibold text-cyan-100">
                      {room.code || 'Chưa có mã'}
                    </span>
                    <span className="truncate text-xs text-slate-500">Chủ phòng: {room.creatorName}</span>
                  </div>
                </div>
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-300">
                  {joinMutation.isPending ? 'JOINING' : 'WAITING'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
                <span className="flex items-center gap-2"><Users size={15} /> {room.memberCount}/{room.maxMembers}</span>
                <span>{room.numProblems} bài</span>
                <span>{room.timeLimitMin} phút</span>
                <span>{room.difficulty || 'Mixed'}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <aside className="min-w-0 space-y-4">
        <form onSubmit={submitCreate} className="app-panel p-4">
          <div className="mb-4 flex items-center gap-2">
            <Plus size={18} className="text-cyan-300" />
            <h2 className="font-semibold text-white">Tạo phòng</h2>
          </div>
          <div className="space-y-3">
            <input
              value={form.name}
              onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))}
              className="app-field"
              placeholder="#ABC123 hoặc tên phòng"
            />
            <div className="grid grid-cols-3 gap-2">
              <NumberField label="Người" value={form.maxMembers} min={2} max={20} onChange={maxMembers => setForm(prev => ({ ...prev, maxMembers }))} />
              <NumberField label="Bài" value={form.numProblems} min={1} max={10} onChange={numProblems => setForm(prev => ({ ...prev, numProblems }))} />
              <NumberField label="Phút" value={form.timeLimitMin} min={2} max={180} onChange={timeLimitMin => setForm(prev => ({ ...prev, timeLimitMin }))} />
            </div>
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              {difficulties.map(item => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, difficulty: item.value || null }))}
                  className={`rounded-md border px-2 py-1.5 text-xs font-medium ${
                    (form.difficulty || '') === item.value
                      ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-100'
                      : 'border-white/10 text-slate-400 hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <input
              value={form.topic || ''}
              onChange={event => setForm(prev => ({ ...prev, topic: event.target.value }))}
              className="app-field"
              placeholder="Topic optional"
            />
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={event => setForm(prev => ({ ...prev, isPublic: event.target.checked, password: event.target.checked ? '' : prev.password }))}
                className="h-4 w-4 accent-cyan-500"
              />
              Phòng public
            </label>
            {!form.isPublic && (
              <input
                type="password"
                value={form.password || ''}
                onChange={event => setForm(prev => ({ ...prev, password: event.target.value }))}
                className="app-field"
                placeholder="Mật khẩu phòng private"
                minLength={4}
                maxLength={32}
                required
              />
            )}
            <button
              type="submit"
              disabled={busy || (!form.isPublic && !form.password?.trim())}
              className="app-button app-button-primary w-full"
            >
              {createMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Tạo phòng
            </button>
          </div>
        </form>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>
        )}
      </aside>
    </div>
  );
};

type NumberFieldProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};

const NumberField = ({ label, value, min, max, onChange }: NumberFieldProps) => (
  <label className="block">
    <span className="mb-1 block text-xs text-slate-500">{label}</span>
    <input
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={event => onChange(Number(event.target.value))}
      className="app-field px-2"
    />
  </label>
);

function createRandomRoomName(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let value = '#';
  for (let index = 0; index < 6; index += 1) {
    value += chars[Math.floor(Math.random() * chars.length)];
  }
  return value;
}

function apiErrorMessage(error: unknown, fallback: string): string {
  const response = typeof error === 'object' && error !== null && 'response' in error
    ? (error as { response?: { data?: unknown; status?: number } }).response
    : undefined;
  const data = response?.data;
  if (response?.status === 409) return fallback;
  if (typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string') {
    return data.message === 'Room name already exists' ? 'Tên phòng đã tồn tại.' : data.message;
  }
  if (typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string') {
    return data.error;
  }
  return fallback;
}

export default BattleLobbyPage;
