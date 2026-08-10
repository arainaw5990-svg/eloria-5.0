import { formatPrice } from '../lib/utils';

interface ChartData {
  label: string;
  value: number;
}

export default function BarChart({ data, height = 200 }: { data: ChartData[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] font-medium text-ink-500">{d.value > 0 ? formatPrice(d.value) : ''}</span>
          <div
            className="w-full rounded-t bg-gold-400 transition-all duration-300 hover:bg-gold-300"
            style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? '4px' : '0' }}
          />
          <span className="text-[10px] text-ink-400">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
