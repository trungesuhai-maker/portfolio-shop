import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Store, ShieldAlert, LayoutDashboard, AlertOctagon, Mail, Phone, MapPin, Globe } from 'lucide-react';
import { Button } from '../ui/Button';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { api } from '@/src/services/api';
import { ShopSettings } from '@/src/types';
import { DEFAULT_SETTINGS } from '@/src/services/defaultSettings';
import { formatUserCode } from '@/src/utils/userId';

export function PublicLayout() {
  const location = useLocation();
  const isAuthPage = location.pathname.startsWith('/auth');
  const { t } = useLanguage();
  const { user, isAdmin, logout } = useAuth();
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

        // Inject Shop-wide SEO into document head if not on customer portfolio page
        if (!location.pathname.startsWith('/p/')) {
          if (res.seo?.metaTitle) document.title = res.seo.metaTitle;
          
          const setMetaTag = (attr: 'name' | 'property', key: string, content: string) => {
            let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement;
            if (!el) {
              el = document.createElement('meta');
              el.setAttribute(attr, key);
              document.head.appendChild(el);
            }
            el.setAttribute('content', content);
          };

          const setLinkTag = (rel: string, href: string) => {
            let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
            if (!el) {
              el = document.createElement('link');
              el.setAttribute(rel, rel);
              document.head.appendChild(el);
            }
            el.setAttribute('href', href);
          };

          if (res.seo?.metaDescription) {
            setMetaTag('name', 'description', res.seo.metaDescription);
            setMetaTag('property', 'og:description', res.seo.metaDescription);
          }
          if (res.seo?.metaTitle) {
            setMetaTag('property', 'og:title', res.seo.metaTitle);
          }
          if (res.seo?.ogImage) {
            setMetaTag('property', 'og:image', res.seo.ogImage);
          }
          if (res.seo?.canonical) {
            setLinkTag('canonical', res.seo.canonical);
          }
          if (res.favicon) {
            setLinkTag('icon', res.favicon);
          }
        }
      }
    }).catch(console.error);

    return () => { mounted = false; };
  }, [location.pathname]);

  const DEFAULT_SHOP_NAME = DEFAULT_SETTINGS.shopName || 'Webcuaban';
  const DEFAULT_LOGO_URL = DEFAULT_SETTINGS.logo || '';

  const shopName = settings?.shopName || DEFAULT_SHOP_NAME;
  const logoUrl = settings?.logo || DEFAULT_LOGO_URL;
  const [logoError, setLogoError] = useState(false);
  const isMaintenance = settings?.maintenanceMode && !isAdmin;

  return (
    <div className="min-h-screen flex flex-col relative bg-slate-50">
      
      {/* Maintenance Mode Banner */}
      {settings?.maintenanceMode && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 z-50 fixed top-0 left-0 right-0 shadow-sm h-8">
          <AlertOctagon className="w-4 h-4 text-amber-900" />
          <span>Hệ thống Shop đang bật chế độ bảo trì (Maintenance Mode). {isAdmin ? '(Bạn đang xem dưới quyền Admin)' : ''}</span>
        </div>
      )}

      {/* Header - Fixed on top when scrolling */}
      <header className={`fixed ${settings?.maintenanceMode ? 'top-8' : 'top-0'} left-0 right-0 w-full z-40 transition-all duration-300 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            {logoUrl && !logoError ? (
              <div 
                className="overflow-hidden flex items-center justify-center rounded-xl transition-transform group-hover:scale-105"
                style={{
                  height: `${settings?.logoStyle?.height || 36}px`,
                  minWidth: `${settings?.logoStyle?.height || 36}px`,
                  justifyContent: settings?.logoStyle?.position === 'left' ? 'flex-start' : settings?.logoStyle?.position === 'right' ? 'flex-end' : 'center',
                  alignItems: settings?.logoStyle?.position === 'top' ? 'flex-start' : settings?.logoStyle?.position === 'bottom' ? 'flex-end' : 'center',
                }}
              >
                <img 
                  src={logoUrl} 
                  alt={shopName} 
                  onError={() => setLogoError(true)}
                  style={{
                    height: `${settings?.logoStyle?.height || 36}px`,
                    objectFit: settings?.logoStyle?.fit || 'contain',
                    objectPosition: settings?.logoStyle?.position || 'center'
                  }}
                  className="max-h-full max-w-full"
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white font-black group-hover:scale-105 transition-transform shadow-xs">
                {shopName.charAt(0)}
              </div>
            )}
            <span className="font-extrabold text-2xl tracking-tight text-slate-900">
              {shopName}
            </span>
          </Link>
          
          <nav className="flex items-center gap-6 sm:gap-8">
            <Link 
              to="/" 
              className={`text-base font-bold transition-colors ${
                location.pathname === '/' 
                  ? 'text-brand-600 font-extrabold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Trang chủ
            </Link>
            <Link 
              to="/templates" 
              className={`text-base font-bold transition-colors ${
                location.pathname.startsWith('/templates') || location.pathname.startsWith('/category') 
                  ? 'text-brand-600 font-extrabold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Shop giao diện
            </Link>
          </nav>
          
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {user ? (() => {
              const userCode = formatUserCode(user);
              const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
              const displayName = user.user_metadata?.full_name || user.user_metadata?.name || (user.email ? user.email.split('@')[0] : 'Khách hàng');
              const userInitial = displayName.charAt(0).toUpperCase() || 'U';

              return (
                <div className="flex items-center gap-2 sm:gap-3">
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2 p-1 sm:pr-3 rounded-full hover:bg-slate-100 transition-all group border border-transparent hover:border-slate-200"
                    title="Nhấp để vào User Dashboard"
                  >
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt={displayName} 
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/20 group-hover:ring-indigo-500 transition-all shadow-xs" 
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold flex items-center justify-center text-xs shadow-xs ring-2 ring-indigo-500/20 group-hover:ring-indigo-500 transition-all">
                        {userInitial}
                      </div>
                    )}
                    <div className="hidden sm:flex flex-col text-left leading-tight">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">User ID</span>
                      <span className="text-xs font-mono font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {userCode}
                      </span>
                    </div>
                  </Link>

                  <button
                    onClick={logout}
                    className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors rounded-full hover:bg-slate-100 cursor-pointer"
                    title="Đăng xuất khỏi tài khoản"
                  >
                    Đăng xuất
                  </button>
                </div>
              );
            })() : (
              <div className="flex items-center gap-2">
                <Link to="/auth/login">
                  <Button variant="ghost" size="sm" className="px-3 sm:px-4 text-xs font-bold text-slate-700 hover:text-slate-900">
                    Đăng nhập
                  </Button>
                </Link>
                <Link to="/auth/register">
                  <Button size="sm" className="px-4 sm:px-5 text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-xs">
                    Đăng ký
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content with top padding offset to prevent overlapping fixed header */}
      <main className={`flex-1 w-full relative z-10 ${settings?.maintenanceMode ? 'pt-24' : 'pt-16'}`}>
        <Outlet />
      </main>

      {/* Footer */}
      {!isAuthPage && (
        <footer className="bg-white border-t border-slate-100 pt-20 pb-10 mt-auto relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-16">
              <div className="col-span-2 lg:col-span-2 space-y-4">
                <Link to="/" className="flex items-center gap-2.5">
                  {logoUrl && !logoError ? (
                    <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-0.5 overflow-hidden">
                      <img 
                        src={logoUrl} 
                        alt={shopName} 
                        onError={() => setLogoError(true)}
                        style={{
                          objectFit: settings?.logoStyle?.fit || 'contain',
                        }}
                        className="max-h-full max-w-full" 
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white font-black shadow-xs">
                      {shopName.charAt(0)}
                    </div>
                  )}
                  <span className="font-extrabold text-xl tracking-tight text-slate-900">
                    {shopName}
                  </span>
                </Link>

                {/* Contact snippet if configured */}
                {settings?.contact && (
                  <div className="pt-2 space-y-1 text-xs text-slate-500 font-medium">
                    {settings.contact.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <a href={`mailto:${settings.contact.email}`} className="hover:text-indigo-600">{settings.contact.email}</a>
                      </div>
                    )}
                    {settings.contact.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{settings.contact.phone}</span>
                      </div>
                    )}
                    {settings.contact.address && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{settings.contact.address}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="font-bold text-slate-900 mb-4">{t('footer.categories')}</h4>
                <ul className="space-y-3 text-sm font-medium text-slate-500">
                  <li><Link to="/category/software-developer" className="hover:text-brand-600 transition-colors">Developers</Link></li>
                  <li><Link to="/category/creative-designer" className="hover:text-brand-600 transition-colors">Designers</Link></li>
                  <li><Link to="/category/content-creator" className="hover:text-brand-600 transition-colors">Creators</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-4">{t('footer.platform')}</h4>
                <ul className="space-y-3 text-sm font-medium text-slate-500">
                  <li><Link to="/templates" className="hover:text-brand-600 transition-colors">{t('nav.templates')}</Link></li>
                  <li><Link to="/templates?tab=website" className="hover:text-brand-600 transition-colors">Website Templates</Link></li>
                  <li><Link to="/templates?tab=landing_page" className="hover:text-brand-600 transition-colors">Landing Pages</Link></li>
                  <li><Link to="/templates?tab=portfolio" className="hover:text-brand-600 transition-colors">Portfolio Mẫu</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-4">Kết Nối & Hỗ Trợ</h4>
                <ul className="space-y-3 text-sm font-medium text-slate-500">
                  {settings?.socialLinks?.github && (
                    <li><a href={settings.socialLinks.github} target="_blank" rel="noreferrer" className="hover:text-brand-600 transition-colors">GitHub</a></li>
                  )}
                  {settings?.socialLinks?.twitter && (
                    <li><a href={settings.socialLinks.twitter} target="_blank" rel="noreferrer" className="hover:text-brand-600 transition-colors">Twitter (X)</a></li>
                  )}
                  {settings?.socialLinks?.linkedin && (
                    <li><a href={settings.socialLinks.linkedin} target="_blank" rel="noreferrer" className="hover:text-brand-600 transition-colors">LinkedIn</a></li>
                  )}
                  <li><Link to="/auth/login" className="hover:text-brand-600 transition-colors">Đăng nhập tài khoản</Link></li>
                </ul>
              </div>
            </div>
            
            <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap text-sm text-slate-400">
                <span>{settings?.footer?.copyrightText || `© ${new Date().getFullYear()} ${shopName}. All rights reserved.`}</span>
                <span>•</span>
                {/* Nút dẫn đến trang đăng nhập dành riêng cho Quản trị viên (Admin) */}
                <Link 
                  to="/admin/login" 
                  className="text-slate-300/60 hover:text-slate-600 hover:underline text-[11px] font-mono tracking-tighter transition-colors select-none"
                  title="Cổng Đăng Nhập Quản Trị Viên (Admin Portal)"
                >
                  admin
                </Link>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
