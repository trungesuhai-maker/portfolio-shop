import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Settings, LogOut, FileCode2, ShoppingBag, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { supabase } from '@/src/lib/supabase';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';

export function DashboardLayout() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const navItems = [
    { name: t('dash.nav.overview'), path: '/dashboard', icon: LayoutDashboard },
    { name: t('dash.nav.portfolios'), path: '/dashboard/portfolios', icon: FileCode2 },
    { name: t('dash.nav.orders'), path: '/dashboard/orders', icon: ShoppingBag },
    { name: t('dash.nav.settings'), path: '/dashboard/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    localStorage.removeItem('demo_auth');
    await supabase.auth.signOut();
    // Force a full reload to clear all states and context
    window.location.href = '/';
  };

  const getInitials = () => {
    if (!user) return 'U';
    const name = user.user_metadata?.full_name;
    if (name) {
      return name.substring(0, 2).toUpperCase();
    }
    return user.email?.substring(0, 2).toUpperCase() || 'U';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white font-black group-hover:scale-105 transition-transform">
               P
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">ClientArea</span>
          </Link>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1">
          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/60 mb-3 shadow-xs"
            >
              <ShieldAlert className="w-5 h-5 text-indigo-600" />
              <span>Admin Control Panel</span>
            </Link>
          )}

          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  isActive 
                    ? 'bg-brand-50 text-brand-600' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
              {getInitials()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">
                {user?.user_metadata?.full_name || 'User'}
              </p>
              <p className="text-xs font-medium text-slate-500 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-bold text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {t('dash.nav.logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 md:px-8">
          <h2 className="font-bold text-slate-800 md:hidden">Dashboard</h2>
          <div className="ml-auto flex items-center gap-4">
            <LanguageSwitcher />
            <Link to="/templates" className="text-sm font-bold text-brand-600 hover:text-brand-700">
              {t('dash.nav.browse')}
            </Link>
          </div>
        </header>
        <div className="flex-1 p-6 md:p-8 overflow-auto">
          <div className="max-w-5xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
