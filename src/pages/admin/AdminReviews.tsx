import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Eye, EyeOff, ArrowUp, ArrowDown, Star, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../lib/utils';
import StarRating from '../../components/StarRating';
import type { Review, Product } from '../../lib/types';

const emptyForm = {
  customer_name: '',
  rating: 5,
  title: '',
  body: '',
  product_id: '',
  review_date: '',
  sort_order: 0,
  is_visible: true,
};

export default function AdminReviews() {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<(Review & { product?: Product })[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Review | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    const [revRes, prodRes] = await Promise.all([
      supabase.from('reviews').select('*, product:products(*)').order('sort_order', { ascending: false }),
      supabase.from('products').select('id, name').order('name'),
    ]);
    setReviews(revRes.data ?? []);
    setProducts(prodRes.data ?? []);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (review: Review) => {
    setEditing(review);
    setForm({
      customer_name: review.customer_name,
      rating: review.rating,
      title: review.title ?? '',
      body: review.body ?? '',
      product_id: review.product_id ?? '',
      review_date: review.review_date ? new Date(review.review_date).toISOString().slice(0, 10) : '',
      sort_order: review.sort_order ?? 0,
      is_visible: review.is_visible ?? true,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      customer_name: form.customer_name,
      rating: Number(form.rating),
      title: form.title || null,
      body: form.body || null,
      product_id: form.product_id || null,
      review_date: form.review_date ? new Date(form.review_date).toISOString() : null,
      sort_order: Number(form.sort_order),
      is_visible: form.is_visible,
      is_approved: true,
    };
    if (editing) {
      const { error } = await supabase.from('reviews').update(payload).eq('id', editing.id);
      if (error) { showToast('Failed to update review', 'error'); return; }
      showToast('Review updated');
    } else {
      const { error } = await supabase.from('reviews').insert(payload);
      if (error) { showToast('Failed to create review', 'error'); return; }
      showToast('Review added');
    }
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (error) { showToast('Failed to delete', 'error'); return; }
    showToast('Review deleted');
    load();
  };

  const toggleVisible = async (review: Review) => {
    await supabase.from('reviews').update({ is_visible: !review.is_visible }).eq('id', review.id);
    load();
  };

  const move = async (review: Review, dir: -1 | 1) => {
    const newOrder = (review.sort_order ?? 0) + dir;
    await supabase.from('reviews').update({ sort_order: newOrder }).eq('id', review.id);
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-ink-900">Reviews</h1>
        <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Add Review</button>
      </div>

      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-2xl border border-ink-100 bg-white p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <StarRating rating={review.rating} />
                    <span className="text-sm font-semibold text-ink-900">{review.customer_name}</span>
                    {!review.is_visible && (
                      <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-500">Hidden</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-ink-500">
                    {review.product ? `on ${review.product.name} · ` : ''}
                    {review.review_date ? formatDate(review.review_date) : formatDate(review.created_at)}
                  </p>
                  {review.title && <h4 className="mt-3 font-semibold text-ink-900">{review.title}</h4>}
                  {review.body && <p className="mt-1 text-sm text-ink-600">{review.body}</p>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => move(review, 1)} className="rounded-lg p-2 text-ink-400 hover:bg-ink-100" title="Move up"><ArrowUp size={16} /></button>
                  <button onClick={() => move(review, -1)} className="rounded-lg p-2 text-ink-400 hover:bg-ink-100" title="Move down"><ArrowDown size={16} /></button>
                  <button onClick={() => toggleVisible(review)} className={`rounded-lg p-2 ${review.is_visible ? 'text-emerald-600 hover:bg-emerald-50' : 'text-ink-300 hover:bg-ink-100'}`} title={review.is_visible ? 'Hide' : 'Show'}>
                    {review.is_visible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button onClick={() => openEdit(review)} className="rounded-lg p-2 text-ink-500 hover:bg-ink-100" title="Edit"><Pencil size={16} /></button>
                  <button onClick={() => handleDelete(review.id)} className="rounded-lg p-2 text-ink-500 hover:bg-red-50 hover:text-red-600" title="Delete"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-ink-200 py-16 text-center">
          <MessageSquare size={32} className="mx-auto mb-3 text-ink-300" />
          <p className="text-ink-400">No reviews yet.</p>
          <button onClick={openCreate} className="mt-4 text-sm font-medium text-gold-600 hover:text-gold-700">Add your first review</button>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-8 w-full max-w-lg rounded-2xl bg-white p-6 animate-scale-in">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-ink-900">{editing ? 'Edit Review' : 'Add Review'}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-full p-2 hover:bg-ink-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-field">Customer Name *</label>
                  <input type="text" required value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Star Rating</label>
                  <div className="flex items-center gap-1 py-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setForm({ ...form, rating: star })}>
                        <Star size={24} className={star <= form.rating ? 'fill-gold-400 text-gold-400' : 'fill-ink-100 text-ink-200'} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="label-field">Review Title (optional)</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="label-field">Review Text</label>
                <textarea rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="input-field" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-field">Product (optional)</label>
                  <select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} className="input-field">
                    <option value="">None (homepage review)</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-field">Display Date (optional)</label>
                  <input type="date" value={form.review_date} onChange={(e) => setForm({ ...form, review_date: e.target.value })} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Sort Order</label>
                  <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className="input-field" />
                </div>
                <label className="flex items-end gap-2 pb-2 text-sm font-medium text-ink-700">
                  <input type="checkbox" checked={form.is_visible} onChange={(e) => setForm({ ...form, is_visible: e.target.checked })} className="h-4 w-4 rounded text-gold-400" /> Visible
                </label>
              </div>
              <div className="flex justify-end gap-3 border-t border-ink-100 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
                <button type="submit" className="btn-primary">{editing ? 'Update' : 'Add Review'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
