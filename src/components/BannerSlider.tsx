import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useSiteSettings } from '../context/SiteSettingsContext';
import type { Banner } from '../lib/types';

export default function BannerSlider() {
  const { siteSettings } = useSiteSettings();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);

  const load = useCallback(async () => {
    const { data } = await supabase.from('banners').select('*').eq('is_enabled', true).order('sort_order');
    setBanners(data ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (banners.length <= 1 || !siteSettings.banner_auto_slide) return;
    const interval = setInterval(() => {
      setCurrent((c) => (c + 1) % banners.length);
    }, siteSettings.banner_slide_speed);
    return () => clearInterval(interval);
  }, [banners.length, siteSettings.banner_auto_slide, siteSettings.banner_slide_speed]);

  if (banners.length === 0) return null;

  const go = (dir: number) => {
    setCurrent((c) => (c + dir + banners.length) % banners.length);
  };

  return (
    <div className="relative h-[300px] overflow-hidden bg-ink-900 sm:h-[400px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          className="absolute inset-0"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5 }}
        >
          <Link to={banners[current].link_url ?? '/shop'} className="block h-full w-full">
            <img src={banners[current].image_url} alt={banners[current].title ?? ''} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            {(banners[current].title || banners[current].subtitle) && (
              <div className="absolute bottom-0 left-0 p-6 text-white sm:p-10">
                {banners[current].subtitle && <p className="text-sm font-medium text-gold-300">{banners[current].subtitle}</p>}
                {banners[current].title && <h2 className="mt-1 font-serif text-2xl font-bold sm:text-4xl">{banners[current].title}</h2>}
              </div>
            )}
          </Link>
        </motion.div>
      </AnimatePresence>

      {banners.length > 1 && (
        <>
          <button onClick={() => go(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/30 p-2 text-white backdrop-blur transition hover:bg-white/50">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => go(1)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/30 p-2 text-white backdrop-blur transition hover:bg-white/50">
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${i === current ? 'w-6 bg-white' : 'w-2 bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
