import { useEffect, useState } from 'react';
import { Quote } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDate } from '../lib/utils';
import type { Review } from '../lib/types';
import StarRating from './StarRating';
import AnimatedSection from './AnimatedSection';

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('reviews')
      .select('*')
      .eq('is_approved', true)
      .eq('is_visible', true)
      .order('sort_order', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(8)
      .then(({ data }) => {
        setReviews(data ?? []);
        setLoading(false);
      });
  }, []);

  if (loading || reviews.length === 0) return null;

  return (
    <AnimatedSection className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <Quote size={32} className="mx-auto mb-3 text-gold-400" />
        <h2 className="font-serif text-3xl font-bold text-ink-900 sm:text-4xl">Customer Reviews</h2>
        <p className="mx-auto mt-3 max-w-xl text-ink-500">What our customers say about their Eloria Scents experience.</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review) => (
          <div key={review.id} className="flex flex-col rounded-2xl border border-ink-100 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="mb-3 flex items-center justify-between">
              <StarRating rating={review.rating} size={16} />
              {(review.review_date || review.created_at) && (
                <span className="text-xs text-ink-400">{formatDate(review.review_date || review.created_at)}</span>
              )}
            </div>
            {review.title && <h3 className="font-serif text-lg font-semibold text-ink-900">{review.title}</h3>}
            {review.body && <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">{review.body}</p>}
            <div className="mt-4 flex items-center gap-3 border-t border-ink-50 pt-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-100 text-sm font-bold text-gold-700">
                {review.customer_name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-ink-900">{review.customer_name}</span>
            </div>
          </div>
        ))}
      </div>
    </AnimatedSection>
  );
}
