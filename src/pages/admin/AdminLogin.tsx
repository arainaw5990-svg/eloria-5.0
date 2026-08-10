import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Sparkles, UserPlus, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../context/SettingsContext';

export default function AdminLogin() {
  const { session, signIn } = useAuth();
  const { showToast } = useToast();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    if (session) navigate('/admin', { replace: true });
  }, [session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      showToast('Invalid credentials', 'error');
    } else {
      showToast('Welcome back!');
      navigate('/admin');
    }
  };

  const initializeAdmin = async () => {
    setInitializing(true);
    try {
      const { data: { session_url } } = await supabase.functions.invoke('admin-setup');
      void session_url;
      showToast('Admin account initialized! You can now sign in.');
    } catch {
      showToast('Failed to initialize admin account', 'error');
    }
    setInitializing(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Sparkles size={32} className="mx-auto mb-3 text-gold-400" />
          <h1 className="font-serif text-3xl font-bold text-white">{settings.brand_name}</h1>
          <p className="mt-2 text-sm text-ink-400">Admin Dashboard</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <h2 className="mb-6 font-serif text-xl font-bold text-ink-900">Sign In</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-field">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-3 text-ink-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="admin@eloria.com"
                />
              </div>
            </div>
            <div>
              <label className="label-field">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-3 text-ink-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Enter password"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gold-400 px-6 py-3 text-sm font-semibold text-ink-900 transition hover:bg-gold-300 disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 border-t border-ink-100 pt-6">
            <button
              onClick={initializeAdmin}
              disabled={initializing}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-ink-200 px-6 py-2.5 text-sm font-medium text-ink-600 transition hover:bg-ink-50 disabled:opacity-50"
            >
              {initializing ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              Initialize Admin Account
            </button>
            <p className="mt-2 text-center text-xs text-ink-400">
              Creates the default admin account if it doesn't exist
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-ink-400 transition hover:text-white">
            Back to Store
          </Link>
        </div>
      </div>
    </div>
  );
}
