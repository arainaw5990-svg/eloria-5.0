import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, FlaskConical, Beaker, Droplet, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import type { CustomScentFragrance, BottleSize, Concentration } from '../../lib/types';

type Tab = 'fragrances' | 'bottles' | 'concentrations';

export default function CustomScentManager() {
  const [tab, setTab] = useState<Tab>('fragrances');
  const { showToast } = useToast();

  const [fragrances, setFragrances] = useState<CustomScentFragrance[]>([]);
  const [bottles, setBottles] = useState<BottleSize[]>([]);
  const [concentrations, setConcentrations] = useState<Concentration[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  const load = async () => {
    const [f, b, c] = await Promise.all([
      supabase.from('custom_scent_fragrances').select('*').order('sort_order'),
      supabase.from('bottle_sizes').select('*').order('sort_order'),
      supabase.from('concentrations').select('*').order('sort_order'),
    ]);
    setFragrances(f.data ?? []);
    setBottles(b.data ?? []);
    setConcentrations(c.data ?? []);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    if (tab === 'fragrances') setForm({ name: '', is_enabled: true, sort_order: fragrances.length });
    else if (tab === 'bottles') setForm({ label: '', volume_ml: 0, sort_order: bottles.length });
    else setForm({ percentage: 20, is_enabled: true, sort_order: concentrations.length });
    setShowForm(true);
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    if (tab === 'fragrances') setForm({ name: item.name, is_enabled: item.is_enabled, sort_order: item.sort_order });
    else if (tab === 'bottles') setForm({ label: item.label, volume_ml: item.volume_ml, sort_order: item.sort_order });
    else setForm({ percentage: item.percentage, is_enabled: item.is_enabled, sort_order: item.sort_order });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const table = tab === 'fragrances' ? 'custom_scent_fragrances' : tab === 'bottles' ? 'bottle_sizes' : 'concentrations';
    const payload: Record<string, any> = { sort_order: Number(form.sort_order) };
    if (tab === 'fragrances') { payload.name = form.name; payload.is_enabled = form.is_enabled; }
    else if (tab === 'bottles') { payload.label = form.label; payload.volume_ml = Number(form.volume_ml); }
    else { payload.percentage = Number(form.percentage); payload.is_enabled = form.is_enabled; }

    if (editingId) {
      const { error } = await supabase.from(table).update(payload).eq('id', editingId);
      if (error) { showToast('Failed to update', 'error'); return; }
      showToast('Updated successfully');
    } else {
      const { error } = await supabase.from(table).insert(payload);
      if (error) { showToast('Failed to create', 'error'); return; }
      showToast('Added successfully');
    }
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    const table = tab === 'fragrances' ? 'custom_scent_fragrances' : tab === 'bottles' ? 'bottle_sizes' : 'concentrations';
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) { showToast('Failed to delete', 'error'); return; }
    showToast('Deleted');
    load();
  };

  const toggleEnabled = async (id: string, current: boolean) => {
    const table = tab === 'fragrances' ? 'custom_scent_fragrances' : 'concentrations';
    await supabase.from(table).update({ is_enabled: !current }).eq('id', id);
    load();
  };

  const tabs = [
    { key: 'fragrances' as Tab, label: 'Fragrances', icon: FlaskConical, count: fragrances.length },
    { key: 'bottles' as Tab, label: 'Bottle Sizes', icon: Beaker, count: bottles.length },
    { key: 'concentrations' as Tab, label: 'Concentrations', icon: Droplet, count: concentrations.length },
  ];

  const currentItems = tab === 'fragrances' ? fragrances : tab === 'bottles' ? bottles : concentrations;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-ink-900">Create Your Own Scent</h1>
        <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Add {tab === 'fragrances' ? 'Fragrance' : tab === 'bottles' ? 'Bottle Size' : 'Concentration'}</button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
              tab === t.key ? 'bg-ink-900 text-white' : 'bg-white text-ink-600 border border-ink-200 hover:bg-ink-50'
            }`}
          >
            <t.icon size={16} /> {t.label}
            <span className={`rounded-full px-1.5 py-0.5 text-xs ${tab === t.key ? 'bg-white/20' : 'bg-ink-100'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* List */}
      {currentItems.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wider text-ink-500">
                <th className="px-4 py-3">{tab === 'fragrances' ? 'Fragrance Name' : tab === 'bottles' ? 'Label' : 'Percentage'}</th>
                {tab === 'bottles' && <th className="px-4 py-3">Volume (ml)</th>}
                <th className="px-4 py-3">Order</th>
                {(tab === 'fragrances' || tab === 'concentrations') && <th className="px-4 py-3">Status</th>}
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item: any) => (
                <tr key={item.id} className="border-b border-ink-50 hover:bg-ink-50/50">
                  <td className="px-4 py-3 font-medium text-ink-900">
                    {tab === 'fragrances' && item.name}
                    {tab === 'bottles' && item.label}
                    {tab === 'concentrations' && `${item.percentage}%`}
                  </td>
                  {tab === 'bottles' && <td className="px-4 py-3 text-ink-600">{item.volume_ml}</td>}
                  <td className="px-4 py-3 text-ink-500">{item.sort_order}</td>
                  {(tab === 'fragrances' || tab === 'concentrations') && (
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleEnabled(item.id, item.is_enabled)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          item.is_enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-ink-100 text-ink-500'
                        }`}
                      >
                        {item.is_enabled ? <Eye size={12} /> : <EyeOff size={12} />}
                        {item.is_enabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(item)} className="rounded-lg p-2 text-ink-500 hover:bg-ink-100"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(item.id)} className="rounded-lg p-2 text-ink-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-ink-200 py-16 text-center">
          <p className="text-ink-400">No {tab === 'fragrances' ? 'fragrances' : tab === 'bottles' ? 'bottle sizes' : 'concentrations'} yet.</p>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 animate-scale-in">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-ink-900">
                {editingId ? 'Edit' : 'Add'} {tab === 'fragrances' ? 'Fragrance' : tab === 'bottles' ? 'Bottle Size' : 'Concentration'}
              </h2>
              <button onClick={() => setShowForm(false)} className="rounded-full p-2 hover:bg-ink-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === 'fragrances' && (
                <div>
                  <label className="label-field">Fragrance Name *</label>
                  <input type="text" required value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="e.g. Creed Aventus" />
                </div>
              )}
              {tab === 'bottles' && (
                <>
                  <div>
                    <label className="label-field">Label *</label>
                    <input type="text" required value={form.label ?? ''} onChange={(e) => setForm({ ...form, label: e.target.value })} className="input-field" placeholder="e.g. 50 ml" />
                  </div>
                  <div>
                    <label className="label-field">Volume in ml *</label>
                    <input type="number" required min="0" value={form.volume_ml ?? 0} onChange={(e) => setForm({ ...form, volume_ml: Number(e.target.value) })} className="input-field" />
                  </div>
                </>
              )}
              {tab === 'concentrations' && (
                <div>
                  <label className="label-field">Percentage *</label>
                  <input type="number" required min="1" max="100" value={form.percentage ?? 20} onChange={(e) => setForm({ ...form, percentage: Number(e.target.value) })} className="input-field" />
                </div>
              )}
              <div>
                <label className="label-field">Sort Order</label>
                <input type="number" value={form.sort_order ?? 0} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className="input-field" />
              </div>
              {(tab === 'fragrances' || tab === 'concentrations') && (
                <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
                  <input type="checkbox" checked={form.is_enabled ?? true} onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })} className="h-4 w-4 rounded text-gold-400" /> Enabled
                </label>
              )}
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
