import { Link } from 'react-router-dom';
import { Template } from '@/src/types';
import { Button } from './Button';
import { Eye, Edit3, ShoppingCart } from 'lucide-react';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { api } from '@/src/services/api';

interface TemplateCardProps {
  template: Template;
}

export function TemplateCard({ template }: TemplateCardProps) {
  const { t } = useLanguage();
  const { user } = useAuth();

  const guestId = (() => {
    if (typeof window !== 'undefined') {
      let g = localStorage.getItem('guest_trial_id');
      if (!g) {
        g = `guest_${Math.random().toString(36).substring(2, 8)}`;
        localStorage.setItem('guest_trial_id', g);
      }
      return g;
    }
    return 'guest';
  })();

  const effectiveUserId = user?.id || guestId;
  const cleanUsername = user 
    ? (user.user_metadata?.username || (user as any).username || user.email?.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'user'
    : (guestId || 'guest');
  const cleanSlug = (template.slug || 'template').replace(/^port-/, '').trim();
  const tplId = template.id || cleanSlug;
  const draftInstanceId = `draft-${effectiveUserId}-${tplId}`;

  const shopApi = typeof window !== 'undefined' ? window.location.origin : '';
  const rawDemo = (template.demoUrl || '').trim();
  const rawOrigin = (template.originUrl || '').trim();
  const rawPreviewBase = (rawOrigin || rawDemo || 'https://videograph.webcuaban.site').replace(/\/$/, '');
  const previewBase = rawPreviewBase.endsWith('.html') ? rawPreviewBase : `${rawPreviewBase}/index.html`;
  
  // Standard params for Child Templates:
  const userRole = user ? 'trial' : 'guest';
  const commonParams = `templateId=${encodeURIComponent(tplId)}&slug=${encodeURIComponent(template.slug || '')}&role=${userRole}&user=${encodeURIComponent(user ? effectiveUserId : 'guest')}&licensed=false&trial=true&mode=preview&shopApi=${encodeURIComponent(shopApi)}&instance=${encodeURIComponent(draftInstanceId)}&tenant=${encodeURIComponent(cleanUsername)}`;
  
  const previewTarget = `${previewBase}?${commonParams}`;

  // Resolves the Demo URL: directly opens live deployment with user draft data attached
  const resolveDemoUrl = () => {
    if (rawPreviewBase.startsWith('http://') || rawPreviewBase.startsWith('https://')) {
      return previewTarget;
    }
    return `/p/${cleanSlug}`;
  };

  // Resolves the Edit URL: opens the template project's direct Admin Portal with user isolation
  const resolveEditUrl = () => {
    // 1. If explicit adminUrl is configured on the template, use it immediately
    const explicitAdmin = (template.adminUrl || '').trim();
    const targetUrl = rawDemo || rawOrigin;

    // Helper to format any URL or subdomain into its corresponding admin page
    const toAdminUrl = (url: string) => {
      try {
        const parsed = new URL(url);
        if (parsed.pathname.includes('admin')) {
          return parsed.toString();
        }
        if (parsed.hostname.includes('webcuaban.site') || parsed.pathname.endsWith('.html')) {
          parsed.pathname = '/admin.html';
          return parsed.toString();
        }
        if (parsed.pathname === '/' || parsed.pathname === '') {
          parsed.pathname = '/admin.html';
        } else {
          parsed.pathname = `${parsed.pathname.replace(/\/$/, '')}/admin.html`;
        }
        return parsed.toString();
      } catch {
        const clean = url.replace(/\/$/, '');
        return clean.includes('admin') ? clean : `${clean}/admin.html`;
      }
    };

    const baseWithParams = (adminUrl: string) => {
      const sep = adminUrl.includes('?') ? '&' : '?';
      return `${adminUrl}${sep}templateId=${encodeURIComponent(tplId)}&slug=${encodeURIComponent(template.slug || '')}&role=${userRole}&user=${encodeURIComponent(user ? effectiveUserId : 'guest')}&licensed=false&trial=true&hideBanner=false&mode=draft&licenseKey=trial&domain=${encodeURIComponent(previewTarget)}&instance=${encodeURIComponent(draftInstanceId)}&tenant=${encodeURIComponent(cleanUsername)}&shopApi=${encodeURIComponent(shopApi)}`;
    };

    if (explicitAdmin) {
      return baseWithParams(explicitAdmin);
    }

    if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
      return baseWithParams(toAdminUrl(targetUrl));
    }

    // If template has a slug or custom domain like videograph, build direct subdomain admin url
    if (template.slug) {
      if (cleanSlug) {
        return baseWithParams(`https://${cleanSlug}.webcuaban.site/admin.html`);
      }
    }

    return `/admin/templates`;
  };

  const handleEditClick = async () => {
    // Không tự động tạo record draft rác lên hệ thống.
    // Dữ liệu dùng thử được lưu vào localStorage theo đúng TH1 hoặc TH2!
  };

  const demoUrl = resolveDemoUrl();
  const editUrl = resolveEditUrl();
  const isDemoExternal = demoUrl.startsWith('http://') || demoUrl.startsWith('https://');
  const isEditExternal = editUrl.startsWith('http://') || editUrl.startsWith('https://');

  return (
    <div className="group relative flex flex-col h-full bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:shadow-slate-900/6 hover:border-slate-300/80 transition-all duration-300 hover:-translate-y-1.5 overflow-hidden">
      {/* Badges */}
      <div className="absolute top-3.5 left-3.5 z-10 flex flex-col gap-1.5 pointer-events-none">
        {template.salePrice && (
          <span className="bg-rose-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs uppercase tracking-wide">
            {t('public.templateCard.sale')}
          </span>
        )}
        {template.isNew && (
          <span className="bg-brand-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs uppercase tracking-wide">
            {t('public.templateCard.new')}
          </span>
        )}
      </div>

      <div className="p-4 sm:p-5 flex flex-col h-full">
        {/* Thumbnail Area with Hover Actions */}
        <div className="aspect-[16/10] bg-slate-100 rounded-xl sm:rounded-2xl border border-slate-200/60 mb-4 flex flex-col overflow-hidden shadow-2xs relative group-hover:border-slate-300 transition-colors">
          {template.thumbnail ? (
            <img 
              src={template.thumbnail} 
              alt={template.name} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            />
          ) : (
            <>
              <div className="h-5 bg-white/90 border-b border-slate-200/60 flex items-center px-3 gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                 <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                 <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
              </div>
              <div className="flex-1 p-4 bg-slate-50/50 flex flex-col justify-center items-center">
                 <div className="w-2/3 h-3 bg-slate-200/80 rounded-full mb-2"></div>
                 <div className="w-1/2 h-2.5 bg-slate-200/60 rounded-full"></div>
              </div>
            </>
          )}

          {/* Hover Overlay Actions: XEM & EDIT */}
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center p-4 gap-2.5 z-20">
             <div className="flex items-center gap-2 w-full max-w-[210px]">
               {/* Nút XEM */}
               {isDemoExternal ? (
                 <a 
                   href={demoUrl} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   onClick={(e) => e.stopPropagation()}
                   className="flex-1 inline-flex items-center justify-center gap-1.5 font-bold rounded-full bg-white text-slate-900 hover:bg-slate-100 shadow-md px-3 py-2 text-xs transition-colors cursor-pointer"
                   title="Xem website ứng dụng AI Studio trực tiếp"
                 >
                   <Eye className="w-3.5 h-3.5 text-brand-600" /> XEM
                 </a>
               ) : (
                 <Link 
                   to={demoUrl}
                   onClick={(e) => e.stopPropagation()}
                   className="flex-1 inline-flex items-center justify-center gap-1.5 font-bold rounded-full bg-white text-slate-900 hover:bg-slate-100 shadow-md px-3 py-2 text-xs transition-colors cursor-pointer"
                   title="Xem demo giao diện"
                 >
                   <Eye className="w-3.5 h-3.5 text-brand-600" /> XEM
                 </Link>
               )}

               {/* Nút EDIT */}
               {isEditExternal ? (
                 <a 
                   href={editUrl} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   onClick={(e) => {
                    e.stopPropagation();
                    handleEditClick();
                  }}
                   className="flex-1 inline-flex items-center justify-center gap-1.5 font-bold rounded-full bg-brand-600 hover:bg-brand-700 text-white shadow-md px-3 py-2 text-xs transition-colors cursor-pointer"
                   title="Mở ứng dụng AI Studio gốc để chỉnh sửa"
                 >
                   <Edit3 className="w-3.5 h-3.5 text-white" /> EDIT
                 </a>
               ) : (
                 <Link 
                   to={editUrl}
                   onClick={(e) => {
                    e.stopPropagation();
                    handleEditClick();
                  }}
                   className="flex-1 inline-flex items-center justify-center gap-1.5 font-bold rounded-full bg-brand-600 hover:bg-brand-700 text-white shadow-md px-3 py-2 text-xs transition-colors cursor-pointer"
                   title="Mở trình chỉnh sửa portfolio"
                 >
                   <Edit3 className="w-3.5 h-3.5 text-white" /> EDIT
                 </Link>
               )}
             </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          <div className="mb-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
              {template.name}
            </h3>
          </div>
          
          <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed font-normal">
            {template.description}
          </p>

          <div className="mt-auto pt-3.5 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-extrabold text-xl text-slate-900">
                ${template.salePrice || template.price}
              </span>
              {template.salePrice && (
                <span className="font-medium text-xs text-slate-400 line-through">
                  ${template.price}
                </span>
              )}
            </div>
            <Link to={`/templates/${template.slug}`}>
               <Button size="sm" className="rounded-full shadow-xs hover:shadow-md px-4 py-1.5 text-xs gap-1.5 font-bold transition-all">
                 <ShoppingCart className="w-3.5 h-3.5" /> {t('public.templateCard.buy')}
               </Button>
            </Link>
          </div>
        </div>
        
      </div>
    </div>
  );
}
