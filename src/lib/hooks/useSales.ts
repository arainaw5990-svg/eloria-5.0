import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabase';
import type { Sale, ProductWithSale, Product } from '../types';

export function useActiveSales() {
  const [activeSales, setActiveSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const now = new Date().toISOString();
    const { data } = await supabase
      .from('sales')
      .select('*, sale_products(product_id)')
      .eq('is_enabled', true)
      .lte('start_date', now)
      .gte('end_date', now);
    setActiveSales(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { activeSales, loading, refresh };
}

export function applySaleToProduct(
  product: Product,
  activeSales: Sale[]
): ProductWithSale {
  for (const sale of activeSales) {
    const productIds = sale.sale_products?.map((sp: { product_id: string }) => sp.product_id) ?? [];
    if (productIds.includes(product.id)) {
      let salePrice = product.price;
      if (sale.discount_type === 'percentage') {
        salePrice = Math.round(product.price * (1 - sale.discount_value / 100));
      } else {
        salePrice = Math.max(0, product.price - sale.discount_value);
      }
      const discountPercent =
        sale.discount_type === 'percentage'
          ? sale.discount_value
          : product.price > 0
          ? Math.round(((product.price - salePrice) / product.price) * 100)
          : 0;
      return {
        ...product,
        sale_price: salePrice,
        sale_badge: sale.badge_text,
        sale_color: sale.badge_color,
        sale_id: sale.id,
        sale_name: sale.name,
        sale_end_date: sale.end_date,
        discount_percent: discountPercent,
      };
    }
  }
  return { ...product, sale_price: null, sale_badge: null, sale_color: null, sale_id: null, sale_name: null, sale_end_date: null, discount_percent: null };
}
