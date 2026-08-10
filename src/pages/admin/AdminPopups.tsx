import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Upload, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import type { Popup } from '../../lib/types';

const emptyForm = {
  title: '', description: '', image_url: '', button_text: '', button_link: '',
  frequency: 'once' as 'once' | 'every_visit', delay_seconds: 5, is_enabled: true,
};

export default function AdminPopups() {
  const { showToast } = useToast();
  const [popups, setPopups] = useState<Popup[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Popup | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('popups').select('*').order('created_at', { ascending: false });
    setPopups(data ?? []);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };

  const openEdit = (p: Popup) => {
    setEditing(p);
    setForm({
      title: p.title, description: p.description ?? '', image_url: p.image_url ?? '',
      button_text: p.button_text ?? '', button_link: p.button_link ?? '',
      frequency: p.frequency, delay_seconds: p.delay_seconds, is_enabled: p.is_enabled,
    });
    setShowForm(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `popup-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('brand').upload(fileName, file);
    if (!error) {
      const { data } = supabase.storage.from('brand').getPublicUrl(fileName);
      setForm({ ...form, image_url: data.publicUrl });
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: form.title,
      description: form.description || null,
      image_url: form.image_url || null,
      button_text: form.button_text || null,
      button_link: form.button_link || null,
      frequency: form.frequency,
      delay_seconds: Number(form.delay_seconds),
      is_enabled: form.is_enabled,
    };
    if (editing) {
      const { error } = await supabase.from('popups').update(payload).eq('id', editing.id);
      if (error) { showToast('Failed to update', 'error'); return; }
      showToast('Popup updated');
    } else {
      const { error } = await supabase.from('popups').insert(payload);
      if (error) { showToast('Failed to create', 'error'); return; }
      showToast('Popup created');
    }
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this popup?')) return;
    const { error } = await supabase.from('popups').delete().eq('id', id);
    if (error) { showToast('Failed to delete', 'error'); return; }
    showToast('Popup deleted');
    load();
  };

  const toggleEnabled = async (p: Popup) => {
    await supabase.from('popups').update({ is_enabled: !p.is_enabled }).eq('id', p.id);
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-ink-900">Popups</h1>
        <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Add Popup</button>
      </div>

      {popups.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {popups.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
              {p.image_url && <img src={p.image_url} alt="" className="h-32 w-full object-cover" />}
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <h3 className="font-serif text-lg font-bold text-ink-900">{p.title}</h3>
                  <button onClick={() => toggleEnabled(p)} className={`rounded-lg p-2 ${p.is_enabled ? 'text-emerald-600' : 'text-ink-300'}`}>
                    {p.is_enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
                {p.description && <p className="mt-1 text-sm text-ink-600 line-clamp-2">{p.description}</p>}
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink-500">
                  <span className="rounded-full bg-ink-100 px-2 py-0.5">{p.frequency === 'once' ? 'Show once' : 'Every visit'}</span>
                  <span className="rounded-full bg-ink-100 px-2 py-0.5">{p.delay_seconds}s delay</span>
                  {p.button_text && <span className="rounded-full bg-ink-100 px-2 py-0.5">CTA: {p.button_text}</span>}
                </div>
                <div className="mt-4 flex gap-1">
                  <button onClick={() => openEdit(p)} className="rounded-lg p-2 text-ink-500 hover:bg-ink-100"><Pencil size={16} /></button>
                  <button onClick={() => handleDelete(p.id)} className="rounded-lg p-2 text-ink-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-ink-200 py-16 text-center">
          <p className="text-ink-400">No popups yet.</p>
          <button onClick={openCreate} className="mt-4 text-sm font-medium text-gold-600 hover:text-gold-700">Create your first popup</button>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 animate-scale-in">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-ink-900">{editing ? 'Edit Popup' : 'New Popup'}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-full p-2 hover:bg-ink-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="label-field">Title *</label><input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" /></div>
              <div><label className="label-field">Description</label><textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" /></div>
              <div>
                <label className="label-field">Popup Image</label>
                <div className="flex items-center gap-3">
                  {form.image_url && <img src={form.image_url} alt="" className="h-16 w-24 rounded-lg object-cover" />}
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink-200 px-3 py-2.5 text-sm text-ink-600 hover:bg-ink-50">
                    <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                  </label>
                </div>
                <input type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="Or paste image URL" className="input-field mt-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label-field">Button Text</label><input type="text" value={form.button_text} onChange={(e) => setForm({ ...form, button_text: e.target.value })} className="input-field" /></div>
                <div><label className="label-field">Button Link</label><input type="text" value={form.button_link} onChange={(e) => setForm({ ...form, button_link: e.target.value })} className="input-field" /></div>
                <div>
                  <label className="label-field">Frequency</label>
                  <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value as 'once' | 'every_visit' })} className="input-field">
                    <option value="once">Show Once</option>
                    <option value="every_visit">Every Visit</option>
                  </select>
                </div>
                <div><label className="label-field">Delay (seconds)</label><input type="number" min="0" value={form.delay_seconds} onChange={(e) => setForm({ ...form, delay_seconds: Number(e.target.value) })} className="input-field" /></div>
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
