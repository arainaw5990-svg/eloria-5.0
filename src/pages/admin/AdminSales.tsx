import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Copy, Calendar, Eye, EyeOff, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../lib/utils';
import type { Sale } from '../../lib/types';

const emptyForm = {
  name: '', description: '', banner_url: '', badge_text: 'SALE', badge_color: '#dc2626',
  discount_type: 'percentage' as 'percentage' | 'fixed', discount_value: 10,
  start_date: '', end_date: '', is_enabled: true,
  productIds: [] as string[],
};

export default function AdminSales() {
  const { showToast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const [saleRes, prodRes] = await Promise.all([
      supabase.from('sales').select('*, sale_products(product_id)').order('created_at', { ascending: false }),
      supabase.from('products').select('id, name').order('name'),
    ]);
    setSales(saleRes.data ?? []);
    setProducts(prodRes.data ?? []);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    const now = new Date();
    const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    setForm({
      ...emptyForm,
      start_date: now.toISOString().slice(0, 16),
      end_date: week.toISOString().slice(0, 16),
    });
    setShowForm(true);
  };

  const openEdit = (sale: Sale) => {
    setEditing(sale);
    setForm({
      name: sale.name,
      description: sale.description ?? '',
      banner_url: sale.banner_url ?? '',
      badge_text: sale.badge_text,
      badge_color: sale.badge_color,
      discount_type: sale.discount_type,
      discount_value: sale.discount_value,
      start_date: new Date(sale.start_date).toISOString().slice(0, 16),
      end_date: new Date(sale.end_date).toISOString().slice(0, 16),
      is_enabled: sale.is_enabled,
      productIds: sale.sale_products?.map((sp) => sp.product_id) ?? [],
    });
    setShowForm(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `sale-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('brand').upload(fileName, file);
    if (!error) {
      const { data } = supabase.storage.from('brand').getPublicUrl(fileName);
      setForm({ ...form, banner_url: data.publicUrl });
      showToast('Image uploaded');
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      description: form.description || null,
      banner_url: form.banner_url || null,
      badge_text: form.badge_text,
      badge_color: form.badge_color,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      start_date: new Date(form.start_date).toISOString(),
      end_date: new Date(form.end_date).toISOString(),
      is_enabled: form.is_enabled,
    };

    if (editing) {
      const { error } = await supabase.from('sales').update(payload).eq('id', editing.id);
      if (error) { showToast('Failed to update sale', 'error'); return; }
      await supabase.from('sale_products').delete().eq('sale_id', editing.id);
      if (form.productIds.length > 0) {
        await supabase.from('sale_products').insert(form.productIds.map((pid) => ({ sale_id: editing.id, product_id: pid })));
      }
      showToast('Sale updated');
    } else {
      const { data, error } = await supabase.from('sales').insert(payload).select('id').single();
      if (error) { showToast('Failed to create sale', 'error'); return; }
      if (form.productIds.length > 0) {
        await supabase.from('sale_products').insert(form.productIds.map((pid) => ({ sale_id: data.id, product_id: pid })));
      }
      showToast('Sale created');
    }
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this sale?')) return;
    const { error } = await supabase.from('sales').delete().eq('id', id);
    if (error) { showToast('Failed to delete', 'error'); return; }
    showToast('Sale deleted');
    load();
  };

  const handleDuplicate = async (sale: Sale) => {
    const { data, error } = await supabase.from('sales').insert({
      name: `${sale.name} (Copy)`,
      description: sale.description,
      banner_url: sale.banner_url,
      badge_text: sale.badge_text,
      badge_color: sale.badge_color,
      discount_type: sale.discount_type,
      discount_value: sale.discount_value,
      start_date: sale.start_date,
      end_date: sale.end_date,
      is_enabled: false,
    }).select('id').single();
    if (error) { showToast('Failed to duplicate', 'error'); return; }
    const productIds = sale.sale_products?.map((sp) => sp.product_id) ?? [];
    if (productIds.length > 0) {
      await supabase.from('sale_products').insert(productIds.map((pid) => ({ sale_id: data.id, product_id: pid })));
    }
    showToast('Sale duplicated');
    load();
  };

  const toggleProduct = (pid: string) => {
    setForm((f) => ({
      ...f,
      productIds: f.productIds.includes(pid) ? f.productIds.filter((id) => id !== pid) : [...f.productIds, pid],
    }));
  };

  const isCurrentlyActive = (sale: Sale) => {
    const now = new Date();
    return sale.is_enabled && new Date(sale.start_date) <= now && new Date(sale.end_date) >= now;
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-ink-900">Sales</h1>
        <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Add Sale</button>
      </div>

      {sales.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sales.map((sale) => {
            const active = isCurrentlyActive(sale);
            return (
              <div key={sale.id} className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
                {sale.banner_url && <img src={sale.banner_url} alt="" className="h-32 w-full object-cover" />}
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-ink-900">{sale.name}</h3>
                      <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        active ? 'bg-emerald-100 text-emerald-700' : sale.is_enabled ? 'bg-amber-100 text-amber-700' : 'bg-ink-100 text-ink-500'
                      }`}>
                        {active ? 'Active' : sale.is_enabled ? 'Scheduled' : 'Disabled'}
                      </span>
                    </div>
                    <span className="rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: sale.badge_color }}>
                      {sale.badge_text}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-ink-600">
                    {sale.discount_type === 'percentage' ? `${sale.discount_value}% off` : `${sale.discount_value} PKR off`}
                    {' · '}{sale.sale_products?.length ?? 0} products
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-ink-500">
                    <Calendar size={14} />
                    {formatDate(sale.start_date)} → {formatDate(sale.end_date)}
                  </div>
                  <div className="mt-4 flex gap-1">
                    <button onClick={() => openEdit(sale)} className="rounded-lg p-2 text-ink-500 hover:bg-ink-100"><Pencil size={16} /></button>
                    <button onClick={() => handleDuplicate(sale)} className="rounded-lg p-2 text-ink-500 hover:bg-ink-100"><Copy size={16} /></button>
                    <button onClick={() => handleDelete(sale.id)} className="rounded-lg p-2 text-ink-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-ink-200 py-16 text-center">
          <p className="text-ink-400">No sales yet.</p>
          <button onClick={openCreate} className="mt-4 text-sm font-medium text-gold-600 hover:text-gold-700">Create your first sale</button>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 animate-scale-in">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-ink-900">{editing ? 'Edit Sale' : 'New Sale'}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-full p-2 hover:bg-ink-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label-field">Sale Name *</label>
                  <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Discount Type</label>
                  <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value as 'percentage' | 'fixed' })} className="input-field">
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount (PKR)</option>
                  </select>
                </div>
                <div>
                  <label className="label-field">Discount Value *</label>
                  <input type="number" required min="0" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Start Date *</label>
                  <input type="datetime-local" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="label-field">End Date *</label>
                  <input type="datetime-local" required value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Sale Badge Text</label>
                  <input type="text" value={form.badge_text} onChange={(e) => setForm({ ...form, badge_text: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Sale Badge Color</label>
                  <input type="color" value={form.badge_color} onChange={(e) => setForm({ ...form, badge_color: e.target.value })} className="h-11 w-full rounded-lg border border-ink-200" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label-field">Description</label>
                  <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label-field">Sale Banner</label>
                  <div className="flex items-center gap-3">
                    {form.banner_url && <img src={form.banner_url} alt="" className="h-16 w-24 rounded-lg object-cover" />}
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink-200 px-3 py-2.5 text-sm text-ink-600 hover:bg-ink-50">
                      <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="label-field">Select Products ({form.productIds.length} selected)</label>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-ink-200 p-2">
                  {products.map((p) => (
                    <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded p-1.5 hover:bg-ink-50">
                      <input type="checkbox" checked={form.productIds.includes(p.id)} onChange={() => toggleProduct(p.id)} className="h-4 w-4 rounded text-gold-400" />
                      <span className="text-sm text-ink-700">{p.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
                <input type="checkbox" checked={form.is_enabled} onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })} className="h-4 w-4 rounded text-gold-400" />
                {form.is_enabled ? <Eye size={16} /> : <EyeOff size={16} />} Enabled
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
