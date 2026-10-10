import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Settings, LogOut, LayoutTemplate, ShoppingBag, ShieldAlert, Globe } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { supabase } from '@/src/lib/supabase';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { useState, useEffect } from 'react';
import { api } from '@/src/services/api';
import { ShopSettings } from '@/src/types';
import { formatUserCode } from '@/src/utils/userId';

export function DashboardLayout() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [settings, setSettings] = useState<ShopSettings | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('shop_public_settings');
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return null;
  });

  useEffect(() => {
    let mounted = true;
    api.settings.getPublic().then((res) => {
      if (mounted && res) {
        setSettings(res);
        try {
          localStorage.setItem('shop_public_settings', JSON.stringify(res));
        } catch (e) {}
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const shopName = settings?.shopName || 'Webcuaban';
  const logoUrl = settings?.logo || '';

  const navItems = [
    { name: t('dash.nav.overview'), path: '/dashboard', icon: LayoutDashboard },
    { name: t('dash.nav.portfolios'), path: '/dashboard/portfolios', icon: LayoutTemplate },
    { name: t('dash.nav.domains'), path: '/dashboard/domains', icon: Globe },
    { name: t('dash.nav.orders'), path: '/dashboard/orders', icon: ShoppingBag },
    { name: t('dash.nav.settings'), path: '/dashboard/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    localStorage.removeItem('demo_auth');
    localStorage.removeItem('auth_user');
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const userCode = formatUserCode(user);

  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || (user?.email ? user.email.split('@')[0] : 'Khách hàng');
  const userInitial = displayName.charAt(0).toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar - Strictly fits 1 viewport screen without vertical scrolling */}
      <aside className="w-64 bg-white border-r border-slate-100 hidden md:flex flex-col h-screen sticky top-0 shrink-0 select-none z-30">
        <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0">
          <Link to="/" className="flex items-center gap-2.5 group">
            {logoUrl ? (
              <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-0.5 overflow-hidden group-hover:scale-105 transition-transform">
                <img 
                  src={logoUrl} 
                  alt={shopName} 
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black group-hover:scale-105 transition-transform shadow-sm">
                W
              </div>
            )}
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              {shopName}
            </span>
          </Link>
        </div>
        
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-[14px] transition-all ${
                  isActive 
                    ? 'bg-brand-50 text-brand-600 font-extrabold' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Bottom: Clean Logout button */}
        <div className="p-3 border-t border-slate-100 shrink-0 mt-auto">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3.5 py-2.5 w-full rounded-xl font-bold text-[14px] text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span>{t('dash.nav.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 md:px-8">
          <h2 className="font-bold text-slate-800 text-[18px] md:hidden">{t('dash.nav.overview')}</h2>
          
          <div className="ml-auto flex items-center gap-3.5">
            {/* Nút hình tròn đổi ngôn ngữ SVG */}
            <LanguageSwitcher />

            {/* Nút Khám phá Giao diện phong cách nền cam, text trắng */}
            <Link 
              to="/templates" 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-[14px] transition-all cursor-pointer shadow-xs"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{t('dash.nav.browse')}</span>
            </Link>

            {/* Vị trí Avatar + Tên User + User ID ở góc trên bên phải */}
            <Link
              to="/dashboard/settings"
              className="flex items-center gap-3 p-1.5 pl-2 pr-3.5 rounded-2xl hover:bg-slate-50 border border-slate-200/90 transition-all group cursor-pointer"
              title={t('dash.nav.accountSettings')}
            >
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={displayName} 
                  className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-500/20 group-hover:ring-indigo-500 transition-all"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold flex items-center justify-center text-[14px] shadow-xs">
                  {userInitial}
                </div>
              )}
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[14px] font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {displayName}
                </span>
                <span className="text-[12px] font-mono text-slate-500 font-medium">
                  {t('dash.nav.userId')}: <strong className="text-indigo-600 font-bold tracking-wider">{userCode}</strong>
                </span>
              </div>
            </Link>
          </div>
        </header>
        <div className="flex-1 p-6 overflow-auto bg-[#F8FAFC]">
          <div className="w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
