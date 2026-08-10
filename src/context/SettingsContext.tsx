import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Settings } from '../lib/types';

interface SettingsContextType {
  settings: Settings;
  refresh: () => Promise<void>;
}

const defaultSettings: Settings = {
  id: 1,
  brand_name: 'Eloria Scents',
  logo_url: null,
  favicon_url: null,
  hero_image_url: null,
  tagline: 'Luxury fragrances crafted for the discerning',
  footer_text: 'Eloria Scents. Crafted with passion.',
  currency_code: 'PKR',
  tax_percent: 0,
  delivery_charge: 250,
  free_delivery_threshold: 5000,
  whatsapp_number: '+923000000000',
  instagram_url: 'https://instagram.com',
  facebook_url: null,
  email: null,
  maps_url: null,
  primary_color: '#0a0a0a',
  accent_color: '#c99a3a',
  updated_at: new Date().toISOString(),
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  const refresh = async () => {
    const { data } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle();
    if (data) setSettings(data);
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, refresh }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
