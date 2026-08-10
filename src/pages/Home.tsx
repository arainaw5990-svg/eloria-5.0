import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import type { Category, HomepageSection, ProductWithSale } from '../lib/types';
import { useSettings } from '../context/SettingsContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useActiveSales, applySaleToProduct } from '../lib/hooks/useSales';
import ProductCard from '../components/ProductCard';
import BannerSlider from '../components/BannerSlider';
import AnimatedSection from '../components/AnimatedSection';
import { ProductGridSkeleton } from '../components/Skeletons';
import ReviewsSection from '../components/ReviewsSection';
import CreateYourScent from '../components/CreateYourScent';
import TesterKit from '../components/TesterKit';
import ReturnPolicyCard from '../components/ReturnPolicyCard';

export default function Home() {
  const { settings } = useSettings();
  const { siteSettings } = useSiteSettings();
  const { activeSales } = useActiveSales();
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productsBySection, setProductsBySection] = useState<Record<string, ProductWithSale[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('homepage_sections').select('*').order('order_index'),
      supabase.from('categories').select('*').eq('is_visible', true).order('sort_order'),
    ]).then(([secRes, catRes]) => {
      setSections(secRes.data ?? []);
      setCategories(catRes.data ?? []);
    });
  }, []);

  useEffect(() => {
    if (sections.length === 0) return;
    const productSections = sections.filter((s) =>
      ['featured', 'best_sellers', 'new_arrivals', 'trending'].includes(s.section_key)
    );
    Promise.all(
      productSections.map((sec) => {
        let query = supabase.from('products').select('*, category:categories(*)').eq('is_enabled', true);
        if (sec.section_key === 'featured') query = query.eq('is_featured', true);
        if (sec.section_key === 'best_sellers') query = query.eq('is_best_seller', true);
        if (sec.section_key === 'new_arrivals') query = query.eq('is_new_arrival', true).order('created_at', { ascending: false });
        if (sec.section_key === 'trending') query = query.eq('is_trending', true);
        return query.order('sort_order').limit(8).then(({ data }) => ({
          key: sec.section_key,
          data: (data ?? []).map((p) => applySaleToProduct(p, activeSales)),
        }));
      })
    ).then((results) => {
      const map: Record<string, ProductWithSale[]> = {};
      results.forEach((r) => { map[r.key] = r.data; });
      setProductsBySection(map);
      setLoading(false);
    });
  }, [sections, activeSales]);

  const visibleSections = sections.filter((s) => s.is_visible);

  const heroConfig = sections.find((s) => s.section_key === 'hero')?.config ?? {};
  const heroHeading = heroConfig.heading ?? settings.brand_name;
  const heroSubheading = heroConfig.subheading ?? settings.tagline;
  const heroButtonText = heroConfig.button_text ?? 'Shop Now';
  const heroButtonLink = heroConfig.button_link ?? '/shop';

  const renderSection = (section: HomepageSection) => {
    switch (section.section_key) {
      case 'hero':
        return <HeroSection key={section.id} settings={settings} heading={heroHeading} subheading={heroSubheading} buttonText={heroButtonText} buttonLink={heroButtonLink} animationsEnabled={siteSettings.animations_enabled} heroAnim={siteSettings.hero_animation} speed={siteSettings.animation_speed} />;
      case 'banner_slider':
        return <section key={section.id} className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><BannerSlider /></section>;
      case 'categories':
        return categories.length > 0 ? (
          <AnimatedSection key={section.id} className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="mb-8 text-center font-serif text-3xl font-bold text-ink-900">{section.title ?? 'Shop by Category'}</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              {categories.map((cat) => (
                <Link key={cat.id} to={`/shop?category=${cat.slug}`} className="group relative flex h-32 items-center justify-center overflow-hidden rounded-xl bg-ink-100 transition hover:shadow-lg md:h-40">
                  {cat.image_url ? <img src={cat.image_url} alt={cat.name} className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105" /> : <div className="absolute inset-0 bg-gradient-to-br from-ink-100 to-ink-200" />}
                  <span className="relative z-10 rounded-lg bg-white/90 px-4 py-2 text-center text-sm font-semibold text-ink-900 backdrop-blur-sm">{cat.name}</span>
                </Link>
              ))}
            </div>
          </AnimatedSection>
        ) : null;
      case 'featured':
      case 'best_sellers':
      case 'new_arrivals':
      case 'trending':
        return <ProductSection key={section.id} section={section} products={productsBySection[section.section_key] ?? []} loading={loading} />;
      case 'reviews':
        return <ReviewsSection key={section.id} />;
      case 'create_your_scent':
        return <CreateYourScent key={section.id} />;
      case 'tester_kit':
        return <TesterKit key={section.id} />;
      case 'return_policy':
        return <ReturnPolicyCard key={section.id} />;
      default:
        return null;
    }
  };

  return <div>{visibleSections.map(renderSection)}</div>;
}

function HeroSection({ settings, heading, subheading, buttonText, buttonLink, animationsEnabled, heroAnim, speed }: any) {
  if (!animationsEnabled || heroAnim === 'none') {
    return (
      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-ink-900">
        {settings.hero_image_url ? <img src={settings.hero_image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" /> : <div className="absolute inset-0 bg-gradient-to-br from-ink-900 via-ink-800 to-ink-950" />}
        <HeroContent heading={heading} subheading={subheading} buttonText={buttonText} buttonLink={buttonLink} />
      </section>
    );
  }

  const dur = speed === 'slow' ? 1.2 : speed === 'fast' ? 0.4 : 0.7;
  const variants: Record<string, any> = {
    fade: { initial: { opacity: 0 }, animate: { opacity: 1 } },
    slide: { initial: { opacity: 0, x: -60 }, animate: { opacity: 1, x: 0 } },
    zoom: { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 } },
    scale: { initial: { opacity: 0, scale: 1.2 }, animate: { opacity: 1, scale: 1 } },
    parallax: { initial: { opacity: 0, y: 80 }, animate: { opacity: 1, y: 0 } },
  };
  const v = variants[heroAnim] ?? variants.fade;

  return (
    <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-ink-900">
      {settings.hero_image_url ? <img src={settings.hero_image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" /> : <div className="absolute inset-0 bg-gradient-to-br from-ink-900 via-ink-800 to-ink-950" />}
      <motion.div className="relative z-10 px-4 text-center text-white sm:px-6 lg:px-8" initial={v.initial} animate={v.animate} transition={{ duration: dur, ease: 'easeOut' }}>
        <HeroContent heading={heading} subheading={subheading} buttonText={buttonText} buttonLink={buttonLink} />
      </motion.div>
    </section>
  );
}

function HeroContent({ heading, subheading, buttonText, buttonLink }: any) {
  return (
    <>
      <Sparkles size={32} className="mx-auto mb-4 text-gold-400" />
      <h1 className="font-serif text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">{heading}</h1>
      <p className="mx-auto mt-4 max-w-xl text-lg text-ink-200">{subheading}</p>
      <Link to={buttonLink} className="mt-8 inline-flex items-center gap-2 rounded-full bg-gold-400 px-8 py-3.5 text-sm font-semibold text-ink-900 transition hover:bg-gold-300 active:scale-95">
        {buttonText} <ArrowRight size={18} />
      </Link>
    </>
  );
}

function ProductSection({ section, products, loading }: { section: HomepageSection; products: ProductWithSale[]; loading: boolean }) {
  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="mb-8 font-serif text-3xl font-bold text-ink-900">{section.title}</h2>
        <ProductGridSkeleton />
      </section>
    );
  }
  if (products.length === 0) return null;
  return (
    <AnimatedSection className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="font-serif text-3xl font-bold text-ink-900">{section.title}</h2>
        <Link to="/shop" className="flex items-center gap-1 text-sm font-medium text-gold-600 hover:text-gold-700">
          View All <ArrowRight size={16} />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </AnimatedSection>
  );
}
