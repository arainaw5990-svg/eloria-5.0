import { useEffect, useState } from 'react';
import { MessageCircle, FlaskRound, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSettings } from '../context/SettingsContext';
import { whatsappLink } from '../lib/utils';
import type { TesterFragrance } from '../lib/types';
import AnimatedSection from './AnimatedSection';

export default function TesterKit() {
  const { settings } = useSettings();
  const [fragrances, setFragrances] = useState<TesterFragrance[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    supabase.from('tester_fragrances').select('*').eq('is_enabled', true).order('sort_order').then(({ data }) => {
      setFragrances(data ?? []);
    });
  }, []);

  const toggle = (name: string) => {
    setSelected((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  };

  const message = `Hello,

I would like to order a custom tester kit.

Selected Testers:

${selected.map((s) => `• ${s}`).join('\n')}

Please provide pricing.`;

  return (
    <AnimatedSection className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-100">
            <FlaskRound size={28} className="text-gold-600" />
          </div>
        </div>
        <h2 className="font-serif text-3xl font-bold text-ink-900 sm:text-4xl">Create Your Own Tester Kit</h2>
        <p className="mx-auto mt-3 max-w-xl text-ink-500">Select multiple fragrances to sample before committing to a full-size bottle.</p>
      </div>

      <div className="mt-10 rounded-3xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {fragrances.map((f) => {
            const checked = selected.includes(f.name);
            return (
              <button
                key={f.id}
                onClick={() => toggle(f.name)}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition ${
                  checked ? 'border-gold-400 bg-gold-50 text-gold-700' : 'border-ink-200 text-ink-700 hover:border-ink-300 hover:bg-ink-50'
                }`}
              >
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
                  checked ? 'border-gold-400 bg-gold-400' : 'border-ink-300'
                }`}>
                  {checked && <Check size={14} className="text-white" />}
                </span>
                {f.name}
              </button>
            );
          })}
        </div>

        {selected.length > 0 && (
          <div className="mt-6 animate-slide-up border-t border-ink-100 pt-6 text-center">
            <p className="mb-4 text-sm text-ink-600">
              <span className="font-semibold text-ink-900">{selected.length}</span> tester{selected.length > 1 ? 's' : ''} selected
            </p>
            <a
              href={whatsappLink(settings.whatsapp_number, message)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-[#1da851] active:scale-95"
            >
              <MessageCircle size={20} /> Order on WhatsApp
            </a>
          </div>
        )}
      </div>
    </AnimatedSection>
  );
}
