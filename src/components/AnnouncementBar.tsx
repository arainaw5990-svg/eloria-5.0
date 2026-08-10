import { X } from 'lucide-react';
import { useState } from 'react';
import { useSiteSettings } from '../context/SiteSettingsContext';

export default function AnnouncementBar() {
  const { siteSettings } = useSiteSettings();
  const [closed, setClosed] = useState(false);

  if (!siteSettings.announcement_enabled || !siteSettings.announcement_text || closed) return null;

  return (
    <div
      className="relative flex items-center justify-center px-4 py-2 text-center text-sm font-medium"
      style={{ backgroundColor: siteSettings.announcement_bg_color, color: siteSettings.announcement_text_color }}
    >
      <span>{siteSettings.announcement_text}</span>
      <button
        onClick={() => setClosed(true)}
        className="absolute right-3 opacity-70 transition hover:opacity-100"
        style={{ color: siteSettings.announcement_text_color }}
        aria-label="Close announcement"
      >
        <X size={16} />
      </button>
    </div>
  );
}
