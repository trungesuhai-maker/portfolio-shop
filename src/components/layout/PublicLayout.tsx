import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Store, ShieldAlert, LayoutDashboard, AlertOctagon, Mail, Phone, MapPin, Globe } from 'lucide-react';
import { Button } from '../ui/Button';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { api } from '@/src/services/api';
import { ShopSettings } from '@/src/types';

export function PublicLayout() {
  const location = useLocation();
  const isAuthPage = location.pathname.startsWith('/auth');
  const { t } = useLanguage();
  const { user, isAdmin } = useAuth();
  const [settings, setSettings] = useState<ShopSettings | null>(null);

  useEffect(() => {
    let mounted = true;
    api.settings.getPublic().then((res) => {
      if (mounted && res) {
        setSettings(res);

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

  const shopName = settings?.shopName || 'Portio';
  const logoUrl = settings?.logo;
  const isMaintenance = settings?.maintenanceMode && !isAdmin;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-50">
      
      {/* Maintenance Mode Banner */}
      {settings?.maintenanceMode && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 z-50 sticky top-0 shadow-sm">
          <AlertOctagon className="w-4 h-4 text-amber-900" />
          <span>Hệ thống Shop đang bật chế độ bảo trì (Maintenance Mode). {isAdmin ? '(Bạn đang xem dưới quyền Admin)' : ''}</span>
        </div>
      )}

      {/* Header */}
      <header className={`absolute ${settings?.maintenanceMode ? 'top-8' : 'top-0'} w-full z-40 transition-all duration-300 py-4 bg-white/70 backdrop-blur-md border-b border-slate-100`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            {logoUrl ? (
              <img src={logoUrl} alt={shopName} className="w-8 h-8 rounded-xl object-contain group-hover:scale-105 transition-transform" />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white font-black group-hover:scale-105 transition-transform">
                {shopName.charAt(0)}
              </div>
            )}
            <span className="font-extrabold text-2xl tracking-tight text-slate-900">
              {shopName}
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/templates" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
              {t('nav.templates')}
            </Link>
          </nav>
          
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {user ? (
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Link to="/admin">
                    <Button size="sm" className="gap-1.5 bg-slate-900 text-white hover:bg-slate-800 font-bold px-4">
                      <ShieldAlert className="w-4 h-4 text-brand-400" />
                      Admin Panel
                    </Button>
                  </Link>
                )}
                <Link to="/dashboard">
                  <Button variant={isAdmin ? "outline" : "primary"} size="sm" className="gap-1.5 px-4">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <Link to="/auth/login">
                  <Button variant="ghost" size="sm" className="hidden sm:inline-flex px-6">
                    {t('nav.login')}
                  </Button>
                </Link>
                <Link to="/auth/register">
                  <Button size="sm" className="hidden sm:inline-flex px-6">
                    {t('nav.getStarted')}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full relative z-10">
        <Outlet />
      </main>

      {/* Footer */}
      {!isAuthPage && (
        <footer className="bg-white border-t border-slate-100 pt-20 pb-10 mt-auto relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-16">
              <div className="col-span-2 lg:col-span-2 space-y-4">
                <Link to="/" className="flex items-center gap-2">
                  {logoUrl ? (
                    <img src={logoUrl} alt={shopName} className="w-8 h-8 rounded-xl object-contain" />
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white font-black">
                      {shopName.charAt(0)}
                    </div>
                  )}
                  <span className="font-extrabold text-xl tracking-tight text-slate-900">
                    {shopName}
                  </span>
                </Link>
                <p className="text-slate-500 font-medium max-w-xs text-sm leading-relaxed">
                  {settings?.footer?.aboutText || t('footer.desc')}
                </p>

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
                  <li><Link to="/auth/login" className="hover:text-brand-600 transition-colors">{t('nav.login')}</Link></li>
                  <li><Link to="/admin" className="hover:text-brand-600 font-semibold text-slate-700 transition-colors">Admin Portal</Link></li>
                  <li><Link to="/admin/settings" className="hover:text-brand-600 font-semibold text-slate-700 transition-colors">Cài Đặt Cửa Hàng</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-4">Kết Nối & Pháp Lý</h4>
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
                  <li><a href="#" className="hover:text-brand-600 transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-brand-600 transition-colors">Terms of Service</a></li>
                </ul>
              </div>
            </div>
            
            <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-slate-400 text-sm font-medium">
                {settings?.footer?.copyrightText || `© ${new Date().getFullYear()} ${shopName}. All rights reserved.`}
              </p>
              <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                <span>Edge DNS Ready</span>
                <span>•</span>
                <span>SEO Optimized</span>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
