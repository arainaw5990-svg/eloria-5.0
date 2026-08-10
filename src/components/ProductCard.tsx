import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ProductWithSale } from '../lib/types';
import { formatPrice } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import ProductBadge from './ProductBadge';

const ALL_BADGES = ['Best Seller', 'Trending', 'Limited', 'Sale', 'New', 'Exclusive', 'Out of Stock'];

export default function ProductCard({ product }: { product: ProductWithSale }) {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { siteSettings } = useSiteSettings();

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.sale_price ?? product.price,
      image: product.images[0] ?? '',
    });
    showToast('Added to cart');
  };

  const isOutOfStock = product.stock_quantity === 0;
  const displayBadges = [...product.badges];
  if (isOutOfStock && !displayBadges.includes('Out of Stock')) displayBadges.unshift('Out of Stock');
  if (product.sale_badge && !displayBadges.includes('Sale')) displayBadges.push('Sale');

  // Animation variants for hover
  const hoverKey = siteSettings.animations_enabled ? siteSettings.product_card_hover : 'none';
  const hoverVariants: Record<string, any> = {
    lift: { y: -8, transition: { duration: 0.3 } },
    glow: { boxShadow: '0 8px 30px rgba(201,154,58,0.3)', transition: { duration: 0.3 } },
    scale: { scale: 1.03, transition: { duration: 0.3 } },
    rotate: { rotate: 1, transition: { duration: 0.3 } },
    tilt: { rotateY: 10, scale: 1.02, transition: { duration: 0.3 } },
    none: {},
  };

  const MotionLink = motion(Link);

  return (
    <MotionLink
      to={`/product/${product.slug}`}
      className="group block overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm"
      whileHover={hoverVariants[hoverKey] ?? {}}
    >
      <div className="relative aspect-square overflow-hidden bg-ink-50">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink-50 to-ink-100">
            <Star size={32} className="text-ink-300" />
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="rounded-full bg-ink-900 px-4 py-1.5 text-xs font-semibold text-white">Out of Stock</span>
          </div>
        )}
        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {displayBadges.slice(0, 3).map((badge) => (
            <ProductBadge key={badge} badge={badge} customColor={badge === 'Sale' ? product.sale_color ?? undefined : undefined} />
          ))}
        </div>
        {product.discount_percent && product.discount_percent > 0 && (
          <span className="absolute right-2 top-2 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
            -{product.discount_percent}%
          </span>
        )}
      </div>

      <div className="flex flex-col p-4">
        {product.category && (
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gold-600">{product.category.name}</p>
        )}
        <h3 className="font-serif text-base font-semibold leading-snug text-ink-900 line-clamp-2 min-h-[2.8rem] sm:min-h-[3.1rem] sm:text-lg">{product.name}</h3>
        {product.inspired_by && (
          <p className="mt-1 text-xs italic leading-snug text-ink-400 line-clamp-2 sm:text-[13px]">Inspired by: {product.inspired_by}</p>
        )}
        <div className="mt-2 flex min-h-[1.5rem] items-center gap-2">
          {product.sale_price != null && product.sale_price < product.price ? (
            <>
              <span className="text-base font-bold text-ink-900">{formatPrice(product.sale_price)}</span>
              <span className="text-sm text-ink-400 line-through">{formatPrice(product.price)}</span>
            </>
          ) : (
            <span className="text-base font-bold text-ink-900">{formatPrice(product.price)}</span>
          )}
        </div>
        <button
          onClick={handleAdd}
          disabled={isOutOfStock}
          className="mt-2 w-full rounded-full bg-ink-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-gold-400 hover:text-ink-900 disabled:opacity-40"
        >
          Add to Cart
        </button>
      </div>
    </MotionLink>
  );
}

export { ALL_BADGES };
