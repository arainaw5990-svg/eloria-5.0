import { useEffect, useState } from 'react';
import { Search, Download, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { formatPrice, formatDateTime, STATUS_LABELS, STATUS_COLORS } from '../../lib/utils';
import type { Order, OrderStatus } from '../../lib/types';

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    setOrders(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = orders.filter((o) => {
    if (statusFilter && o.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return o.order_number.toLowerCase().includes(q) || o.customer_name.toLowerCase().includes(q) || o.phone.includes(q);
    }
    return true;
  });

  const updateStatus = async (id: string, status: OrderStatus) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) { showToast('Failed to update status', 'error'); return; }
    showToast('Status updated');
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this order?')) return;
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) { showToast('Failed to delete', 'error'); return; }
    showToast('Order deleted');
    load();
  };

  const exportCSV = () => {
    const headers = ['Order #', 'Customer', 'Phone', 'City', 'Total', 'Status', 'Date'];
    const rows = filtered.map((o) => [
      o.order_number, o.customer_name, o.phone, o.city, o.total, o.status, formatDateTime(o.created_at),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-ink-900">Orders</h1>
        <button onClick={exportCSV} className="btn-outline"><Download size={16} /> Export CSV</button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-3 text-ink-400" />
          <input type="text" placeholder="Search by order #, name, or phone" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field sm:w-48">
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-ink-100" />)}</div>
      ) : filtered.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wider text-ink-500">
                <th className="px-4 py-3"></th>
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <>
                  <tr key={order.id} className="border-b border-ink-50 hover:bg-ink-50/50">
                    <td className="px-4 py-3">
                      <button onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
                        {expanded === order.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium text-ink-900">{order.order_number}</td>
                    <td className="px-4 py-3 text-ink-600">{order.customer_name}</td>
                    <td className="px-4 py-3 text-ink-600">{order.city}</td>
                    <td className="px-4 py-3 font-medium text-ink-900">{formatPrice(order.total)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[order.status]}`}
                      >
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-ink-500">{formatDateTime(order.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(order.id)} className="rounded-lg p-2 text-ink-500 hover:bg-red-50 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                  {expanded === order.id && (
                    <tr className="bg-ink-50/50">
                      <td colSpan={8} className="px-4 py-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-500">Items</h4>
                            <div className="space-y-1">
                              {order.items.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between text-sm">
                                  <span className="text-ink-700">{item.name} × {item.quantity}</span>
                                  <span className="text-ink-600">{formatPrice(item.price * item.quantity)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-500">Delivery Info</h4>
                            <p className="text-sm text-ink-700"><span className="text-ink-500">Phone:</span> {order.phone}</p>
                            <p className="text-sm text-ink-700"><span className="text-ink-500">Address:</span> {order.address}</p>
                            {order.notes && <p className="text-sm text-ink-700"><span className="text-ink-500">Notes:</span> {order.notes}</p>}
                            <div className="mt-2 space-y-1 border-t border-ink-200 pt-2 text-sm">
                              <div className="flex justify-between text-ink-600"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
                              <div className="flex justify-between text-ink-600"><span>Delivery</span><span>{formatPrice(order.delivery_fee)}</span></div>
                              <div className="flex justify-between font-bold text-ink-900"><span>Total</span><span>{formatPrice(order.total)}</span></div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-ink-200 py-16 text-center">
          <p className="text-ink-400">No orders found.</p>
        </div>
      )}
    </div>
  );
}
