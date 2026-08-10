import { useState } from 'react';
import { Save, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';

export default function AdminSettings() {
  const { settings, refresh } = useSettings();
  const { showToast } = useToast();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logo_url' | 'favicon_url' | 'hero_image_url') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(field);
    const ext = file.name.split('.').pop();
    const fileName = `${field}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('brand').upload(fileName, file);
    if (!error) {
      const { data } = supabase.storage.from('brand').getPublicUrl(fileName);
      setForm({ ...form, [field]: data.publicUrl });
      showToast('Image uploaded');
    }
    setUploading(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('settings').update({
      brand_name: form.brand_name,
      logo_url: form.logo_url,
      favicon_url: form.favicon_url,
      hero_image_url: form.hero_image_url,
      tagline: form.tagline,
      footer_text: form.footer_text,
      currency_code: form.currency_code,
      tax_percent: Number(form.tax_percent),
      delivery_charge: Number(form.delivery_charge),
      free_delivery_threshold: Number(form.free_delivery_threshold),
      whatsapp_number: form.whatsapp_number,
      instagram_url: form.instagram_url,
      facebook_url: form.facebook_url,
      email: form.email,
      maps_url: form.maps_url,
      primary_color: form.primary_color,
      accent_color: form.accent_color,
    }).eq('id', 1);
    setSaving(false);
    if (error) { showToast('Failed to save settings', 'error'); return; }
    showToast('Settings saved');
    refresh();
  };

  const field = (label: string, key: keyof typeof form, type = 'text') => (
    <div>
      <label className="label-field">{label}</label>
      <input
        type={type}
        value={String(form[key] ?? '')}
        onChange={(e) => setForm({ ...form, [key]: type === 'number' ? Number(e.target.value) : e.target.value })}
        className="input-field"
      />
    </div>
  );

  const imageField = (label: string, key: 'logo_url' | 'favicon_url' | 'hero_image_url') => (
    <div>
      <label className="label-field">{label}</label>
      <div className="flex items-center gap-3">
        {form[key] && <img src={form[key] ?? ''} alt="" className="h-12 w-12 rounded-lg object-cover" />}
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-600 hover:bg-ink-50">
          <Upload size={14} /> {uploading === key ? 'Uploading...' : 'Upload'}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, key)} disabled={uploading === key} />
        </label>
      </div>
    </div>
  );

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-bold text-ink-900">Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Brand */}
        <div className="rounded-2xl border border-ink-100 bg-white p-6">
          <h2 className="mb-4 font-serif text-lg font-bold text-ink-900">Brand</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {field('Brand Name', 'brand_name')}
            {field('Tagline', 'tagline')}
            {field('Footer Text', 'footer_text')}
            {field('Currency Code', 'currency_code')}
            {imageField('Logo', 'logo_url')}
            {imageField('Favicon', 'favicon_url')}
            <div className="sm:col-span-2">{imageField('Hero Image', 'hero_image_url')}</div>
          </div>
        </div>

        {/* Delivery */}
        <div className="rounded-2xl border border-ink-100 bg-white p-6">
          <h2 className="mb-4 font-serif text-lg font-bold text-ink-900">Delivery & Tax</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {field('Delivery Charge (PKR)', 'delivery_charge', 'number')}
            {field('Free Delivery Over (PKR)', 'free_delivery_threshold', 'number')}
            {field('Tax %', 'tax_percent', 'number')}
          </div>
        </div>

        {/* Contact */}
        <div className="rounded-2xl border border-ink-100 bg-white p-6">
          <h2 className="mb-4 font-serif text-lg font-bold text-ink-900">Contact & Social</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {field('WhatsApp Number', 'whatsapp_number')}
            {field('Instagram URL', 'instagram_url')}
            {field('Facebook URL', 'facebook_url')}
            {field('Email', 'email', 'email')}
            <div className="sm:col-span-2">{field('Google Maps URL', 'maps_url')}</div>
          </div>
        </div>

        {/* Theme */}
        <div className="rounded-2xl border border-ink-100 bg-white p-6">
          <h2 className="mb-4 font-serif text-lg font-bold text-ink-900">Theme Colors</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {field('Primary Color', 'primary_color')}
            {field('Accent Color', 'accent_color')}
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary">
            <Save size={18} /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
