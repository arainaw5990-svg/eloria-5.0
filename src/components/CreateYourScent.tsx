import { useEffect, useState } from 'react';
import { Search, MessageCircle, FlaskConical, Droplet, Beaker } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSettings } from '../context/SettingsContext';
import { whatsappLink } from '../lib/utils';
import type { CustomScentFragrance, BottleSize, Concentration } from '../lib/types';
import AnimatedSection from './AnimatedSection';

export default function CreateYourScent() {
  const { settings } = useSettings();
  const [fragrances, setFragrances] = useState<CustomScentFragrance[]>([]);
  const [bottleSizes, setBottleSizes] = useState<BottleSize[]>([]);
  const [concentrations, setConcentrations] = useState<Concentration[]>([]);
  const [search, setSearch] = useState('');
  const [selectedFragrance, setSelectedFragrance] = useState<CustomScentFragrance | null>(null);
  const [selectedSize, setSelectedSize] = useState<BottleSize | null>(null);
  const [selectedConcentration, setSelectedConcentration] = useState<Concentration | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from('custom_scent_fragrances').select('*').eq('is_enabled', true).order('sort_order'),
      supabase.from('bottle_sizes').select('*').order('sort_order'),
      supabase.from('concentrations').select('*').eq('is_enabled', true).order('sort_order'),
    ]).then(([f, b, c]) => {
      setFragrances(f.data ?? []);
      setBottleSizes(b.data ?? []);
      setConcentrations(c.data ?? []);
    });
  }, []);

  const filtered = fragrances.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );
  const notFound = search.trim().length > 0 && filtered.length === 0;

  const canSubmit = selectedFragrance && selectedSize && selectedConcentration;

  const message = `Hello,

I would like to create my own fragrance.

Fragrance:
${selectedFragrance?.name}

Bottle Size:
${selectedSize?.label}

Concentration:
${selectedConcentration?.percentage}%

Please provide pricing and availability.`;

  const notFoundMessage = `Hello,

I would like to create a custom fragrance but couldn't find what I was looking for on your website.

I searched for: ${search}

Could you help me with a custom fragrance request?`;

  return (
    <AnimatedSection className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-100">
            <FlaskConical size={28} className="text-gold-600" />
          </div>
        </div>
        <h2 className="font-serif text-3xl font-bold text-ink-900 sm:text-4xl">Create Your Own Scent</h2>
        <p className="mx-auto mt-3 max-w-xl text-ink-500">Search for your favorite fragrance, choose your bottle size and oil concentration, and we'll craft it just for you.</p>
      </div>

      <div className="mt-10 rounded-3xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8">
        {/* Step 1: Search */}
        <StepHeader number={1} label="Search for a Fragrance" icon={Search} />
        <div className="relative mt-3">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedFragrance(null); }}
            placeholder="Try 'Creed Aventus', 'Dior Sauvage'..."
            className="w-full rounded-full border border-ink-200 bg-ink-50 py-3 pl-11 pr-4 text-sm text-ink-900 placeholder-ink-400 transition focus:border-gold-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-400"
          />
        </div>

        {/* Search results */}
        {search.trim() && (
          <div className="mt-3">
            {notFound ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
                <p className="text-sm font-medium text-amber-800">
                  Sorry! This fragrance is currently unavailable. Please contact us on WhatsApp for more information or to request a custom fragrance.
                </p>
                <a
                  href={whatsappLink(settings.whatsapp_number, notFoundMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1da851] active:scale-95"
                >
                  <MessageCircle size={20} /> Contact Us on WhatsApp
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {filtered.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFragrance(f)}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                      selectedFragrance?.id === f.id
                        ? 'border-gold-400 bg-gold-50 text-gold-700'
                        : 'border-ink-200 text-ink-700 hover:border-ink-300 hover:bg-ink-50'
                    }`}
                  >
                    <Droplet size={16} className="text-gold-500" />
                    {f.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Bottle Size */}
        {selectedFragrance && (
          <div className="mt-8 animate-slide-up">
            <StepHeader number={2} label="Select Bottle Size" icon={Beaker} />
            <div className="mt-3 flex flex-wrap gap-2">
              {bottleSizes.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedSize(b)}
                  className={`rounded-full border px-5 py-2.5 text-sm font-medium transition ${
                    selectedSize?.id === b.id
                      ? 'border-gold-400 bg-gold-400 text-ink-900'
                      : 'border-ink-200 text-ink-600 hover:border-ink-300 hover:bg-ink-50'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Concentration */}
        {selectedFragrance && selectedSize && (
          <div className="mt-8 animate-slide-up">
            <StepHeader number={3} label="Concentration (%)" icon={Droplet} />
            <div className="mt-3 flex flex-wrap gap-2">
              {concentrations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedConcentration(c)}
                  className={`rounded-full border px-5 py-2.5 text-sm font-medium transition ${
                    selectedConcentration?.id === c.id
                      ? 'border-gold-400 bg-gold-400 text-ink-900'
                      : 'border-ink-200 text-ink-600 hover:border-ink-300 hover:bg-ink-50'
                  }`}
                >
                  {c.percentage}%
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: WhatsApp CTA */}
        {canSubmit && (
          <div className="mt-8 animate-slide-up border-t border-ink-100 pt-6 text-center">
            <div className="mb-4 rounded-2xl bg-ink-50 p-4 text-left text-sm">
              <p className="font-semibold text-ink-900">Your Selection:</p>
              <p className="mt-1 text-ink-600">Fragrance: <span className="font-medium text-ink-900">{selectedFragrance.name}</span></p>
              <p className="text-ink-600">Bottle Size: <span className="font-medium text-ink-900">{selectedSize.label}</span></p>
              <p className="text-ink-600">Concentration: <span className="font-medium text-ink-900">{selectedConcentration.percentage}%</span></p>
            </div>
            <a
              href={whatsappLink(settings.whatsapp_number, message)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-[#1da851] active:scale-95"
            >
              <MessageCircle size={20} /> Contact Us on WhatsApp
            </a>
          </div>
        )}
      </div>
    </AnimatedSection>
  );
}

function StepHeader({ number, label, icon: Icon }: { number: number; label: string; icon: any }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-900 text-xs font-bold text-white">{number}</span>
      <Icon size={18} className="text-gold-500" />
      <h3 className="font-serif text-lg font-semibold text-ink-900">{label}</h3>
    </div>
  );
}
