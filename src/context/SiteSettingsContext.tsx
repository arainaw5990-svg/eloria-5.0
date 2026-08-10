import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { SiteSettings } from '../lib/types';

interface SiteSettingsContextType {
  siteSettings: SiteSettings;
  refresh: () => Promise<void>;
  loading: boolean;
}

const defaultSiteSettings: SiteSettings = {
  id: 1,
  announcement_enabled: false,
  announcement_text: '',
  announcement_bg_color: '#0a0a0a',
  announcement_text_color: '#ffffff',
  primary_color: '#0a0a0a',
  secondary_color: '#6e6e76',
  accent_color: '#c99a3a',
  background_color: '#f6f6f7',
  text_color: '#0a0a0a',
  button_style: 'rounded',
  border_radius: 12,
  font_heading: 'Cormorant Garamond',
  font_body: 'Inter',
  dark_mode: false,
  animations_enabled: true,
  hero_animation: 'fade',
  product_card_hover: 'lift',
  button_animation: 'pulse',
  scroll_animation: 'fade_up',
  animation_speed: 'medium',
  seo_title: 'Eloria Scents — Luxury Fragrances',
  seo_description: 'Luxury fragrances crafted for the discerning.',
  google_analytics_id: null,
  banner_auto_slide: true,
  banner_slide_speed: 5000,
  updated_at: new Date().toISOString(),
};

const SiteSettingsContext = createContext<SiteSettingsContextType | null>(null);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const { data } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle();
    if (data) setSiteSettings(data);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  // Apply theme as CSS variables
  useEffect(() => {
    const s = siteSettings;
    const root = document.documentElement;
    root.style.setProperty('--color-primary', s.primary_color);
    root.style.setProperty('--color-secondary', s.secondary_color);
    root.style.setProperty('--color-accent', s.accent_color);
    root.style.setProperty('--color-bg', s.background_color);
    root.style.setProperty('--color-text', s.text_color);
    root.style.setProperty('--radius', `${s.border_radius}px`);
    if (s.dark_mode) root.classList.add('dark-mode');
    else root.classList.remove('dark-mode');

    // SEO
    document.title = s.seo_title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', s.seo_description);
  }, [siteSettings]);

  return (
    <SiteSettingsContext.Provider value={{ siteSettings, refresh, loading }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) throw new Error('useSiteSettings must be used within SiteSettingsProvider');
  return ctx;
}
