import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useSiteSettings } from '../context/SiteSettingsContext';

export default function AnimatedSection({ children, className = '' }: { children: ReactNode; className?: string }) {
  const { siteSettings } = useSiteSettings();

  if (!siteSettings.animations_enabled || siteSettings.scroll_animation === 'none') {
    return <div className={className}>{children}</div>;
  }

  const speedMap = { slow: 0.8, medium: 0.5, fast: 0.3 };
  const duration = speedMap[siteSettings.animation_speed];

  const variants: Record<string, any> = {
    fade_up: { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 } },
    fade_down: { initial: { opacity: 0, y: -30 }, animate: { opacity: 1, y: 0 } },
    fade_left: { initial: { opacity: 0, x: 30 }, animate: { opacity: 1, x: 0 } },
    fade_right: { initial: { opacity: 0, x: -30 }, animate: { opacity: 1, x: 0 } },
    zoom: { initial: { opacity: 0, scale: 0.85 }, animate: { opacity: 1, scale: 1 } },
    flip: { initial: { opacity: 0, rotateY: 90 }, animate: { opacity: 1, rotateY: 0 } },
  };

  const v = variants[siteSettings.scroll_animation] ?? variants.fade_up;

  return (
    <motion.div
      className={className}
      initial={v.initial}
      whileInView={v.animate}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
