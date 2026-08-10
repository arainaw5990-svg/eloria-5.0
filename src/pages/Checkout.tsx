import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowLeft, Tag, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../lib/utils';
import type { Coupon } from '../lib/types';

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { settings } = useSettings();
  const { showToast } = useToast();

  const [form, setForm] = useState({ name: '', phone: '', city: '', address: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const deliveryFee = subtotal >= settings.free_delivery_threshold ? 0 : settings.delivery_charge;
  const total = Math.max(0, subtotal + deliveryFee - couponDiscount);

  if (items.length === 0 && !orderNumber) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-serif text-2xl font-bold text-ink-900">Your cart is empty</h1>
        <Link to="/shop" className="mt-4 inline-block text-gold-600 hover:text-gold-700">Browse products</Link>
      </div>
    );
  }

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCheckingCoupon(true);
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.trim().toUpperCase())
      .eq('is_enabled', true)
      .maybeSingle();

    setCheckingCoupon(false);

    if (!data) {
      showToast('Invalid coupon code', 'error');
      return;
    }
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      showToast('Coupon has expired', 'error');
      return;
    }
    if (data.usage_limit && data.used_count >= data.usage_limit) {
      showToast('Coupon usage limit reached', 'error');
      return;
    }
    if (subtotal < data.min_order) {
      showToast(`Minimum order of ${formatPrice(data.min_order)} required`, 'error');
      return;
    }

    let discount = 0;
    if (data.discount_type === 'percentage') {
      discount = Math.round((subtotal * data.discount_value) / 100);
      if (data.max_discount) discount = Math.min(discount, data.max_discount);
    } else {
      discount = Math.min(data.discount_value, subtotal);
    }

    setAppliedCoupon(data);
    setCouponDiscount(discount);
    showToast('Coupon applied!');
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const orderItems = items.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity }));

    const { data, error } = await supabase
      .from('orders')
      .insert({
        customer_name: form.name.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        notes: form.notes.trim() || null,
        items: orderItems,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        status: 'pending',
      })
      .select('order_number')
      .single();

    // Increment coupon usage
    if (appliedCoupon && !error) {
      await supabase.from('coupons').update({ used_count: appliedCoupon.used_count + 1 }).eq('id', appliedCoupon.id);
    }

    setSubmitting(false);

    if (error) {
      showToast('Failed to place order. Please try again.', 'error');
      return;
    }

    setOrderNumber(data.order_number);
    clearCart();
    showToast('Order placed successfully!');
  };

  if (orderNumber) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="animate-scale-in">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <Check size={40} className="text-emerald-600" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-ink-900">Order Confirmed!</h1>
          <p className="mt-3 text-ink-600">Thank you for your order. We'll contact you shortly on your phone number to confirm.</p>
          <div className="mt-6 rounded-2xl border border-ink-100 bg-ink-50 p-6">
            <p className="text-sm text-ink-500">Your Order Number</p>
            <p className="mt-1 font-serif text-2xl font-bold text-ink-900">{orderNumber}</p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/shop" className="btn-primary">Continue Shopping</Link>
            <Link to="/" className="btn-outline">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/cart" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-900">
        <ArrowLeft size={16} /> Back to Cart
      </Link>
      <h1 className="mb-8 font-serif text-3xl font-bold text-ink-900">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-ink-100 bg-white p-6">
            <h2 className="mb-4 font-serif text-xl font-bold text-ink-900">Delivery Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label-field">Full Name *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Enter your full name" />
              </div>
              <div>
                <label className="label-field">Phone Number *</label>
                <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="03XX-XXXXXXX" />
              </div>
              <div>
                <label className="label-field">City *</label>
                <input type="text" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input-field" placeholder="e.g. Karachi" />
              </div>
              <div className="sm:col-span-2">
                <label className="label-field">Delivery Address *</label>
                <textarea required rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field" placeholder="House #, Street, Area, Landmark" />
              </div>
              <div className="sm:col-span-2">
                <label className="label-field">Order Notes (optional)</label>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field" placeholder="Any special instructions..." />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gold-200 bg-gold-50 p-4">
            <p className="text-sm font-medium text-gold-800">Cash on Delivery</p>
            <p className="mt-1 text-sm text-gold-700">Pay with cash when your order is delivered to your doorstep.</p>
          </div>
        </div>

        <div className="h-fit rounded-2xl border border-ink-100 bg-white p-6">
          <h2 className="mb-4 font-serif text-xl font-bold text-ink-900">Order Summary</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-ink-600">{item.name} <span className="text-ink-400">× {item.quantity}</span></span>
                <span className="font-medium text-ink-900">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Coupon */}
          <div className="mt-4 border-t border-ink-100 pt-4">
            {appliedCoupon ? (
              <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
                <span className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                  <Tag size={14} /> {appliedCoupon.code}
                </span>
                <button type="button" onClick={removeCoupon} className="text-emerald-600 hover:text-emerald-800">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Coupon code" className="input-field text-sm" />
                <button type="button" onClick={applyCoupon} disabled={checkingCoupon || !couponCode.trim()} className="shrink-0 rounded-lg bg-ink-900 px-4 py-2 text-sm font-medium text-white hover:bg-ink-800 disabled:opacity-50">
                  {checkingCoupon ? '...' : 'Apply'}
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2 border-t border-ink-100 pt-4 text-sm">
            <div className="flex justify-between text-ink-600"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between text-ink-600"><span>Delivery</span><span>{deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}</span></div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-{formatPrice(couponDiscount)}</span></div>
            )}
            {deliveryFee === 0 && <p className="text-xs text-emerald-600">Free delivery applied!</p>}
          </div>
          <div className="mt-4 border-t border-ink-100 pt-4">
            <div className="flex justify-between font-bold text-ink-900"><span>Total</span><span>{formatPrice(total)}</span></div>
          </div>
          <button type="submit" disabled={submitting} className="mt-6 w-full rounded-full bg-gold-400 px-6 py-3 text-sm font-semibold text-ink-900 transition hover:bg-gold-300 active:scale-95 disabled:opacity-50">
            {submitting ? 'Placing Order...' : 'Place Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
