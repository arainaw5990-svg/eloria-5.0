import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Category, ProductWithSale } from '../lib/types';
import ProductCard from '../components/ProductCard';
import { useActiveSales, applySaleToProduct } from '../lib/hooks/useSales';

type SortOption = 'newest' | 'price_asc' | 'price_desc';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<ProductWithSale[]>([]);
  const { activeSales } = useActiveSales();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');

  const selectedCategory = searchParams.get('category') ?? '';
  const sortBy = (searchParams.get('sort') as SortOption) ?? 'newest';
  const maxPrice = searchParams.get('price') ?? '';

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .eq('is_visible', true)
      .order('sort_order')
      .then(({ data }) => setCategories(data ?? []));
  }, []);

  useEffect(() => {
    setLoading(true);
    let query = supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('is_enabled', true)
      .order('sort_order');

    if (selectedCategory) {
      const cat = categories.find((c) => c.slug === selectedCategory);
      if (cat) query = query.eq('category_id', cat.id);
    }

    query.then(({ data }) => {
      let filtered = (data ?? []) as ProductWithSale[];
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (p) => p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q)
        );
      }
      if (maxPrice) {
        filtered = filtered.filter((p) => (p.sale_price ?? p.price) <= parseInt(maxPrice));
      }
      if (sortBy === 'price_asc') filtered = [...filtered].sort((a, b) => (a.sale_price ?? a.price) - (b.sale_price ?? b.price));
      if (sortBy === 'price_desc') filtered = [...filtered].sort((a, b) => (b.sale_price ?? b.price) - (a.sale_price ?? a.price));
      setProducts(filtered.map((p) => applySaleToProduct(p, activeSales)));
      setLoading(false);
    });
  }, [selectedCategory, sortBy, maxPrice, search, categories, activeSales]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
    setSearch('');
  };

  const hasFilters = useMemo(() => selectedCategory || maxPrice || search, [selectedCategory, maxPrice, search]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-ink-900">Shop All Fragrances</h1>
        <p className="mt-1 text-sm text-ink-500">{products.length} products</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Desktop Sidebar */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <FilterPanel
            categories={categories}
            selectedCategory={selectedCategory}
            maxPrice={maxPrice}
            onCategoryChange={(v) => updateParam('category', v)}
            onPriceChange={(v) => updateParam('price', v)}
            onClear={clearFilters}
            hasFilters={!!hasFilters}
          />
        </aside>

        <div className="flex-1">
          {/* Search + Sort Bar */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              type="text"
              placeholder="Search fragrances..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field sm:max-w-xs"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(true)}
                className="flex items-center gap-2 rounded-lg border border-ink-200 px-4 py-2.5 text-sm font-medium text-ink-700 lg:hidden"
              >
                <SlidersHorizontal size={16} /> Filters
              </button>
              <select
                value={sortBy}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="input-field w-auto"
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-ink-100" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-ink-200 py-20 text-center">
              <p className="text-ink-400">No products found.</p>
              {hasFilters && (
                <button onClick={clearFilters} className="mt-3 text-sm font-medium text-gold-600 hover:text-gold-700">
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilters(false)} />
          <div className="absolute right-0 top-0 h-full w-80 max-w-full overflow-y-auto bg-white p-6 animate-slide-up">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold">Filters</h3>
              <button onClick={() => setShowFilters(false)} className="rounded-full p-2 hover:bg-ink-100">
                <X size={20} />
              </button>
            </div>
            <FilterPanel
              categories={categories}
              selectedCategory={selectedCategory}
              maxPrice={maxPrice}
              onCategoryChange={(v) => updateParam('category', v)}
              onPriceChange={(v) => updateParam('price', v)}
              onClear={clearFilters}
              hasFilters={!!hasFilters}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function FilterPanel({
  categories,
  selectedCategory,
  maxPrice,
  onCategoryChange,
  onPriceChange,
  onClear,
  hasFilters,
}: {
  categories: Category[];
  selectedCategory: string;
  maxPrice: string;
  onCategoryChange: (v: string) => void;
  onPriceChange: (v: string) => void;
  onClear: () => void;
  hasFilters: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-500">Category</h3>
        <div className="space-y-2">
          <button
            onClick={() => onCategoryChange('')}
            className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
              !selectedCategory ? 'bg-ink-900 font-medium text-white' : 'text-ink-600 hover:bg-ink-100'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.slug)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                selectedCategory === cat.slug ? 'bg-ink-900 font-medium text-white' : 'text-ink-600 hover:bg-ink-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-500">Max Price</h3>
        <input
          type="number"
          placeholder="Rs. 10000"
          value={maxPrice}
          onChange={(e) => onPriceChange(e.target.value)}
          className="input-field"
        />
      </div>

      {hasFilters && (
        <button onClick={onClear} className="text-sm font-medium text-gold-600 hover:text-gold-700">
          Clear all filters
        </button>
      )}
    </div>
  );
}
