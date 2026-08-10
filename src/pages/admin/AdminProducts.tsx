import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Upload, Star, Eye, EyeOff, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../../lib/utils';
import type { Product, Category } from '../../lib/types';

const ALL_BADGE_OPTIONS = ['Best Seller', 'Trending', 'Limited', 'Sale', 'New', 'Exclusive'];

export default function AdminProducts() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const emptyForm = {
    name: '', description: '', price: 0, category_id: '',
    stock_quantity: 0, is_featured: false, is_enabled: true, sort_order: 0,
    images: [] as string[],
    fragrance_notes_top: [] as string[],
    fragrance_notes_middle: [] as string[],
    fragrance_notes_base: [] as string[],
    badges: [] as string[],
    is_best_seller: false, is_trending: false, is_new_arrival: false, is_recommended: false,
    inspired_by: '' as string,
  };
  const [form, setForm] = useState(emptyForm);
  const [imageInput, setImageInput] = useState('');
  const [noteInputs, setNoteInputs] = useState({ top: '', middle: '', base: '' });
  const [uploading, setUploading] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .order('sort_order');
    setProducts(data ?? []);
    setLoading(false);
  };

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    setCategories(data ?? []);
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setImageInput('');
    setNoteInputs({ top: '', middle: '', base: '' });
    setShowForm(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description ?? '',
      price: product.price,
      category_id: product.category_id ?? '',
      stock_quantity: product.stock_quantity,
      is_featured: product.is_featured,
      is_enabled: product.is_enabled,
      sort_order: product.sort_order,
      images: product.images,
      fragrance_notes_top: product.fragrance_notes_top,
      fragrance_notes_middle: product.fragrance_notes_middle,
      fragrance_notes_base: product.fragrance_notes_base,
      badges: product.badges ?? [],
      is_best_seller: product.is_best_seller ?? false,
      is_trending: product.is_trending ?? false,
      is_new_arrival: product.is_new_arrival ?? false,
      is_recommended: product.is_recommended ?? false,
      inspired_by: product.inspired_by ?? '',
    });
    setImageInput('');
    setNoteInputs({ top: '', middle: '', base: '' });
    setShowForm(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('products').upload(fileName, file);
      if (!error) {
        const { data } = supabase.storage.from('products').getPublicUrl(fileName);
        urls.push(data.publicUrl);
      }
    }
    setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
    setUploading(false);
    if (urls.length > 0) showToast('Image uploaded');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      description: form.description || null,
      price: Number(form.price),
      category_id: form.category_id || null,
      stock_quantity: Number(form.stock_quantity),
      is_featured: form.is_featured,
      is_enabled: form.is_enabled,
      sort_order: Number(form.sort_order),
      images: form.images,
      fragrance_notes_top: form.fragrance_notes_top,
      fragrance_notes_middle: form.fragrance_notes_middle,
      fragrance_notes_base: form.fragrance_notes_base,
      badges: form.badges,
      is_best_seller: form.is_best_seller,
      is_trending: form.is_trending,
      is_new_arrival: form.is_new_arrival,
      is_recommended: form.is_recommended,
      inspired_by: form.inspired_by || null,
    };

    if (editing) {
      const { error } = await supabase.from('products').update(payload).eq('id', editing.id);
      if (error) { showToast('Failed to update product', 'error'); return; }
      showToast('Product updated');
    } else {
      const { error } = await supabase.from('products').insert(payload);
      if (error) { showToast('Failed to create product', 'error'); return; }
      showToast('Product created');
    }
    setShowForm(false);
    loadProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { showToast('Failed to delete', 'error'); return; }
    showToast('Product deleted');
    loadProducts();
  };

  const addNote = (type: 'top' | 'middle' | 'base') => {
    const val = noteInputs[type].trim();
    if (!val) return;
    setForm((f) => ({ ...f, [`fragrance_notes_${type}`]: [...f[`fragrance_notes_${type}`], val] }));
    setNoteInputs((n) => ({ ...n, [type]: '' }));
  };

  const removeNote = (type: 'top' | 'middle' | 'base', idx: number) => {
    setForm((f) => ({ ...f, [`fragrance_notes_${type}`]: f[`fragrance_notes_${type}`].filter((_, i) => i !== idx) }));
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-ink-900">Products</h1>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={18} /> Add Product
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-ink-100" />)}
        </div>
      ) : products.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wider text-ink-500">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Featured</th>
                <th className="px-4 py-3">Visible</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-ink-50 hover:bg-ink-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.images[0] ? (
                        <img src={p.images[0]} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-100">
                          <Star size={16} className="text-ink-300" />
                        </div>
                      )}
                      <span className="font-medium text-ink-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{p.category?.name ?? '—'}</td>
                  <td className="px-4 py-3 font-medium text-ink-900">{formatPrice(p.price)}</td>
                  <td className="px-4 py-3 text-ink-600">{p.stock_quantity}</td>
                  <td className="px-4 py-3">{p.is_featured && <span className="text-gold-600"><Star size={16} className="fill-gold-400" /></span>}</td>
                  <td className="px-4 py-3">{p.is_enabled ? <Eye size={16} className="text-emerald-500" /> : <EyeOff size={16} className="text-ink-300" />}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(p)} className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-900">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="rounded-lg p-2 text-ink-500 hover:bg-red-50 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-ink-200 py-16 text-center">
          <Package className="mx-auto mb-3 text-ink-300" size={32} />
          <p className="text-ink-400">No products yet.</p>
          <button onClick={openCreate} className="mt-4 text-sm font-medium text-gold-600 hover:text-gold-700">
            Add your first product
          </button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 animate-scale-in">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-ink-900">
                {editing ? 'Edit Product' : 'New Product'}
              </h2>
              <button onClick={() => setShowForm(false)} className="rounded-full p-2 hover:bg-ink-100">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label-field">Name *</label>
                  <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label-field">Inspired By (optional)</label>
                  <input type="text" value={form.inspired_by} onChange={(e) => setForm({ ...form, inspired_by: e.target.value })} className="input-field" placeholder="e.g. Silver Mountain Water" />
                </div>
                <div>
                  <label className="label-field">Price (PKR) *</label>
                  <input type="number" required min="0" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Category</label>
                  <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="input-field">
                    <option value="">Uncategorized</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-field">Stock Quantity</label>
                  <input type="number" min="0" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Sort Order</label>
                  <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className="input-field" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label-field">Description</label>
                  <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" />
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="label-field">Images</label>
                <div className="flex flex-wrap gap-2">
                  {form.images.map((img, i) => (
                    <div key={i} className="relative h-20 w-20 overflow-hidden rounded-lg border border-ink-200">
                      <img src={img} alt="" className="h-full w-full object-cover" />
                      <button type="button" onClick={() => setForm({ ...form, images: form.images.filter((_, idx) => idx !== i) })}
                        className="absolute right-0 top-0 rounded-bl-lg bg-black/60 p-1 text-white">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-ink-200 text-ink-400 transition hover:border-gold-400 hover:text-gold-600">
                    {uploading ? <span className="text-xs">Uploading...</span> : <Upload size={20} />}
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
                  </label>
                </div>
                <div className="mt-2 flex gap-2">
                  <input type="url" value={imageInput} onChange={(e) => setImageInput(e.target.value)} placeholder="Or paste image URL" className="input-field text-xs" />
                  <button type="button" onClick={() => { if (imageInput.trim()) { setForm({ ...form, images: [...form.images, imageInput.trim()] }); setImageInput(''); } }}
                    className="shrink-0 rounded-lg bg-ink-100 px-3 py-2 text-xs font-medium text-ink-700 hover:bg-ink-200">
                    Add URL
                  </button>
                </div>
              </div>

              {/* Fragrance Notes */}
              {(['top', 'middle', 'base'] as const).map((type) => (
                <div key={type}>
                  <label className="label-field">{type.charAt(0).toUpperCase() + type.slice(1)} Notes</label>
                  <div className="flex flex-wrap gap-2">
                    {form[`fragrance_notes_${type}`].map((note, i) => (
                      <span key={i} className="flex items-center gap-1 rounded-full bg-ink-100 px-3 py-1 text-xs text-ink-700">
                        {note}
                        <button type="button" onClick={() => removeNote(type, i)}><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={noteInputs[type]}
                      onChange={(e) => setNoteInputs({ ...noteInputs, [type]: e.target.value })}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addNote(type); } }}
                      placeholder={`Add ${type} note`}
                      className="input-field text-xs"
                    />
                    <button type="button" onClick={() => addNote(type)} className="shrink-0 rounded-lg bg-ink-100 px-3 py-2 text-xs font-medium text-ink-700 hover:bg-ink-200">Add</button>
                  </div>
                </div>
              ))}

              {/* Toggles */}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
                  <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="h-4 w-4 rounded text-gold-400" />
                  Featured
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
                  <input type="checkbox" checked={form.is_best_seller} onChange={(e) => setForm({ ...form, is_best_seller: e.target.checked })} className="h-4 w-4 rounded text-gold-400" />
                  Best Seller
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
                  <input type="checkbox" checked={form.is_trending} onChange={(e) => setForm({ ...form, is_trending: e.target.checked })} className="h-4 w-4 rounded text-gold-400" />
                  Trending
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
                  <input type="checkbox" checked={form.is_new_arrival} onChange={(e) => setForm({ ...form, is_new_arrival: e.target.checked })} className="h-4 w-4 rounded text-gold-400" />
                  New Arrival
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
                  <input type="checkbox" checked={form.is_recommended} onChange={(e) => setForm({ ...form, is_recommended: e.target.checked })} className="h-4 w-4 rounded text-gold-400" />
                  Recommended
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
                  <input type="checkbox" checked={form.is_enabled} onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })} className="h-4 w-4 rounded text-gold-400" />
                  Visible
                </label>
              </div>

              {/* Badges */}
              <div>
                <label className="label-field">Product Badges</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_BADGE_OPTIONS.map((badge) => (
                    <button
                      key={badge}
                      type="button"
                      onClick={() => setForm((f) => ({
                        ...f,
                        badges: f.badges.includes(badge) ? f.badges.filter((b) => b !== badge) : [...f.badges, badge],
                      }))}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        form.badges.includes(badge) ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                      }`}
                    >
                      {badge}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-ink-100 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
                <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
