import { MessageCircle, RotateCcw } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { whatsappLink } from '../lib/utils';
import AnimatedSection from './AnimatedSection';

export default function ReturnPolicyCard() {
  const { settings } = useSettings();
  const message = `Hello,

I would like to know about your return policy.`;

  return (
    <AnimatedSection className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <a
        href={whatsappLink(settings.whatsapp_number, message)}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-4 rounded-2xl border border-ink-100 bg-gradient-to-r from-ink-900 to-ink-800 p-6 text-white transition hover:shadow-lg sm:p-8"
      >
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gold-400 text-ink-900 transition group-hover:scale-110">
          <RotateCcw size={26} />
        </div>
        <div className="flex-1">
          <h3 className="font-serif text-xl font-bold text-white sm:text-2xl">Return Policy</h3>
          <p className="mt-1 text-sm text-ink-300">Not sure about our returns? Chat with us on WhatsApp for full details.</p>
        </div>
        <div className="hidden items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition group-hover:bg-[#1da851] sm:inline-flex">
          <MessageCircle size={18} /> Ask on WhatsApp
        </div>
      </a>
    </AnimatedSection>
  );
}
