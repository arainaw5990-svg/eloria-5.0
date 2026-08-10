import { useState } from 'react';
import { Save, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { useToast } from '../../context/ToastContext';

const HERO_ANIMS = ['fade', 'slide', 'zoom', 'scale', 'parallax', 'none'];
const HOVER_ANIMS = ['lift', 'glow', 'scale', 'rotate', 'tilt', 'none'];
const BUTTON_ANIMS = ['pulse', 'ripple', 'bounce', 'glow', 'none'];
const SCROLL_ANIMS = ['fade_up', 'fade_down', 'fade_left', 'fade_right', 'zoom', 'flip', 'none'];
const SPEEDS = ['slow', 'medium', 'fast'];

export default function AdminAnimations() {
  const { siteSettings, refresh } = useSiteSettings();
  const { showToast } = useToast();
  const [form, setForm] = useState(siteSettings);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('site_settings').update({
      animations_enabled: form.animations_enabled,
      hero_animation: form.hero_animation,
      product_card_hover: form.product_card_hover,
      button_animation: form.button_animation,
      scroll_animation: form.scroll_animation,
      animation_speed: form.animation_speed,
    }).eq('id', 1);
    setSaving(false);
    if (error) { showToast('Failed to save', 'error'); return; }
    showToast('Animation settings saved');
    refresh();
  };

  const selectGroup = (label: string, options: string[], key: keyof typeof form) => (
    <div>
      <label className="label-field">{label}</label>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setForm({ ...form, [key]: opt })}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
              form[key] === opt ? 'border-gold-400 bg-gold-50 text-gold-700' : 'border-ink-200 text-ink-600 hover:bg-ink-50'
            }`}
          >
            {opt.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-bold text-ink-900">Animation Manager</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="rounded-2xl border border-ink-100 bg-white p-6">
          <label className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-serif text-lg font-bold text-ink-900">
              <Sparkles size={20} className="text-gold-400" /> Enable All Animations
            </span>
            <button
              type="button"
              onClick={() => setForm({ ...form, animations_enabled: !form.animations_enabled })}
              className={`relative h-7 w-12 rounded-full transition ${form.animations_enabled ? 'bg-gold-400' : 'bg-ink-200'}`}
            >
              <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${form.animations_enabled ? 'left-6' : 'left-0.5'}`} />
            </button>
          </label>
        </div>

        <div className={`space-y-6 rounded-2xl border border-ink-100 bg-white p-6 ${!form.animations_enabled ? 'opacity-50' : ''}`}>
          {selectGroup('Hero Animation', HERO_ANIMS, 'hero_animation')}
          {selectGroup('Product Card Hover', HOVER_ANIMS, 'product_card_hover')}
          {selectGroup('Button Animation', BUTTON_ANIMS, 'button_animation')}
          {selectGroup('Scroll Animation', SCROLL_ANIMS, 'scroll_animation')}
          {selectGroup('Animation Speed', SPEEDS, 'animation_speed')}
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          <Save size={18} /> {saving ? 'Saving...' : 'Save Animation Settings'}
        </button>
      </form>
    </div>
  );
}
