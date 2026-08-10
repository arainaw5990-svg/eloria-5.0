import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShoppingBag, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Product, Review, ProductWithSale } from '../lib/types';
import { formatPrice } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useActiveSales, applySaleToProduct } from '../lib/hooks/useSales';
import StarRating from '../components/StarRating';
import ProductBadge from '../components/ProductBadge';
import CountdownTimer from '../components/CountdownTimer';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [rawProduct, setRawProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const { activeSales } = useActiveSales();
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, title: '', body: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('slug', slug)
      .eq('is_enabled', true)
      .maybeSingle()
      .then(({ data }) => {
        setRawProduct(data);
        setLoading(false);
        if (data) {
          supabase
            .from('reviews')
            .select('*')
            .eq('product_id', data.id)
            .eq('is_approved', true)
            .order('created_at', { ascending: false })
            .then(({ data: revData }) => setReviews(revData ?? []));
        }
      });
  }, [slug]);

  // Refetch reviews when product changes

  const product: ProductWithSale | null = rawProduct ? applySaleToProduct(rawProduct, activeSales) : null;

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-32 rounded bg-ink-100" />
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="aspect-square rounded-2xl bg-ink-100" />
            <div className="space-y-4">
              <div className="h-8 w-3/4 rounded bg-ink-100" />
              <div className="h-6 w-1/4 rounded bg-ink-100" />
              <div className="h-24 w-full rounded bg-ink-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl font-bold text-ink-900">Product Not Found</h1>
        <Link to="/shop" className="mt-4 inline-block text-gold-600 hover:text-gold-700">
          Back to Shop
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.sale_price ?? product.price,
        image: product.images[0] ?? '',
      },
      qty
    );
    showToast('Added to cart — check your cart to proceed');
  };

  const handleBuyNow = () => {
    addToCart(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.sale_price ?? product.price,
        image: product.images[0] ?? '',
      },
      qty
    );
    navigate('/cart');
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.name.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('reviews').insert({
      product_id: product.id,
      customer_name: reviewForm.name.trim(),
      rating: reviewForm.rating,
      title: reviewForm.title.trim() || null,
      body: reviewForm.body.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      showToast('Failed to submit review', 'error');
    } else {
      showToast('Review submitted — pending approval');
      setShowReviewForm(false);
      setReviewForm({ name: '', rating: 5, title: '', body: '' });
    }
  };

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const hasNotes = product.fragrance_notes_top.length > 0 || product.fragrance_notes_middle.length > 0 || product.fragrance_notes_base.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/shop" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-900">
        <ArrowLeft size={16} /> Back to Shop
      </Link>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Images */}
        <div>
          <div className="aspect-square overflow-hidden rounded-2xl border border-ink-100 bg-ink-50">
            {product.images[activeImage] ? (
              <img src={product.images[activeImage]} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink-50 to-ink-100">
                <ShoppingBag size={48} className="text-ink-300" />
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-4 flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`h-20 w-20 overflow-hidden rounded-lg border-2 transition ${
                    activeImage === i ? 'border-gold-400' : 'border-ink-100'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {product.category && (
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-gold-600">{product.category.name}</p>
          )}
          <h1 className="font-serif text-3xl font-bold text-ink-900">{product.name}</h1>
          {product.inspired_by && (
            <div className="mt-2">
              <p className="text-sm italic text-ink-400">Inspired by: {product.inspired_by}</p>
              <p className="mt-0.5 text-xs text-ink-300">Eloria Scents is not affiliated with or endorsed by the referenced fragrance brand.</p>
            </div>
          )}
          <div className="mt-3 flex items-center gap-3">
            <StarRating rating={Math.round(avgRating)} size={20} />
            <span className="text-sm text-ink-500">
              {reviews.length > 0 ? `${reviews.length} review${reviews.length !== 1 ? 's' : ''}` : 'No reviews yet'}
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold text-ink-900">{formatPrice(product.sale_price ?? product.price)}</p>
          {product.sale_price != null && product.sale_price < product.price && (
            <div className="mt-1 flex items-center gap-3">
              <span className="text-lg text-ink-400 line-through">{formatPrice(product.price)}</span>
              <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white">-{product.discount_percent}%</span>
            </div>
          )}
          {product.sale_end_date && product.sale_price != null && (
            <div className="mt-3">
              <CountdownTimer endDate={product.sale_end_date} />
            </div>
          )}
          {product.badges.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {product.badges.map((b) => <ProductBadge key={b} badge={b} customColor={b === 'Sale' ? product.sale_color ?? undefined : undefined} />)}
            </div>
          )}

          <div className="mt-2">
            {product.stock_quantity > 0 ? (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
                <Check size={16} /> In Stock ({product.stock_quantity} available)
              </span>
            ) : (
              <span className="text-sm font-medium text-red-600">Out of Stock</span>
            )}
          </div>

          {product.description && (
            <p className="mt-6 leading-relaxed text-ink-600">{product.description}</p>
          )}

          {/* Fragrance Notes */}
          {hasNotes && (
            <div className="mt-6 space-y-3 rounded-xl border border-ink-100 bg-ink-50 p-5">
              <h3 className="font-serif text-lg font-semibold text-ink-900">Fragrance Notes</h3>
              {product.fragrance_notes_top.length > 0 && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gold-600">Top Notes</span>
                  <p className="mt-1 text-sm text-ink-600">{product.fragrance_notes_top.join(', ')}</p>
                </div>
              )}
              {product.fragrance_notes_middle.length > 0 && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gold-600">Middle Notes</span>
                  <p className="mt-1 text-sm text-ink-600">{product.fragrance_notes_middle.join(', ')}</p>
                </div>
              )}
              {product.fragrance_notes_base.length > 0 && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gold-600">Base Notes</span>
                  <p className="mt-1 text-sm text-ink-600">{product.fragrance_notes_base.join(', ')}</p>
                </div>
              )}
            </div>
          )}

          {/* Quantity + Add to Cart */}
          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center rounded-full border border-ink-200">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="rounded-full p-2.5 text-ink-600 hover:text-ink-900"
              >
                <Minus size={18} />
              </button>
              <span className="w-10 text-center text-base font-semibold">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="rounded-full p-2.5 text-ink-600 hover:text-ink-900"
              >
                <Plus size={18} />
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0}
              className="btn-outline flex-1"
            >
              Add to Cart
            </button>
          </div>
          <button
            onClick={handleBuyNow}
            disabled={product.stock_quantity === 0}
            className="btn-primary mt-3 w-full"
          >
            Buy Now
          </button>
        </div>
      </div>

      {/* Reviews Section */}
      <section className="mt-16 border-t border-ink-100 pt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold text-ink-900">Customer Reviews</h2>
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="btn-ghost"
          >
            Write a Review
          </button>
        </div>

        {showReviewForm && (
          <form onSubmit={submitReview} className="mt-6 max-w-lg space-y-4 rounded-2xl border border-ink-100 bg-ink-50 p-6 animate-slide-up">
            <div>
              <label className="label-field">Your Name</label>
              <input
                type="text"
                required
                value={reviewForm.name}
                onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                className="input-field"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="label-field">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                  >
                    <StarRating rating={star <= reviewForm.rating ? star : 0} size={28} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label-field">Title (optional)</label>
              <input
                type="text"
                value={reviewForm.title}
                onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                className="input-field"
                placeholder="Summarize your experience"
              />
            </div>
            <div>
              <label className="label-field">Review (optional)</label>
              <textarea
                rows={4}
                value={reviewForm.body}
                onChange={(e) => setReviewForm({ ...reviewForm, body: e.target.value })}
                className="input-field"
                placeholder="Share your thoughts about this fragrance"
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}

        {reviews.length > 0 ? (
          <div className="mt-8 space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-ink-100 pb-6">
                <div className="flex items-center gap-3">
                  <StarRating rating={review.rating} />
                  <span className="text-sm font-medium text-ink-700">{review.customer_name}</span>
                </div>
                {review.title && <h4 className="mt-2 font-semibold text-ink-900">{review.title}</h4>}
                {review.body && <p className="mt-1 text-ink-600">{review.body}</p>}
                {review.admin_reply && (
                  <div className="mt-3 rounded-lg bg-ink-50 p-3">
                    <span className="text-xs font-semibold text-gold-600">Reply from Eloria Scents:</span>
                    <p className="mt-1 text-sm text-ink-600">{review.admin_reply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-ink-400">No reviews yet. Be the first to share your experience!</p>
        )}
      </section>
    </div>
  );
}
