export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  category_id: string | null;
  images: string[];
  stock_quantity: number;
  is_featured: boolean;
  is_enabled: boolean;
  sort_order: number;
  badges: string[];
  is_best_seller: boolean;
  is_trending: boolean;
  is_new_arrival: boolean;
  is_recommended: boolean;
  fragrance_notes_top: string[];
  fragrance_notes_middle: string[];
  fragrance_notes_base: string[];
  inspired_by: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Review {
  id: string;
  product_id: string | null;
  customer_name: string;
  rating: number;
  title: string | null;
  body: string | null;
  is_approved: boolean;
  admin_reply: string | null;
  sort_order: number;
  is_visible: boolean;
  review_date: string | null;
  created_at: string;
  product?: Product;
}

export interface CartItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  quantity: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  city: string;
  address: string;
  notes: string | null;
  items: any[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  note: string | null;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  city: string | null;
  created_at: string;
  last_order_at: string | null;
}

export interface Settings {
  id: number;
  brand_name: string;
  logo_url: string | null;
  favicon_url: string | null;
  hero_image_url: string | null;
  tagline: string;
  footer_text: string;
  currency_code: string;
  tax_percent: number;
  delivery_charge: number;
  free_delivery_threshold: number;
  whatsapp_number: string;
  instagram_url: string;
  facebook_url: string | null;
  email: string | null;
  maps_url: string | null;
  primary_color: string;
  accent_color: string;
  updated_at: string;
}

// ============================================================
// SALE MANAGEMENT
// ============================================================
export interface Sale {
  id: string;
  name: string;
  description: string | null;
  banner_url: string | null;
  badge_text: string;
  badge_color: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  start_date: string;
  end_date: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
  sale_products?: { product_id: string }[];
}

export interface SaleProduct {
  id: string;
  sale_id: string;
  product_id: string;
  created_at: string;
}

// ============================================================
// COUPONS
// ============================================================
export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_discount: number | null;
  min_order: number;
  usage_limit: number | null;
  used_count: number;
  expires_at: string | null;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// POPUPS
// ============================================================
export interface Popup {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  button_text: string | null;
  button_link: string | null;
  frequency: 'once' | 'every_visit';
  delay_seconds: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// BANNERS
// ============================================================
export interface Banner {
  id: string;
  image_url: string;
  link_url: string | null;
  title: string | null;
  subtitle: string | null;
  sort_order: number;
  is_enabled: boolean;
  created_at: string;
}

// ============================================================
// HOMEPAGE SECTIONS
// ============================================================
export interface HomepageSection {
  id: string;
  section_key: string;
  title: string | null;
  is_visible: boolean;
  order_index: number;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ============================================================
// SITE SETTINGS (theme, animation, announcement, SEO)
// ============================================================
export interface SiteSettings {
  id: number;
  announcement_enabled: boolean;
  announcement_text: string;
  announcement_bg_color: string;
  announcement_text_color: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  button_style: 'rounded' | 'pill' | 'square' | 'outline';
  border_radius: number;
  font_heading: string;
  font_body: string;
  dark_mode: boolean;
  animations_enabled: boolean;
  hero_animation: 'fade' | 'slide' | 'zoom' | 'scale' | 'parallax' | 'none';
  product_card_hover: 'lift' | 'glow' | 'scale' | 'rotate' | 'tilt' | 'none';
  button_animation: 'pulse' | 'ripple' | 'bounce' | 'glow' | 'none';
  scroll_animation: 'fade_up' | 'fade_down' | 'fade_left' | 'fade_right' | 'zoom' | 'flip' | 'none';
  animation_speed: 'slow' | 'medium' | 'fast';
  seo_title: string;
  seo_description: string;
  google_analytics_id: string | null;
  banner_auto_slide: boolean;
  banner_slide_speed: number;
  updated_at: string;
}

// ============================================================
// PRODUCT WITH SALE PRICE
// ============================================================
export interface ProductWithSale extends Product {
  sale_price?: number | null;
  sale_badge?: string | null;
  sale_color?: string | null;
  sale_id?: string | null;
  sale_name?: string | null;
  sale_end_date?: string | null;
  discount_percent?: number | null;
}

// ============================================================
// CUSTOM SCENT SYSTEM
// ============================================================
export interface CustomScentFragrance {
  id: string;
  name: string;
  is_enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BottleSize {
  id: string;
  label: string;
  volume_ml: number;
  sort_order: number;
  created_at: string;
}

export interface Concentration {
  id: string;
  percentage: number;
  is_enabled: boolean;
  sort_order: number;
  created_at: string;
}

export interface TesterFragrance {
  id: string;
  name: string;
  is_enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
