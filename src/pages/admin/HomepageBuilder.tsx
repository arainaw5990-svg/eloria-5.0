import { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, Eye, EyeOff, Save, Plus, Trash2, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import type { HomepageSection, Banner } from '../../lib/types';

export default function HomepageBuilder() {
  const { showToast } = useToast();
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [editingHero, setEditingHero] = useState(false);
  const [heroForm, setHeroForm] = useState({ heading: '', subheading: '', button_text: '', button_link: '' });
  const [uploading, setUploading] = useState(false);
  const [bannerUrl, setBannerUrl] = useState('');
  const [bannerLink, setBannerLink] = useState('');

  const load = async () => {
    const secRes = await supabase.from('homepage_sections').select('*').order('order_index');
    const banData = await supabase.from('banners').select('*').order('sort_order');
    setSections(secRes.data ?? []);
    setBanners(banData.data ?? []);
    const hero = secRes.data?.find((s: HomepageSection) => s.section_key === 'hero');
    if (hero?.config) setHeroForm({
      heading: hero.config.heading ?? '', subheading: hero.config.subheading ?? '',
      button_text: hero.config.button_text ?? '', button_link: hero.config.button_link ?? '',
    });
  };

  useEffect(() => { load(); }, []);

  const toggleVisible = async (section: HomepageSection) => {
    await supabase.from('homepage_sections').update({ is_visible: !section.is_visible }).eq('id', section.id);
    load();
  };

  const move = async (section: HomepageSection, dir: -1 | 1) => {
    const sorted = [...sections].sort((a, b) => a.order_index - b.order_index);
    const idx = sorted.findIndex((s: HomepageSection) => s.id === section.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx], b = sorted[swapIdx];
    await Promise.all([
      supabase.from('homepage_sections').update({ order_index: b.order_index }).eq('id', a.id),
      supabase.from('homepage_sections').update({ order_index: a.order_index }).eq('id', b.id),
    ]);
    load();
  };

  const saveHero = async () => {
    const hero = sections.find((s) => s.section_key === 'hero');
    if (!hero) return;
    await supabase.from('homepage_sections').update({ config: heroForm }).eq('id', hero.id);
    showToast('Hero section saved');
    setEditingHero(false);
    load();
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `banner-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('brand').upload(fileName, file);
    if (!error) {
      const { data } = supabase.storage.from('brand').getPublicUrl(fileName);
      setBannerUrl(data.publicUrl);
    }
    setUploading(false);
  };

  const addBanner = async () => {
    if (!bannerUrl.trim()) return;
    await supabase.from('banners').insert({
      image_url: bannerUrl, link_url: bannerLink || null,
      sort_order: banners.length,
    });
    setBannerUrl(''); setBannerLink('');
    showToast('Banner added');
    load();
  };

  const deleteBanner = async (id: string) => {
    await supabase.from('banners').delete().eq('id', id);
    showToast('Banner deleted');
    load();
  };

  const moveBanner = async (banner: Banner, dir: -1 | 1) => {
    const sorted = [...banners].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((b) => b.id === banner.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx], b = sorted[swapIdx];
    await Promise.all([
      supabase.from('banners').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('banners').update({ sort_order: a.sort_order }).eq('id', b.id),
    ]);
    load();
  };

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-bold text-ink-900">Homepage Builder</h1>

      {/* Hero Section */}
      <div className="mb-6 rounded-2xl border border-ink-100 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-ink-900">Hero Section</h2>
          <button onClick={() => setEditingHero(!editingHero)} className="btn-ghost text-xs">Edit</button>
        </div>
        {editingHero ? (
          <div className="mt-4 space-y-3">
            <div><label className="label-field">Heading</label><input type="text" value={heroForm.heading} onChange={(e) => setHeroForm({ ...heroForm, heading: e.target.value })} className="input-field" /></div>
            <div><label className="label-field">Subheading</label><input type="text" value={heroForm.subheading} onChange={(e) => setHeroForm({ ...heroForm, subheading: e.target.value })} className="input-field" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label-field">Button Text</label><input type="text" value={heroForm.button_text} onChange={(e) => setHeroForm({ ...heroForm, button_text: e.target.value })} className="input-field" /></div>
              <div><label className="label-field">Button Link</label><input type="text" value={heroForm.button_link} onChange={(e) => setHeroForm({ ...heroForm, button_link: e.target.value })} className="input-field" /></div>
            </div>
            <button onClick={saveHero} className="btn-primary"><Save size={16} /> Save Hero</button>
          </div>
        ) : (
          <div className="mt-3 space-y-1 text-sm text-ink-600">
            <p><span className="text-ink-400">Heading:</span> {heroForm.heading || 'Default brand name'}</p>
            <p><span className="text-ink-400">Subheading:</span> {heroForm.subheading || 'Default tagline'}</p>
            <p><span className="text-ink-400">Button:</span> {heroForm.button_text || 'Shop Now'} → {heroForm.button_link || '/shop'}</p>
          </div>
        )}
      </div>

      {/* Banner Slider */}
      <div className="mb-6 rounded-2xl border border-ink-100 bg-white p-5">
        <h2 className="mb-4 font-serif text-lg font-bold text-ink-900">Banner Slider</h2>
        <div className="space-y-2">
          {banners.map((b) => (
            <div key={b.id} className="flex items-center gap-3 rounded-lg border border-ink-100 p-2">
              <img src={b.image_url} alt="" className="h-12 w-20 rounded object-cover" />
              <span className="flex-1 text-sm text-ink-600 truncate">{b.link_url ?? 'No link'}</span>
              <button onClick={() => moveBanner(b, -1)} className="rounded p-1.5 hover:bg-ink-100"><ArrowUp size={14} /></button>
              <button onClick={() => moveBanner(b, 1)} className="rounded p-1.5 hover:bg-ink-100"><ArrowDown size={14} /></button>
              <button onClick={() => deleteBanner(b.id)} className="rounded p-1.5 text-ink-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2 border-t border-ink-100 pt-4">
          <div className="flex gap-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-600 hover:bg-ink-50">
              <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload Banner'}
              <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} disabled={uploading} />
            </label>
            <input type="url" value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="Or paste image URL" className="input-field text-sm" />
          </div>
          <input type="text" value={bannerLink} onChange={(e) => setBannerLink(e.target.value)} placeholder="Link URL (e.g. /shop)" className="input-field text-sm" />
          <button onClick={addBanner} disabled={!bannerUrl.trim()} className="btn-primary text-sm"><Plus size={16} /> Add Banner</button>
        </div>
      </div>

      {/* Section Ordering */}
      <div className="rounded-2xl border border-ink-100 bg-white p-5">
        <h2 className="mb-4 font-serif text-lg font-bold text-ink-900">Homepage Sections</h2>
        <p className="mb-4 text-sm text-ink-500">Reorder and toggle visibility of homepage sections. Changes appear instantly on your store.</p>
        <div className="space-y-2">
          {[...sections].sort((a, b) => a.order_index - b.order_index).map((section, idx, arr) => (
            <div key={section.id} className="flex items-center gap-3 rounded-lg border border-ink-100 p-3">
              <div className="flex flex-col">
                <button onClick={() => move(section, -1)} disabled={idx === 0} className="rounded p-0.5 text-ink-400 hover:text-ink-900 disabled:opacity-30"><ArrowUp size={14} /></button>
                <button onClick={() => move(section, 1)} disabled={idx === arr.length - 1} className="rounded p-0.5 text-ink-400 hover:text-ink-900 disabled:opacity-30"><ArrowDown size={14} /></button>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-ink-900">{section.title}</p>
                <p className="text-xs text-ink-400">/{section.section_key}</p>
              </div>
              <button onClick={() => toggleVisible(section)} className={`rounded-lg p-2 ${section.is_visible ? 'text-emerald-600 hover:bg-emerald-50' : 'text-ink-300 hover:bg-ink-100'}`}>
                {section.is_visible ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
