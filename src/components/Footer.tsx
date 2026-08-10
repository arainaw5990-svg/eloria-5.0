import { Link } from 'react-router-dom';
import { Instagram, Facebook, Mail } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function Footer() {
  const { settings } = useSettings();

  return (
    <footer className="mt-auto border-t border-ink-100 bg-ink-900 text-ink-200">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h3 className="font-serif text-xl font-bold text-white">{settings.brand_name}</h3>
            <p className="mt-2 text-sm text-ink-400">{settings.tagline}</p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-400">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-ink-300 transition hover:text-white">Home</Link></li>
              <li><Link to="/shop" className="text-ink-300 transition hover:text-white">Shop All</Link></li>
              <li><Link to="/contact" className="text-ink-300 transition hover:text-white">Contact</Link></li>
              <li><Link to="/cart" className="text-ink-300 transition hover:text-white">Cart</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-400">Connect</h4>
            <div className="flex gap-3">
              {settings.instagram_url && (
                <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer"
                  className="rounded-full bg-ink-800 p-2.5 text-ink-300 transition hover:bg-gold-400 hover:text-ink-900">
                  <Instagram size={18} />
                </a>
              )}
              {settings.facebook_url && (
                <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer"
                  className="rounded-full bg-ink-800 p-2.5 text-ink-300 transition hover:bg-gold-400 hover:text-ink-900">
                  <Facebook size={18} />
                </a>
              )}
              {settings.email && (
                <a href={`mailto:${settings.email}`}
                  className="rounded-full bg-ink-800 p-2.5 text-ink-300 transition hover:bg-gold-400 hover:text-ink-900">
                  <Mail size={18} />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-ink-800 pt-6 text-center text-xs text-ink-500">
          <p>{settings.footer_text}</p>
          <div className="mt-2 flex justify-center gap-4">
            <Link to="/privacy" className="transition hover:text-ink-300">Privacy Policy</Link>
            <Link to="/terms" className="transition hover:text-ink-300">Terms &amp; Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
