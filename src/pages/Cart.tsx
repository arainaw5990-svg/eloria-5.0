import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../lib/utils';

export default function Cart() {
  const { items, updateQuantity, removeFromCart, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <ShoppingBag size={48} className="mx-auto mb-4 text-ink-300" />
        <h1 className="font-serif text-3xl font-bold text-ink-900">Your Cart is Empty</h1>
        <p className="mt-2 text-ink-500">Discover our luxury fragrances and find your signature scent.</p>
        <Link to="/shop" className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold-400 px-6 py-3 text-sm font-semibold text-ink-900 transition hover:bg-gold-300">
          Browse Products <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 font-serif text-3xl font-bold text-ink-900">Shopping Cart</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Items */}
        <div className="space-y-4 lg:col-span-2">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 rounded-2xl border border-ink-100 bg-white p-4">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-ink-50">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ShoppingBag size={24} className="text-ink-300" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between">
                  <Link to={`/product/${item.slug}`} className="font-serif text-lg font-semibold text-ink-900 hover:text-gold-600">
                    {item.name}
                  </Link>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="rounded-full p-1.5 text-ink-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <p className="text-sm text-ink-500">{formatPrice(item.price)}</p>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-ink-200">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="rounded-full p-1.5 text-ink-600 hover:text-ink-900"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="rounded-full p-1.5 text-ink-600 hover:text-ink-900"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <span className="font-bold text-ink-900">{formatPrice(item.price * item.quantity)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="h-fit rounded-2xl border border-ink-100 bg-white p-6">
          <h2 className="font-serif text-xl font-bold text-ink-900">Order Summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-ink-600">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-ink-600">
              <span>Delivery</span>
              <span>Calculated at checkout</span>
            </div>
          </div>
          <div className="mt-4 border-t border-ink-100 pt-4">
            <div className="flex justify-between font-bold text-ink-900">
              <span>Estimated Total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
          </div>
          <Link
            to="/checkout"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gold-400 px-6 py-3 text-sm font-semibold text-ink-900 transition hover:bg-gold-300 active:scale-95"
          >
            Proceed to Checkout <ArrowRight size={18} />
          </Link>
          <Link to="/shop" className="mt-3 block text-center text-sm font-medium text-ink-500 hover:text-ink-900">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
