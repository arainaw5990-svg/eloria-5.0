import { useEffect, useState } from 'react';
import { TrendingUp, ShoppingCart, Users, Clock, XCircle, Package, AlertTriangle, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../lib/utils';
import BarChart from '../../components/BarChart';

interface AnalyticsData {
  revenue: number;
  orders: number;
  customers: number;
  pendingOrders: number;
  cancelledOrders: number;
  avgOrderValue: number;
  lowStock: { id: string; name: string; stock: number }[];
  topProducts: { name: string; sold: number; revenue: number }[];
  monthlySales: { label: string; value: number }[];
}

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from('orders').select('*'),
      supabase.from('customers').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id, name, stock_quantity'),
    ]).then(([o, c, p]) => {
      const orders = o.data ?? [];
      const products = p.data ?? [];

      const delivered = orders.filter((o) => o.status === 'delivered');
      const revenue = delivered.reduce((s, o) => s + o.total, 0);
      const pending = orders.filter((o) => o.status === 'pending').length;
      const cancelled = orders.filter((o) => o.status === 'cancelled').length;
      const avgOrder = orders.length > 0 ? Math.round(orders.reduce((s, o) => s + o.total, 0) / orders.length) : 0;

      // Top products by sales
      const productSales: Record<string, { name: string; sold: number; revenue: number }> = {};
      orders.forEach((o) => {
        o.items?.forEach((item: any) => {
          if (!productSales[item.id]) productSales[item.id] = { name: item.name, sold: 0, revenue: 0 };
          productSales[item.id].sold += item.quantity;
          productSales[item.id].revenue += item.price * item.quantity;
        });
      });
      const topProducts = Object.values(productSales).sort((a, b) => b.sold - a.sold).slice(0, 5);

      // Monthly sales (last 6 months)
      const now = new Date();
      const monthlySales: { label: string; value: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = month.toLocaleString('en', { month: 'short' });
        const value = orders
          .filter((o) => {
            const d = new Date(o.created_at);
            return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
          })
          .reduce((s, o) => s + o.total, 0);
        monthlySales.push({ label: monthName, value });
      }

      const lowStock = products
        .filter((p) => p.stock_quantity <= 5)
        .sort((a, b) => a.stock_quantity - b.stock_quantity)
        .slice(0, 5)
        .map((p) => ({ id: p.id, name: p.name, stock: p.stock_quantity }));

      setData({
        revenue, orders: orders.length, customers: c.count ?? 0,
        pendingOrders: pending, cancelledOrders: cancelled, avgOrderValue: avgOrder,
        lowStock, topProducts, monthlySales,
      });
    });
  }, []);

  if (!data) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-ink-100" />)}</div>;
  }

  const statCards = [
    { label: 'Total Revenue', value: formatPrice(data.revenue), icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Total Orders', value: data.orders, icon: ShoppingCart, color: 'text-blue-600 bg-blue-50' },
    { label: 'Customers', value: data.customers, icon: Users, color: 'text-purple-600 bg-purple-50' },
    { label: 'Avg Order Value', value: formatPrice(data.avgOrderValue), icon: TrendingUp, color: 'text-gold-600 bg-gold-50' },
    { label: 'Pending Orders', value: data.pendingOrders, icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'Cancelled', value: data.cancelledOrders, icon: XCircle, color: 'text-red-600 bg-red-50' },
  ];

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-bold text-ink-900">Analytics</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-ink-100 bg-white p-5">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full ${card.color}`}>
              <card.icon size={20} />
            </div>
            <p className="text-xl font-bold text-ink-900">{card.value}</p>
            <p className="mt-1 text-xs font-medium text-ink-500">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Monthly Sales Chart */}
      <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-6">
        <h2 className="mb-4 font-serif text-lg font-bold text-ink-900">Monthly Sales (Last 6 Months)</h2>
        <BarChart data={data.monthlySales} height={220} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <div className="rounded-2xl border border-ink-100 bg-white p-6">
          <h2 className="mb-4 font-serif text-lg font-bold text-ink-900">Top Selling Products</h2>
          {data.topProducts.length > 0 ? (
            <div className="space-y-3">
              {data.topProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-100 text-sm font-bold text-ink-600">{i + 1}</span>
                    <span className="text-sm font-medium text-ink-900">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-ink-900">{p.sold} sold</p>
                    <p className="text-xs text-ink-500">{formatPrice(p.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-ink-400">No sales data yet.</p>}
        </div>

        {/* Low Stock */}
        <div className="rounded-2xl border border-ink-100 bg-white p-6">
          <h2 className="mb-4 flex items-center gap-2 font-serif text-lg font-bold text-ink-900">
            <AlertTriangle size={18} className="text-amber-500" /> Low Stock Alert
          </h2>
          {data.lowStock.length > 0 ? (
            <div className="space-y-3">
              {data.lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-ink-900">
                    <Package size={16} className="text-ink-400" /> {p.name}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {p.stock} left
                  </span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-ink-400">All products well stocked.</p>}
        </div>
      </div>
    </div>
  );
}
