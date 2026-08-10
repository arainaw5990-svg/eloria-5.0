import { useEffect, useState } from 'react';
import { Search, Phone, MapPin, ShoppingBag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDate, formatPrice } from '../../lib/utils';
import type { Customer, Order } from '../../lib/types';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    supabase.from('customers').select('*').order('created_at', { ascending: false }).then(({ data }) => setCustomers(data ?? []));
  }, []);

  const viewOrders = async (customer: Customer) => {
    setSelected(customer);
    const { data } = await supabase.from('orders').select('*').eq('phone', customer.phone).order('created_at', { ascending: false });
    setOrders(data ?? []);
  };

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.city ?? '').toLowerCase().includes(q);
  });

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-bold text-ink-900">Customers</h1>

      <div className="relative mb-4 max-w-sm">
        <Search size={18} className="absolute left-3 top-3 text-ink-400" />
        <input type="text" placeholder="Search by name, phone, or city" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => viewOrders(c)}
              className="rounded-2xl border border-ink-100 bg-white p-5 text-left transition hover:shadow-md"
            >
              <h3 className="font-semibold text-ink-900">{c.name}</h3>
              <div className="mt-2 space-y-1 text-sm text-ink-500">
                <p className="flex items-center gap-2"><Phone size={14} /> {c.phone}</p>
                {c.city && <p className="flex items-center gap-2"><MapPin size={14} /> {c.city}</p>}
                <p className="flex items-center gap-2"><ShoppingBag size={14} /> Last order: {c.last_order_at ? formatDate(c.last_order_at) : 'Never'}</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-ink-200 py-16 text-center">
          <p className="text-ink-400">No customers found.</p>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}>
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-xl font-bold text-ink-900">{selected.name}</h2>
            <p className="mt-1 text-sm text-ink-500">{selected.phone} · {selected.city ?? 'No city'}</p>
            <p className="mt-1 text-xs text-ink-400">Customer since {formatDate(selected.created_at)}</p>

            <h3 className="mt-6 mb-3 font-serif text-lg font-bold text-ink-900">Order History</h3>
            {orders.length > 0 ? (
              <div className="space-y-2">
                {orders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between rounded-lg border border-ink-100 p-3">
                    <div>
                      <p className="text-sm font-medium text-ink-900">{o.order_number}</p>
                      <p className="text-xs text-ink-500">{formatDate(o.created_at)} · {o.status}</p>
                    </div>
                    <span className="font-medium text-ink-900">{formatPrice(o.total)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-400">No orders yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
