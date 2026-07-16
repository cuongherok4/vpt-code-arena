import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, DoorOpen, Loader2, Plus, RefreshCw, Swords, Users } from 'lucide-react';
import { battleApi, type BattleRoomCreateRequest, type Difficulty } from '@/api/battle.api';

const difficulties: Array<{ value: Difficulty | ''; label: string }> = [
  { value: '', label: 'Mixed' },
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
];

const defaultUserId = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

export const BattleLobbyPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [joinCode, setJoinCode] = useState('');
  const [userId, setUserId] = useState(localStorage.getItem('userId') || defaultUserId);
  const [form, setForm] = useState<BattleRoomCreateRequest>({
    name: 'Battle nhanh',
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
    refetchInterval: 10000,
  });

  const saveDevUser = () => {
    localStorage.setItem('userId', userId.trim());
    localStorage.setItem('userName', `User ${userId.trim().slice(0, 4)}`);
  };

  const createMutation = useMutation({
    mutationFn: () => {
      saveDevUser();
      return battleApi.createRoom({
        ...form,
        name: form.name.trim(),
        difficulty: form.difficulty || null,
        topic: form.topic?.trim() || null,
      });
    },
    onSuccess: (room) => {
      queryClient.invalidateQueries({ queryKey: ['battle-rooms'] });
      navigate(`/battle/rooms/${room.id}`);
    },
  });

  const joinMutation = useMutation({
    mutationFn: (roomId: string) => {
      saveDevUser();
      return battleApi.joinRoom(roomId);
    },
    onSuccess: (room) => {
      queryClient.invalidateQueries({ queryKey: ['battle-rooms'] });
      navigate(`/battle/rooms/${room.id}`);
    },
  });

  const rooms = roomsQuery.data ?? [];
  const busy = createMutation.isPending || joinMutation.isPending;
  const error = useMemo(() => {
    const apiError = createMutation.error || joinMutation.error;
    if (!apiError) return '';
    return 'Không thể xử lý phòng battle. Kiểm tra userId dev có tồn tại trong DB và phòng vẫn còn chờ.';
  }, [createMutation.error, joinMutation.error]);

  const submitCreate = (event: FormEvent) => {
    event.preventDefault();
    createMutation.mutate();
  };

  const submitJoin = (event: FormEvent) => {
    event.preventDefault();
    const roomId = joinCode.trim();
    if (roomId) joinMutation.mutate(roomId);
  };

  return (
    <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="min-w-0">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Battle Lobby</h1>
            <p className="mt-1 text-sm text-slate-400">Tạo phòng, vào phòng bằng mã, hoặc chọn một phòng public đang chờ.</p>
          </div>
          <button
            type="button"
            onClick={() => roomsQuery.refetch()}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            <RefreshCw size={16} className={roomsQuery.isFetching ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>

        {roomsQuery.isLoading && (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] py-16 text-sm text-slate-400">
            <Loader2 size={18} className="animate-spin text-violet-300" />
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
          <div className="rounded-lg border border-white/10 bg-white/[0.03] py-16 text-center">
            <Swords size={42} className="mx-auto mb-3 text-violet-300" />
            <p className="font-medium text-white">Chưa có phòng public đang chờ.</p>
            <p className="mt-1 text-sm text-slate-500">Tạo phòng mới để bắt đầu một trận battle.</p>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          {rooms.map(room => (
            <Link
              key={room.id}
              to={`/battle/rooms/${room.id}`}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-violet-400/40 hover:bg-white/[0.06]"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-white">{room.name}</h2>
                  <p className="mt-1 text-xs text-slate-500">Chủ phòng: {room.creatorName}</p>
                </div>
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-300">
                  WAITING
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
                <span className="flex items-center gap-2"><Users size={15} /> {room.memberCount}/{room.maxMembers}</span>
                <span>{room.numProblems} bài</span>
                <span>{room.timeLimitMin} phút</span>
                <span>{room.difficulty || 'Mixed'}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <aside className="space-y-4">
        <form onSubmit={submitCreate} className="rounded-lg border border-white/10 bg-slate-950/70 p-4">
          <div className="mb-4 flex items-center gap-2">
            <Plus size={18} className="text-violet-300" />
            <h2 className="font-semibold text-white">Tạo phòng</h2>
          </div>
          <div className="space-y-3">
            <input
              value={form.name}
              onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-violet-400/50"
              placeholder="Tên phòng"
              required
            />
            <div className="grid grid-cols-3 gap-2">
              <NumberField label="Người" value={form.maxMembers} min={2} max={20} onChange={maxMembers => setForm(prev => ({ ...prev, maxMembers }))} />
              <NumberField label="Bài" value={form.numProblems} min={1} max={10} onChange={numProblems => setForm(prev => ({ ...prev, numProblems }))} />
              <NumberField label="Phút" value={form.timeLimitMin} min={10} max={180} onChange={timeLimitMin => setForm(prev => ({ ...prev, timeLimitMin }))} />
            </div>
            <div className="grid grid-cols-4 gap-1">
              {difficulties.map(item => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, difficulty: item.value || null }))}
                  className={`rounded-md border px-2 py-1.5 text-xs font-medium ${
                    (form.difficulty || '') === item.value
                      ? 'border-violet-500/40 bg-violet-500/15 text-violet-200'
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
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-violet-400/50"
              placeholder="Topic optional"
            />
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={event => setForm(prev => ({ ...prev, isPublic: event.target.checked }))}
                className="h-4 w-4 accent-violet-500"
              />
              Phòng public
            </label>
            <button
              type="submit"
              disabled={busy || !form.name.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Tạo phòng
            </button>
          </div>
        </form>

        <form onSubmit={submitJoin} className="rounded-lg border border-white/10 bg-slate-950/70 p-4">
          <div className="mb-4 flex items-center gap-2">
            <DoorOpen size={18} className="text-violet-300" />
            <h2 className="font-semibold text-white">Vào bằng mã phòng</h2>
          </div>
          <div className="space-y-3">
            <input
              value={joinCode}
              onChange={event => setJoinCode(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-violet-400/50"
              placeholder="Room UUID"
            />
            <button
              type="submit"
              disabled={busy || !joinCode.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {joinMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <DoorOpen size={16} />}
              Join phòng
            </button>
          </div>
        </form>

        <div className="rounded-lg border border-white/10 bg-slate-950/70 p-4">
          <label className="mb-2 block text-sm font-medium text-slate-300">Dev userId</label>
          <input
            value={userId}
            onChange={event => setUserId(event.target.value)}
            onBlur={saveDevUser}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-violet-400/50"
          />
          <p className="mt-2 text-xs leading-5 text-slate-500">Dùng tạm đến Phase 5 Auth. userId phải tồn tại trong DB.</p>
        </div>

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
      className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm text-white outline-none focus:border-violet-400/50"
    />
  </label>
);

export default BattleLobbyPage;
