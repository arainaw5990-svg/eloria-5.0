import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useSiteSettings } from '../context/SiteSettingsContext';
import type { Popup } from '../lib/types';

export default function PopupModal() {
  const { siteSettings } = useSiteSettings();
  const [popup, setPopup] = useState<Popup | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const STORAGE_KEY = 'eloria_popup_seen';
    let dismissed = false;

    supabase
      .from('popups')
      .select('*')
      .eq('is_enabled', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setPopup(data);
        const seen = localStorage.getItem(STORAGE_KEY);
        if (data.frequency === 'once' && seen) return;

        const timer = setTimeout(() => {
          if (!dismissed) setShow(true);
        }, data.delay_seconds * 1000);

        return () => clearTimeout(timer);
      });

    return () => { dismissed = true; };
  }, []);

  const handleClose = () => {
    setShow(false);
    if (popup?.frequency === 'once') {
      localStorage.setItem('eloria_popup_seen', String(Date.now()));
    }
  };

  if (!siteSettings.animations_enabled) {
    if (!show) return null;
    return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={handleClose}>
      <div className="max-w-md rounded-2xl bg-white" onClick={(e) => e.stopPropagation()}>
        <PopupContent popup={popup!} onClose={handleClose} />
      </div>
    </div>;
  }

  return (
    <AnimatePresence>
      {show && popup && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={handleClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="max-w-md overflow-hidden rounded-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <PopupContent popup={popup} onClose={handleClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PopupContent({ popup, onClose }: { popup: Popup; onClose: () => void }) {
  return (
    <div className="relative">
      <button onClick={onClose} className="absolute right-3 top-3 z-10 rounded-full bg-white/80 p-1.5 text-ink-700 backdrop-blur transition hover:bg-white">
        <X size={18} />
      </button>
      {popup.image_url && (
        <img src={popup.image_url} alt={popup.title} className="h-56 w-full object-cover" />
      )}
      <div className="p-6">
        <h3 className="font-serif text-2xl font-bold text-ink-900">{popup.title}</h3>
        {popup.description && <p className="mt-2 text-sm text-ink-600">{popup.description}</p>}
        {popup.button_text && (
          <a
            href={popup.button_link ?? '#'}
            onClick={onClose}
            className="mt-4 block rounded-full bg-gold-400 px-6 py-2.5 text-center text-sm font-semibold text-ink-900 transition hover:bg-gold-300"
          >
            {popup.button_text}
          </a>
        )}
      </div>
    </div>
  );
}
