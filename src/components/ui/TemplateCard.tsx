import { Link } from 'react-router-dom';
import { Template } from '@/src/types';
import { Button } from './Button';
import { Eye, Edit3, ShoppingCart, Info } from 'lucide-react';
import { useLanguage } from '@/src/contexts/LanguageContext';

interface TemplateCardProps {
  template: Template;
}

export function TemplateCard({ template }: TemplateCardProps) {
  const { t } = useLanguage();

  // Resolves the Demo URL: directly opens live deployment or template preview
  // Resolves the Demo URL (view customer site or live app)
  const resolveDemoUrl = () => {
    const rawDemo = (template.demoUrl || '').trim();
    if (rawDemo.startsWith('http://') || rawDemo.startsWith('https://')) {
      return rawDemo;
    }
    const rawOrigin = (template.originUrl || '').trim();
    if (rawOrigin.startsWith('http://') || rawOrigin.startsWith('https://')) {
      return rawOrigin;
    }
    const cleanSlug = template.slug.replace(/^port-/, '') || template.slug;
    return `/p/${cleanSlug}`;
  };

  // Resolves the Edit URL: opens the template project's direct Admin Portal
  const resolveEditUrl = () => {
    // 1. If explicit adminUrl is configured on the template, use it immediately
    const explicitAdmin = (template.adminUrl || '').trim();
    if (explicitAdmin) {
      return explicitAdmin;
    }

    const rawDemo = (template.demoUrl || '').trim();
    const rawOrigin = (template.originUrl || '').trim();
    const targetUrl = rawDemo || rawOrigin;

    // Helper to format any URL or subdomain into its corresponding admin page
    const toAdminUrl = (url: string) => {
      try {
        const parsed = new URL(url);
        // If it already points to an admin file/page
        if (parsed.pathname.includes('admin')) {
          return parsed.toString();
        }

        // If domain is on webcuaban.site or subdomains, default to /admin.html
        if (parsed.hostname.includes('webcuaban.site') || parsed.pathname.endsWith('.html')) {
          parsed.pathname = '/admin.html';
          return parsed.toString();
        }

        // Standard SPA routing on Cloud Run / custom domain: /admin.html or /admin
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

    if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
      return toAdminUrl(targetUrl);
    }

    // If template has a slug or custom domain like videograph, build direct subdomain admin url
    if (template.slug) {
      const cleanSlug = template.slug.replace(/^port-/, '').trim();
      if (cleanSlug) {
        return `https://${cleanSlug}.webcuaban.site/admin.html`;
      }
    }

    return `/admin/templates`;
  };

  const demoUrl = resolveDemoUrl();
  const editUrl = resolveEditUrl();
  const isDemoExternal = demoUrl.startsWith('http://') || demoUrl.startsWith('https://');
  const isEditExternal = editUrl.startsWith('http://') || editUrl.startsWith('https://');

  return (
    <div className="group relative flex flex-col h-full">
      {/* Badges */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
        {template.salePrice && (
          <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
            {t('public.templateCard.sale')}
          </span>
        )}
        {template.isNew && (
          <span className="bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
            {t('public.templateCard.new')}
          </span>
        )}
      </div>

      <div className={`p-6 rounded-[32px] sm:rounded-[40px] ${template.bgColorClass} flex flex-col h-full transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-soft-lg`}>
        
        {/* Image Placeholder or Thumbnail area with Hover Actions */}
        <div className="aspect-[4/3] bg-white/60 backdrop-blur-sm rounded-[24px] sm:rounded-[28px] border border-white/50 mb-6 flex flex-col overflow-hidden shadow-sm relative group-hover:border-white/80 transition-colors">
          {template.thumbnail ? (
            <img 
              src={template.thumbnail} 
              alt={template.name} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            />
          ) : (
            <>
              <div className="h-4 sm:h-5 bg-white/80 border-b border-white/50 flex items-center px-3 gap-1">
                 <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-slate-200"></div>
                 <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-slate-200"></div>
                 <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-slate-200"></div>
              </div>
              <div className="flex-1 p-3">
                 <div className="w-1/2 h-3 bg-white/80 rounded-full mb-2"></div>
                 <div className="w-1/3 h-2 bg-white/60 rounded-full"></div>
              </div>
            </>
          )}

          {/* Hover Overlay Actions: XEM & EDIT */}
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 gap-3 z-20">
             <div className="flex items-center gap-2.5 w-full max-w-[210px]">
               {/* Nút XEM */}
               {isDemoExternal ? (
                 <a 
                   href={demoUrl} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   onClick={(e) => e.stopPropagation()}
                   className="flex-1 inline-flex items-center justify-center gap-1.5 font-bold rounded-full bg-white text-indigo-600 border-2 border-indigo-600 hover:bg-indigo-50 shadow-none px-3 py-2 text-xs transition-colors cursor-pointer"
                   title="Xem website ứng dụng AI Studio trực tiếp"
                 >
                   <Eye className="w-4 h-4 text-indigo-600" /> XEM
                 </a>
               ) : (
                 <Link 
                   to={demoUrl}
                   onClick={(e) => e.stopPropagation()}
                   className="flex-1 inline-flex items-center justify-center gap-1.5 font-bold rounded-full bg-white text-indigo-600 border-2 border-indigo-600 hover:bg-indigo-50 shadow-none px-3 py-2 text-xs transition-colors cursor-pointer"
                   title="Xem demo giao diện"
                 >
                   <Eye className="w-4 h-4 text-indigo-600" /> XEM
                 </Link>
               )}

               {/* Nút EDIT */}
               {isEditExternal ? (
                 <a 
                   href={editUrl} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   onClick={(e) => e.stopPropagation()}
                   className="flex-1 inline-flex items-center justify-center gap-1.5 font-bold rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-none border-2 border-indigo-600 px-3 py-2 text-xs transition-colors cursor-pointer"
                   title="Mở ứng dụng AI Studio gốc để chỉnh sửa"
                 >
                   <Edit3 className="w-4 h-4 text-white" /> EDIT
                 </a>
               ) : (
                 <Link 
                   to={editUrl}
                   onClick={(e) => e.stopPropagation()}
                   className="flex-1 inline-flex items-center justify-center gap-1.5 font-bold rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-none border-2 border-indigo-600 px-3 py-2 text-xs transition-colors cursor-pointer"
                   title="Mở trình chỉnh sửa portfolio"
                 >
                   <Edit3 className="w-4 h-4 text-white" /> EDIT
                 </Link>
               )}
             </div>

             <Link to={`/templates/${template.slug}`}>
               <span className="text-[11px] font-bold text-slate-200 hover:text-white flex items-center gap-1 underline transition-colors">
                 <Info className="w-3.5 h-3.5" /> Chi tiết Template
               </span>
             </Link>
          </div>
        </div>

        {/* Content */}
        <div className="px-2 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-xl font-bold text-slate-900 line-clamp-1">{template.name}</h3>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-1">{template.categoryName}</p>
            </div>
          </div>
          
          <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed font-medium">
            {template.description}
          </p>

          <div className="flex flex-wrap gap-2 mb-6">
            {(template.tags || []).slice(0, 3).map(tag => (
              <span key={tag} className="text-xs font-bold text-slate-500 bg-white/60 px-2.5 py-1 rounded-md">
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-auto pt-4 border-t border-slate-900/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-2xl text-slate-900">
                ${template.salePrice || template.price}
              </span>
              {template.salePrice && (
                <span className="font-bold text-sm text-slate-400 line-through">
                  ${template.price}
                </span>
              )}
            </div>
            <Link to={`/templates/${template.slug}`}>
               <Button size="sm" className="rounded-full shadow-soft-md shadow-brand-500/20 px-6 gap-2 font-bold">
                 <ShoppingCart className="w-4 h-4" /> {t('public.templateCard.buy')}
               </Button>
            </Link>
          </div>
        </div>
        
      </div>
    </div>
  );
}
