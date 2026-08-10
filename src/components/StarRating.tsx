import { Star } from 'lucide-react';

export default function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={star <= rating ? 'fill-gold-400 text-gold-400' : 'fill-ink-100 text-ink-200'}
        />
      ))}
    </div>
  );
}
