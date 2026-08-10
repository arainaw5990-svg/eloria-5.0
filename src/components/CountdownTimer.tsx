import { useEffect, useState } from 'react';

export default function CountdownTimer({ endDate, compact = false }: { endDate: string; compact?: boolean }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(endDate));

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(getTimeLeft(endDate)), 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  if (timeLeft.total <= 0) return null;

  if (compact) {
    return (
      <span className="text-xs font-medium text-red-600">
        {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}
        {String(timeLeft.hours).padStart(2, '0')}h:{String(timeLeft.minutes).padStart(2, '0')}m:{String(timeLeft.seconds).padStart(2, '0')}s
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-red-600">Ends in:</span>
      <div className="flex gap-1.5">
        {timeLeft.days > 0 && (
          <TimeBox value={timeLeft.days} label="Days" />
        )}
        <TimeBox value={timeLeft.hours} label="Hrs" />
        <TimeBox value={timeLeft.minutes} label="Min" />
        <TimeBox value={timeLeft.seconds} label="Sec" />
      </div>
    </div>
  );
}

function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-ink-900 px-2 py-1 text-white">
      <span className="text-sm font-bold tabular-nums">{String(value).padStart(2, '0')}</span>
      <span className="text-[9px] uppercase tracking-wider opacity-70">{label}</span>
    </div>
  );
}

function getTimeLeft(endDate: string) {
  const total = new Date(endDate).getTime() - Date.now();
  if (total <= 0) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    total,
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
  };
}
