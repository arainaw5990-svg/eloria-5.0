import { Instagram, Facebook, Mail, MapPin, MessageCircle } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function Contact() {
  const { settings } = useSettings();
  const whatsappNumber = settings.whatsapp_number.replace(/[^0-9]/g, '');

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="font-serif text-4xl font-bold text-ink-900">Get in Touch</h1>
        <p className="mx-auto mt-3 max-w-xl text-ink-500">
          Have a question about our fragrances? We'd love to hear from you. Reach out through any of these channels.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* WhatsApp */}
        <a
          href={`https://wa.me/${whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-5 rounded-2xl border border-ink-100 bg-white p-6 transition hover:shadow-lg"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white transition group-hover:scale-110">
            <MessageCircle size={28} />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-ink-900">WhatsApp</h3>
            <p className="text-sm text-ink-500">Chat with us instantly</p>
            <p className="mt-1 text-sm font-medium text-gold-600">{settings.whatsapp_number}</p>
          </div>
        </a>

        {/* Instagram */}
        <a
          href={settings.instagram_url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-5 rounded-2xl border border-ink-100 bg-white p-6 transition hover:shadow-lg"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white transition group-hover:scale-110">
            <Instagram size={28} />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-ink-900">Instagram</h3>
            <p className="text-sm text-ink-500">Follow our latest drops</p>
            <p className="mt-1 text-sm font-medium text-gold-600">@eloria.scents</p>
          </div>
        </a>

        {/* Facebook */}
        {settings.facebook_url && (
          <a
            href={settings.facebook_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-5 rounded-2xl border border-ink-100 bg-white p-6 transition hover:shadow-lg"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1877F2] text-white transition group-hover:scale-110">
              <Facebook size={28} />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-ink-900">Facebook</h3>
              <p className="text-sm text-ink-500">Connect with us</p>
              <p className="mt-1 text-sm font-medium text-gold-600">Eloria Scents</p>
            </div>
          </a>
        )}

        {/* Email */}
        {settings.email && (
          <a
            href={`mailto:${settings.email}`}
            className="group flex items-center gap-5 rounded-2xl border border-ink-100 bg-white p-6 transition hover:shadow-lg"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ink-900 text-white transition group-hover:scale-110">
              <Mail size={28} />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-ink-900">Email</h3>
              <p className="text-sm text-ink-500">Send us a message</p>
              <p className="mt-1 text-sm font-medium text-gold-600">{settings.email}</p>
            </div>
          </a>
        )}

        {/* Maps */}
        {settings.maps_url && (
          <a
            href={settings.maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-5 rounded-2xl border border-ink-100 bg-white p-6 transition hover:shadow-lg"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white transition group-hover:scale-110">
              <MapPin size={28} />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-ink-900">Visit Us</h3>
              <p className="text-sm text-ink-500">Find our store location</p>
              <p className="mt-1 text-sm font-medium text-gold-600">View on Google Maps</p>
            </div>
          </a>
        )}
      </div>
    </div>
  );
}
