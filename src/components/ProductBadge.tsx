const BADGE_STYLES: Record<string, string> = {
  'Best Seller': 'bg-amber-100 text-amber-800',
  'Trending': 'bg-rose-100 text-rose-700',
  'Limited': 'bg-purple-100 text-purple-700',
  'Sale': 'bg-red-100 text-red-700',
  'New': 'bg-emerald-100 text-emerald-700',
  'Exclusive': 'bg-indigo-100 text-indigo-700',
  'Out of Stock': 'bg-gray-200 text-gray-600',
};

export default function ProductBadge({ badge, customColor }: { badge: string; customColor?: string }) {
  if (customColor) {
    return (
      <span
        className="rounded-full px-2.5 py-0.5 text-xs font-bold"
        style={{ backgroundColor: customColor, color: '#fff' }}
      >
        {badge}
      </span>
    );
  }
  const style = BADGE_STYLES[badge] ?? 'bg-ink-100 text-ink-700';
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${style}`}>
      {badge}
    </span>
  );
}
