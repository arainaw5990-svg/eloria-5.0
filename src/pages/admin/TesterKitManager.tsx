import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Eye, EyeOff, FlaskRound } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import type { TesterFragrance } from '../../lib/types';

const emptyForm = { name: '', is_enabled: true, sort_order: 0 };

export default function TesterKitManager() {
  const { showToast } = useToast();
  const [fragrances, setFragrances] = useState<TesterFragrance[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    const { data } = await supabase.from('tester_fragrances').select('*').order('sort_order');
    setFragrances(data ?? []);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditingId(null); setForm({ ...emptyForm, sort_order: fragrances.length }); setShowForm(true); };

  const openEdit = (f: TesterFragrance) => {
    setEditingId(f.id);
    setForm({ name: f.name, is_enabled: f.is_enabled, sort_order: f.sort_order });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: form.name, is_enabled: form.is_enabled, sort_order: Number(form.sort_order) };
    if (editingId) {
      const { error } = await supabase.from('tester_fragrances').update(payload).eq('id', editingId);
      if (error) { showToast('Failed to update', 'error'); return; }
      showToast('Updated');
    } else {
      const { error } = await supabase.from('tester_fragrances').insert(payload);
      if (error) { showToast('Failed to add', 'error'); return; }
      showToast('Added');
    }
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this tester fragrance?')) return;
    const { error } = await supabase.from('tester_fragrances').delete().eq('id', id);
    if (error) { showToast('Failed to delete', 'error'); return; }
    showToast('Deleted');
    load();
  };

  const toggleEnabled = async (f: TesterFragrance) => {
    await supabase.from('tester_fragrances').update({ is_enabled: !f.is_enabled }).eq('id', f.id);
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-ink-900">Tester Kit</h1>
        <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Add Tester Fragrance</button>
      </div>

      {fragrances.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wider text-ink-500">
                <th className="px-4 py-3">Fragrance Name</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fragrances.map((f) => (
                <tr key={f.id} className="border-b border-ink-50 hover:bg-ink-50/50">
                  <td className="px-4 py-3 font-medium text-ink-900">
                    <div className="flex items-center gap-2">
                      <FlaskRound size={16} className="text-gold-500" />
                      {f.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-500">{f.sort_order}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleEnabled(f)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${f.is_enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-ink-100 text-ink-500'}`}
                    >
                      {f.is_enabled ? <Eye size={12} /> : <EyeOff size={12} />}
                      {f.is_enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(f)} className="rounded-lg p-2 text-ink-500 hover:bg-ink-100"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(f.id)} className="rounded-lg p-2 text-ink-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-ink-200 py-16 text-center">
          <FlaskRound size={32} className="mx-auto mb-3 text-ink-300" />
          <p className="text-ink-400">No tester fragrances yet.</p>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 animate-scale-in">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-ink-900">{editingId ? 'Edit' : 'Add'} Tester Fragrance</h2>
              <button onClick={() => setShowForm(false)} className="rounded-full p-2 hover:bg-ink-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-field">Fragrance Name *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="e.g. Creed Aventus" />
              </div>
              <div>
                <label className="label-field">Sort Order</label>
                <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className="input-field" />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
                <input type="checkbox" checked={form.is_enabled} onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })} className="h-4 w-4 rounded text-gold-400" /> Enabled
              </label>
              <div className="flex justify-end gap-3 border-t border-ink-100 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
                <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
