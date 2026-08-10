import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tag, ShoppingCart, Star, Users, Settings as SettingsIcon,
  LogOut, Menu, X, Percent, LayoutTemplate, Sparkles, Palette, Megaphone, BarChart3,
  FlaskConical, FlaskRound,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Tag },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/sales', label: 'Sales', icon: Percent },
  { to: '/admin/coupons', label: 'Coupons', icon: Tag },
  { to: '/admin/homepage', label: 'Homepage Builder', icon: LayoutTemplate },
  { to: '/admin/animations', label: 'Animations', icon: Sparkles },
  { to: '/admin/theme', label: 'Theme Manager', icon: Palette },
  { to: '/admin/popups', label: 'Popups', icon: Megaphone },
  { to: '/admin/custom-scent', label: 'Custom Scent', icon: FlaskConical },
  { to: '/admin/tester-kit', label: 'Tester Kit', icon: FlaskRound },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/settings', label: 'Settings', icon: SettingsIcon },
];

export default function AdminLayout() {
  const { session, signOut } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!session) navigate('/admin/login', { replace: true });
  }, [session, navigate]);

  if (!session) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const sidebar = (
    <>
      <div className="flex h-16 items-center px-6">
        <Link to="/admin" className="font-serif text-xl font-bold text-white">{settings.brand_name}</Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-gold-400 text-ink-900' : 'text-ink-300 hover:bg-ink-800 hover:text-white'
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-ink-800 p-4">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-300 transition hover:bg-ink-800 hover:text-white"
        >
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-ink-100 bg-ink-900 text-ink-200 lg:flex">
        {sidebar}
      </aside>

      {/* Mobile Header */}
      <div className="flex h-16 items-center justify-between border-b border-ink-100 bg-white px-4 lg:hidden">
        <Link to="/admin" className="font-serif text-lg font-bold text-ink-900">{settings.brand_name}</Link>
        <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 hover:bg-ink-100"><Menu size={20} /></button>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-ink-900 text-ink-200 animate-slide-up">
            <div className="flex h-16 items-center justify-between px-6">
              <span className="font-serif text-xl font-bold text-white">{settings.brand_name}</span>
              <button onClick={() => setSidebarOpen(false)} className="rounded p-1 text-ink-300 hover:text-white"><X size={20} /></button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      isActive ? 'bg-gold-400 text-ink-900' : 'text-ink-300 hover:bg-ink-800 hover:text-white'
                    }`
                  }
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="border-t border-ink-800 p-4">
              <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-300 transition hover:bg-ink-800 hover:text-white">
                <LogOut size={18} /> Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="lg:pl-64">
        <main className="min-h-screen p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
