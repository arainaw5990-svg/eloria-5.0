import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, Users, Star, TrendingUp, Clock, CheckCircle, AlertTriangle, XCircle, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatPrice, formatDate, STATUS_LABELS, STATUS_COLORS } from '../../lib/utils';
import type { Order } from '../../lib/types';
import BarChart from '../../components/BarChart';

interface Stats {
  products: number;
  orders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  customers: number;
  reviews: number;
  revenue: number;
  avgOrderValue: number;
  lowStockCount: number;
  monthlySales: { label: string; value: number }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    products: 0, orders: 0, pendingOrders: 0, completedOrders: 0, cancelledOrders: 0,
    customers: 0, reviews: 0, revenue: 0, avgOrderValue: 0, lowStockCount: 0, monthlySales: [],
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from('products').select('id, stock_quantity'),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('customers').select('id', { count: 'exact', head: true }),
      supabase.from('reviews').select('id', { count: 'exact', head: true }),
    ]).then(([p, o, c, r]) => {
      const orders = (o.data ?? []) as Order[];
      const products = p.data ?? [];
      const delivered = orders.filter((o) => o.status === 'delivered');
      const revenue = delivered.reduce((s, o) => s + o.total, 0);
      const avgOrder = orders.length > 0 ? Math.round(orders.reduce((s, o) => s + o.total, 0) / orders.length) : 0;
      const lowStock = products.filter((p) => p.stock_quantity <= 5).length;

      // Monthly sales (last 6 months)
      const now = new Date();
      const monthlySales: { label: string; value: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = month.toLocaleString('en', { month: 'short' });
        const value = orders
          .filter((o) => { const d = new Date(o.created_at); return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear(); })
          .reduce((s, o) => s + o.total, 0);
        monthlySales.push({ label: monthName, value });
      }

      setStats({
        products: products.length,
        orders: orders.length,
        pendingOrders: orders.filter((o) => o.status === 'pending').length,
        completedOrders: delivered.length,
        cancelledOrders: orders.filter((o) => o.status === 'cancelled').length,
        customers: c.count ?? 0,
        reviews: r.count ?? 0,
        revenue,
        avgOrderValue: avgOrder,
        lowStockCount: lowStock,
        monthlySales,
      });
      setRecentOrders(orders.slice(0, 5));
    });
  }, []);

  const statCards = [
    { label: 'Revenue', value: formatPrice(stats.revenue), icon: DollarSign, to: '/admin/analytics', color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Products', value: stats.products, icon: Package, to: '/admin/products', color: 'text-blue-600 bg-blue-50' },
    { label: 'Orders', value: stats.orders, icon: ShoppingCart, to: '/admin/orders', color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Pending', value: stats.pendingOrders, icon: Clock, to: '/admin/orders', color: 'text-amber-600 bg-amber-50' },
    { label: 'Completed', value: stats.completedOrders, icon: CheckCircle, to: '/admin/orders', color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Cancelled', value: stats.cancelledOrders, icon: XCircle, to: '/admin/orders', color: 'text-red-600 bg-red-50' },
    { label: 'Customers', value: stats.customers, icon: Users, to: '/admin/customers', color: 'text-purple-600 bg-purple-50' },
    { label: 'Avg Order', value: formatPrice(stats.avgOrderValue), icon: TrendingUp, to: '/admin/analytics', color: 'text-gold-600 bg-gold-50' },
    { label: 'Low Stock', value: stats.lowStockCount, icon: AlertTriangle, to: '/admin/products', color: 'text-orange-600 bg-orange-50' },
    { label: 'Reviews', value: stats.reviews, icon: Star, to: '/admin/reviews', color: 'text-pink-600 bg-pink-50' },
  ];

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-bold text-ink-900">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {statCards.map((card) => (
          <Link key={card.label} to={card.to} className="group rounded-2xl border border-ink-100 bg-white p-5 transition hover:shadow-md">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full ${card.color}`}>
              <card.icon size={20} />
            </div>
            <p className="text-xl font-bold text-ink-900">{card.value}</p>
            <p className="mt-1 text-xs font-medium text-ink-500">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Monthly Sales Chart */}
      <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-6">
        <h2 className="mb-4 font-serif text-lg font-bold text-ink-900">Monthly Sales</h2>
        <BarChart data={stats.monthlySales} height={200} />
      </div>

      {/* Recent Orders */}
      <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-ink-900">Recent Orders</h2>
          <Link to="/admin/orders" className="text-sm font-medium text-gold-600 hover:text-gold-700">View All</Link>
        </div>
        {recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wider text-ink-500">
                  <th className="pb-3">Order #</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-ink-50">
                    <td className="py-3 font-medium text-ink-900">{order.order_number}</td>
                    <td className="py-3 text-ink-500">{formatDate(order.created_at)}</td>
                    <td className="py-3">
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="py-3 text-right font-medium text-ink-900">{formatPrice(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-ink-400">No orders yet.</p>
        )}
      </div>
    </div>
  );
}
