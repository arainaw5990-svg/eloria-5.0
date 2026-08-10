import { useState } from 'react';
import { Save, Moon, Sun } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { useToast } from '../../context/ToastContext';
import type { SiteSettings } from '../../lib/types';

const BUTTON_STYLES = ['rounded', 'pill', 'square', 'outline'];
const FONTS = ['Cormorant Garamond', 'Inter', 'Georgia', 'Arial', 'Roboto', 'Playfair Display'];

export default function AdminTheme() {
  const { siteSettings, refresh } = useSiteSettings();
  const { showToast } = useToast();
  const [form, setForm] = useState(siteSettings);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('site_settings').update({
      primary_color: form.primary_color,
      secondary_color: form.secondary_color,
      accent_color: form.accent_color,
      background_color: form.background_color,
      text_color: form.text_color,
      button_style: form.button_style,
      border_radius: Number(form.border_radius),
      font_heading: form.font_heading,
      font_body: form.font_body,
      dark_mode: form.dark_mode,
    }).eq('id', 1);
    setSaving(false);
    if (error) { showToast('Failed to save', 'error'); return; }
    showToast('Theme saved — applied live');
    refresh();
  };

  const colorField = (label: string, key: keyof typeof form) => (
    <div>
      <label className="label-field">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={String(form[key])} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="h-10 w-12 rounded-lg border border-ink-200" />
        <input type="text" value={String(form[key])} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="input-field text-sm" />
      </div>
    </div>
  );

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-bold text-ink-900">Theme Manager</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {/* Colors */}
        <div className="rounded-2xl border border-ink-100 bg-white p-6">
          <h2 className="mb-4 font-serif text-lg font-bold text-ink-900">Color Palette</h2>
          <div className="grid grid-cols-2 gap-4">
            {colorField('Primary Color', 'primary_color')}
            {colorField('Secondary Color', 'secondary_color')}
            {colorField('Accent Color', 'accent_color')}
            {colorField('Background Color', 'background_color')}
            {colorField('Text Color', 'text_color')}
          </div>
        </div>

        {/* Buttons & Radius */}
        <div className="rounded-2xl border border-ink-100 bg-white p-6">
          <h2 className="mb-4 font-serif text-lg font-bold text-ink-900">Buttons & Shape</h2>
          <div className="space-y-4">
            <div>
              <label className="label-field">Button Style</label>
              <div className="grid grid-cols-4 gap-2">
                {BUTTON_STYLES.map((s) => (
                  <button key={s} type="button" onClick={() => setForm({ ...form, button_style: s as SiteSettings['button_style'] })}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize transition ${form.button_style === s ? 'border-gold-400 bg-gold-50 text-gold-700' : 'border-ink-200 text-ink-600 hover:bg-ink-50'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label-field">Border Radius: {form.border_radius}px</label>
              <input type="range" min="0" max="24" value={form.border_radius} onChange={(e) => setForm({ ...form, border_radius: Number(e.target.value) })} className="w-full" />
            </div>
          </div>
        </div>

        {/* Fonts */}
        <div className="rounded-2xl border border-ink-100 bg-white p-6">
          <h2 className="mb-4 font-serif text-lg font-bold text-ink-900">Fonts</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Heading Font</label>
              <select value={form.font_heading} onChange={(e) => setForm({ ...form, font_heading: e.target.value })} className="input-field">
                {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="label-field">Body Font</label>
              <select value={form.font_body} onChange={(e) => setForm({ ...form, font_body: e.target.value })} className="input-field">
                {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Dark Mode */}
        <div className="rounded-2xl border border-ink-100 bg-white p-6">
          <label className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-serif text-lg font-bold text-ink-900">
              {form.dark_mode ? <Moon size={20} /> : <Sun size={20} />} Dark Mode
            </span>
            <button type="button" onClick={() => setForm({ ...form, dark_mode: !form.dark_mode })}
              className={`relative h-7 w-12 rounded-full transition ${form.dark_mode ? 'bg-ink-900' : 'bg-ink-200'}`}>
              <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${form.dark_mode ? 'left-6' : 'left-0.5'}`} />
            </button>
          </label>
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          <Save size={18} /> {saving ? 'Saving...' : 'Save Theme'}
        </button>
      </form>
    </div>
  );
}
