import { useEffect, useMemo, useRef, useState } from 'react';
import { Clock } from 'lucide-react';

type CountdownTimerProps = {
  remainingSeconds: number;
  endTime?: string | null;
  onExpire?: () => void;
};

export const CountdownTimer = ({ remainingSeconds, endTime, onExpire }: CountdownTimerProps) => {
  const targetTime = useMemo(() => {
    if (endTime) {
      const parsed = Date.parse(endTime);
      if (!Number.isNaN(parsed)) return parsed;
    }
    return Date.now() + Math.max(0, remainingSeconds) * 1000;
  }, [endTime, remainingSeconds]);

  const [displaySeconds, setDisplaySeconds] = useState(() => secondsLeft(targetTime));
  const expiredRef = useRef(false);

  useEffect(() => {
    expiredRef.current = false;
  }, [targetTime]);

  useEffect(() => {
    const tick = () => {
      const nextSeconds = secondsLeft(targetTime);
      setDisplaySeconds(nextSeconds);
      if (nextSeconds === 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpire?.();
      }
    };
    tick();
    const intervalId = window.setInterval(tick, 250);
    return () => window.clearInterval(intervalId);
  }, [onExpire, targetTime]);

  const minutes = Math.floor(displaySeconds / 60);
  const seconds = displaySeconds % 60;
  const urgent = displaySeconds <= 60;

  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
      urgent ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
    }`}>
      <Clock size={16} />
      {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
    </div>
  );
};

function secondsLeft(targetTime: number) {
  return Math.max(0, Math.ceil((targetTime - Date.now()) / 1000));
}

export default CountdownTimer;
