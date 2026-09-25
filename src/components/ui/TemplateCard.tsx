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

  // Build edit URL: if originUrl is configured, pass ?mode=edit, otherwise open internal editor
  const editUrl = template.originUrl 
    ? `${template.originUrl}${template.originUrl.includes('?') ? '&' : '?'}mode=edit&templateId=${template.id}`
    : `/dashboard/portfolios/new?templateId=${template.id}&mode=edit`;

  const demoUrl = template.demoUrl || template.originUrl || `/templates/${template.slug}`;

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
               <a 
                 href={demoUrl} 
                 target={demoUrl.startsWith('http') ? "_blank" : "_self"} 
                 rel="noreferrer" 
                 className="flex-1"
               >
                 <Button 
                   variant="outline" 
                   size="sm"
                   className="w-full gap-1.5 font-bold rounded-full bg-white text-indigo-600 border-2 border-indigo-600 hover:bg-indigo-50 shadow-none [&_svg]:text-indigo-600 px-3 py-2 text-xs"
                 >
                   <Eye className="w-4 h-4 text-indigo-600" /> XEM
                 </Button>
               </a>

               {/* Nút EDIT */}
               {editUrl.startsWith('http') ? (
                 <a 
                   href={editUrl} 
                   target="_blank" 
                   rel="noreferrer" 
                   className="flex-1"
                 >
                   <Button 
                     size="sm"
                     className="w-full gap-1.5 font-bold rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-none border-2 border-indigo-600 [&_svg]:text-white px-3 py-2 text-xs"
                   >
                     <Edit3 className="w-4 h-4 text-white" /> EDIT
                   </Button>
                 </a>
               ) : (
                 <Link to={editUrl} className="flex-1">
                   <Button 
                     size="sm"
                     className="w-full gap-1.5 font-bold rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-none border-2 border-indigo-600 [&_svg]:text-white px-3 py-2 text-xs"
                   >
                     <Edit3 className="w-4 h-4 text-white" /> EDIT
                   </Button>
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
