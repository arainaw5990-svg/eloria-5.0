import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../lib/utils';
import type { Coupon } from '../../lib/types';

const emptyForm = {
  code: '', description: '', discount_type: 'percentage' as 'percentage' | 'fixed',
  discount_value: 10, max_discount: '', min_order: 0, usage_limit: '',
  expires_at: '', is_enabled: true,
};

export default function AdminCoupons() {
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    setCoupons(data ?? []);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code, description: c.description ?? '', discount_type: c.discount_type,
      discount_value: c.discount_value, max_discount: c.max_discount?.toString() ?? '',
      min_order: c.min_order, usage_limit: c.usage_limit?.toString() ?? '',
      expires_at: c.expires_at ? new Date(c.expires_at).toISOString().slice(0, 10) : '', is_enabled: c.is_enabled,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code: form.code.toUpperCase().trim(),
      description: form.description || null,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      max_discount: form.max_discount ? Number(form.max_discount) : null,
      min_order: Number(form.min_order),
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      is_enabled: form.is_enabled,
    };
    if (editing) {
      const { error } = await supabase.from('coupons').update(payload).eq('id', editing.id);
      if (error) { showToast('Failed to update', 'error'); return; }
      showToast('Coupon updated');
    } else {
      const { error } = await supabase.from('coupons').insert(payload);
      if (error) { showToast('Failed to create coupon', 'error'); return; }
      showToast('Coupon created');
    }
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) { showToast('Failed to delete', 'error'); return; }
    showToast('Coupon deleted');
    load();
  };

  const isExpired = (c: Coupon) => c.expires_at && new Date(c.expires_at) < new Date();
  const isExhausted = (c: Coupon) => c.usage_limit && c.used_count >= c.usage_limit;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-ink-900">Coupons</h1>
        <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Add Coupon</button>
      </div>

      {coupons.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wider text-ink-500">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Min Order</th>
                <th className="px-4 py-3">Usage</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b border-ink-50 hover:bg-ink-50/50">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-ink-900">{c.code}</span>
                    {c.description && <p className="text-xs text-ink-400">{c.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-ink-600">
                    {c.discount_type === 'percentage' ? `${c.discount_value}%` : `${c.discount_value} PKR`}
                    {c.max_discount && <span className="block text-xs text-ink-400">max {c.max_discount}</span>}
                  </td>
                  <td className="px-4 py-3 text-ink-600">{c.min_order}</td>
                  <td className="px-4 py-3 text-ink-600">{c.used_count}/{c.usage_limit ?? '∞'}</td>
                  <td className="px-4 py-3 text-ink-500">{c.expires_at ? formatDate(c.expires_at) : 'Never'}</td>
                  <td className="px-4 py-3">
                    {!c.is_enabled ? <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs text-ink-500">Disabled</span>
                      : isExpired(c) ? <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">Expired</span>
                      : isExhausted(c) ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Exhausted</span>
                      : <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">Active</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(c)} className="rounded-lg p-2 text-ink-500 hover:bg-ink-100"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(c.id)} className="rounded-lg p-2 text-ink-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-ink-200 py-16 text-center">
          <p className="text-ink-400">No coupons yet.</p>
          <button onClick={openCreate} className="mt-4 text-sm font-medium text-gold-600 hover:text-gold-700">Create your first coupon</button>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 animate-scale-in">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-ink-900">{editing ? 'Edit Coupon' : 'New Coupon'}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-full p-2 hover:bg-ink-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-field">Coupon Code *</label>
                <input type="text" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="input-field font-mono" placeholder="SAVE20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Discount Type</label>
                  <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value as 'percentage' | 'fixed' })} className="input-field">
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="label-field">Discount Value *</label>
                  <input type="number" required min="0" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Max Discount (optional)</label>
                  <input type="number" min="0" value={form.max_discount} onChange={(e) => setForm({ ...form, max_discount: e.target.value })} className="input-field" placeholder="For percentage" />
                </div>
                <div>
                  <label className="label-field">Min Order (PKR)</label>
                  <input type="number" min="0" value={form.min_order} onChange={(e) => setForm({ ...form, min_order: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Usage Limit (optional)</label>
                  <input type="number" min="0" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} className="input-field" placeholder="Empty = unlimited" />
                </div>
                <div>
                  <label className="label-field">Expiry Date</label>
                  <input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="label-field">Description (optional)</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
                <input type="checkbox" checked={form.is_enabled} onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })} className="h-4 w-4 rounded text-gold-400" /> Enabled
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
