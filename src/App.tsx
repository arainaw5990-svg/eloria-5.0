import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import AdminLayout from './pages/admin/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOrders from './pages/admin/AdminOrders';
import AdminReviews from './pages/admin/AdminReviews';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminSettings from './pages/admin/AdminSettings';
import AdminSales from './pages/admin/AdminSales';
import AdminCoupons from './pages/admin/AdminCoupons';
import HomepageBuilder from './pages/admin/HomepageBuilder';
import AdminAnimations from './pages/admin/AdminAnimations';
import AdminTheme from './pages/admin/AdminTheme';
import AdminPopups from './pages/admin/AdminPopups';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import CustomScentManager from './pages/admin/CustomScentManager';
import TesterKitManager from './pages/admin/TesterKitManager';

export default function App() {
  return (
    <ToastProvider>
      <SettingsProvider>
        <SiteSettingsProvider>
          <AuthProvider>
            <CartProvider>
              <BrowserRouter>
                <Routes>
                  {/* Storefront */}
                  <Route element={<Layout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/product/:slug" element={<ProductDetail />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                  </Route>

                  {/* Admin */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="analytics" element={<AdminAnalytics />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="customers" element={<AdminCustomers />} />
                    <Route path="sales" element={<AdminSales />} />
                    <Route path="coupons" element={<AdminCoupons />} />
                    <Route path="homepage" element={<HomepageBuilder />} />
                    <Route path="animations" element={<AdminAnimations />} />
                    <Route path="theme" element={<AdminTheme />} />
                    <Route path="popups" element={<AdminPopups />} />
                    <Route path="custom-scent" element={<CustomScentManager />} />
                    <Route path="tester-kit" element={<TesterKitManager />} />
                    <Route path="reviews" element={<AdminReviews />} />
                    <Route path="settings" element={<AdminSettings />} />
                  </Route>

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </CartProvider>
          </AuthProvider>
        </SiteSettingsProvider>
      </SettingsProvider>
    </ToastProvider>
  );
}
