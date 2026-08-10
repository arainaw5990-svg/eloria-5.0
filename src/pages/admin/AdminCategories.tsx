import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Upload, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import type { Category } from '../../lib/types';

export default function AdminCategories() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', sort_order: 0, is_visible: true, image_url: '' });
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    setCategories(data ?? []);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', sort_order: 0, is_visible: true, image_url: '' });
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, sort_order: cat.sort_order, is_visible: cat.is_visible, image_url: cat.image_url ?? '' });
    setShowForm(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('brand').upload(fileName, file);
    if (!error) {
      const { data } = supabase.storage.from('brand').getPublicUrl(fileName);
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
      showToast('Image uploaded');
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      sort_order: Number(form.sort_order),
      is_visible: form.is_visible,
      image_url: form.image_url || null,
    };
    if (editing) {
      const { error } = await supabase.from('categories').update(payload).eq('id', editing.id);
      if (error) { showToast('Failed to update', 'error'); return; }
      showToast('Category updated');
    } else {
      const { error } = await supabase.from('categories').insert(payload);
      if (error) { showToast('Failed to create', 'error'); return; }
      showToast('Category created');
    }
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? Products in this category will be uncategorized.')) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) { showToast('Failed to delete', 'error'); return; }
    showToast('Category deleted');
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-ink-900">Categories</h1>
        <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Add Category</button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <div key={cat.id} className="rounded-2xl border border-ink-100 bg-white p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {cat.image_url ? (
                  <img src={cat.image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-ink-100 text-ink-400">
                    <EyeOff size={20} />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-ink-900">{cat.name}</h3>
                  <p className="text-xs text-ink-500">/{cat.slug}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(cat)} className="rounded-lg p-2 text-ink-500 hover:bg-ink-100"><Pencil size={16} /></button>
                <button onClick={() => handleDelete(cat.id)} className="rounded-lg p-2 text-ink-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-ink-500">
              <span>Order: {cat.sort_order}</span>
              <span className={`flex items-center gap-1 ${cat.is_visible ? 'text-emerald-600' : 'text-ink-400'}`}>
                {cat.is_visible ? <Eye size={14} /> : <EyeOff size={14} />}
                {cat.is_visible ? 'Visible' : 'Hidden'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 animate-scale-in">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-ink-900">{editing ? 'Edit Category' : 'New Category'}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-full p-2 hover:bg-ink-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-field">Name *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="label-field">Sort Order</label>
                <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className="input-field" />
              </div>
              <div>
                <label className="label-field">Image</label>
                <div className="flex items-center gap-3">
                  {form.image_url && <img src={form.image_url} alt="" className="h-16 w-16 rounded-lg object-cover" />}
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink-200 px-4 py-2.5 text-sm text-ink-600 hover:bg-ink-50">
                    <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                  </label>
                </div>
                <input type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="Or paste image URL" className="input-field mt-2 text-xs" />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
                <input type="checkbox" checked={form.is_visible} onChange={(e) => setForm({ ...form, is_visible: e.target.checked })} className="h-4 w-4 rounded text-gold-400" />
                Visible on storefront
              </label>
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
