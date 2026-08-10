import { MessageCircle } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function WhatsAppButton() {
  const { settings } = useSettings();
  const number = settings.whatsapp_number.replace(/[^0-9]/g, '');
  const href = `https://wa.me/${number}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 active:scale-95"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle size={26} />
    </a>
  );
}
