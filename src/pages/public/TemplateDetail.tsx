import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Template } from '@/src/types';
import { api } from '@/src/services/api';
import { Button } from '@/src/components/ui/Button';
import { Loading } from '@/src/components/ui/Loading';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { ArrowLeft, CheckCircle2, ExternalLink, MonitorSmartphone, ShoppingCart, LayoutTemplate, Zap, Edit3, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { toast } from 'sonner';

export default function TemplateDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [template, setTemplate] = useState<Template | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (slug) {
      api.templates.getBySlug(slug).then(data => {
        setTemplate(data);
        if (data) {
          setActiveImage(data.thumbnail || (data.gallery && data.gallery[0]) || '');
        }
        setLoading(false);
      });
    }
  }, [slug]);

  const handleCheckout = async () => {
    if (!template) return;
    navigate(`/checkout?slug=${template.slug}&templateId=${template.id}&amount=${template.salePrice || template.price}`);
  };

  if (loading) return <div className="pt-32 pb-20"><Loading /></div>;
  if (!template) return <div className="pt-32 pb-20 max-w-lg mx-auto"><ErrorState title="Template not found" message="The template you are looking for does not exist." /></div>;

  const isVND = template.currency === 'VND' || (!template.currency && template.price >= 1000);
  const formatPrice = (amount: number) => {
    if (isVND) {
      return `${amount.toLocaleString('de-DE')} ₫`;
    }
    return `$${amount}`;
  };

  const galleryList = [
    template.thumbnail,
    ...(template.gallery || []).filter(g => g !== template.thumbnail)
  ].filter(Boolean);

  return (
    <div className="w-full pt-36 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Back button */}
      <Link to="/templates" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> {t('public.templateDetail.back')}
      </Link>

      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
        
        {/* Left Column: Visuals */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`w-full aspect-[4/3] rounded-[32px] sm:rounded-[40px] ${template.bgColorClass || 'bg-slate-100'} p-3 sm:p-6 flex items-center justify-center shadow-lg border border-slate-200/60`}
          >
             <div className="w-full h-full bg-white rounded-[20px] sm:rounded-[24px] border-2 border-slate-200/80 shadow-soft overflow-hidden relative flex flex-col group">
                {/* Mockup Topbar */}
                <div className="h-7 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between px-3.5 shrink-0">
                   <div className="flex items-center gap-1.5">
                     <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
                     <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                     <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                   </div>
                   <div className="text-[11px] font-bold text-slate-400 max-w-[200px] truncate">
                     {template.demoUrl || template.slug}
                   </div>
                   <div className="w-8"></div>
                </div>

                {/* Mockup Content area with Real Image Preview */}
                <div className="flex-1 w-full relative overflow-hidden bg-slate-50 flex items-center justify-center">
                  {activeImage && (activeImage.startsWith('http') || activeImage.startsWith('data:image')) ? (
                    <img 
                      src={activeImage} 
                      alt={template.name}
                      className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : activeImage && activeImage.startsWith('bg-') ? (
                    <div className={`w-full h-full ${activeImage} flex items-center justify-center p-6 text-center text-white font-extrabold text-xl shadow-inner`}>
                      {template.name}
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 font-bold text-base p-6 text-center gap-2">
                      <LayoutTemplate className="w-12 h-12 text-slate-300" />
                      <span>{template.name}</span>
                    </div>
                  )}
                </div>
             </div>
          </motion.div>

          {/* Gallery Thumbnails */}
          {galleryList.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-3">
              {galleryList.map((item, i) => {
                const isSelected = activeImage === item;
                const isImg = item.startsWith('http') || item.startsWith('data:image');
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImage(item)}
                    className={`aspect-video rounded-xl sm:rounded-2xl overflow-hidden border-2 transition-all p-0.5 ${
                      isSelected 
                        ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md scale-102' 
                        : 'border-slate-200 hover:border-slate-400 opacity-75 hover:opacity-100'
                    }`}
                  >
                    {isImg ? (
                      <img src={item} alt={`Preview ${i+1}`} className="w-full h-full object-cover object-top rounded-lg" />
                    ) : (
                      <div className={`w-full h-full ${item} rounded-lg flex items-center justify-center text-[10px] text-white font-bold`}>
                        Mẫu {i+1}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Details */}
        <div className="space-y-8">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <span className="text-xs sm:text-sm font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-3.5 py-1 rounded-full uppercase tracking-wider">
                {template.categoryName || 'Portfolio'}
              </span>
              {template.badge === 'banchay' && <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">🔥 Bán chạy</span>}
              {template.badge === 'new' && <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full">✨ Mới ra mắt</span>}
              {template.badge === 'hot' && <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">⚡ HOT</span>}
              {template.badge === 'tietkiem' && <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">🏷️ Tiết Kiệm</span>}
              {template.badge === 'docquyen' && <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">👑 Độc Quyền</span>}
              {template.badge === 'vip' && <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">💎 VIP Pro</span>}
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight mb-4">{template.name}</h1>
            <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
              {template.description}
            </p>
          </motion.div>

          <div className="flex flex-wrap items-center gap-4 py-5 border-y-2 border-slate-100">
             <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-slate-900">
                  {formatPrice(template.salePrice || template.price)}
                </span>
                {template.salePrice && template.salePrice < template.price && (
                  <span className="text-lg sm:text-xl font-bold text-slate-400 line-through">
                    {formatPrice(template.price)}
                  </span>
                )}
             </div>
             <p className="text-xs sm:text-sm font-bold text-slate-400 sm:ml-auto bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60">
               Thanh toán 1 lần • Sở hữu vĩnh viễn
             </p>
          </div>

          {/* Action buttons */}
          {(() => {
            const editUrl = template.originUrl 
              ? `${template.originUrl}${template.originUrl.includes('?') ? '&' : '?'}mode=edit&templateId=${template.id}`
              : `/dashboard/portfolios/new?templateId=${template.id}&mode=edit`;
            const demoUrl = template.demoUrl || template.originUrl || '#';

            return (
              <div className="space-y-3">
                <Button 
                  size="lg" 
                  className="w-full gap-2 text-base sm:text-lg h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/20 transition-transform active:scale-[0.99]"
                  onClick={handleCheckout}
                  disabled={checkingOut}
                >
                  <ShoppingCart className="w-5 h-5" /> {checkingOut ? 'Đang xử lý...' : 'Mua Portfolio Ngay'}
                </Button>

                <div className="grid sm:grid-cols-2 gap-3">
                  {editUrl.startsWith('http') ? (
                    <a href={editUrl} target="_blank" rel="noreferrer" className="w-full">
                      <Button variant="outline" size="lg" className="w-full gap-2 text-sm sm:text-base h-12 border-2 border-indigo-600 bg-white hover:bg-indigo-50 text-indigo-600 font-bold rounded-xl shadow-none">
                        <Edit3 className="w-4 h-4 text-indigo-600" /> Chỉnh Sửa Thử (EDIT)
                      </Button>
                    </a>
                  ) : (
                    <Link to={editUrl} className="w-full">
                      <Button variant="outline" size="lg" className="w-full gap-2 text-sm sm:text-base h-12 border-2 border-indigo-600 bg-white hover:bg-indigo-50 text-indigo-600 font-bold rounded-xl shadow-none">
                        <Edit3 className="w-4 h-4 text-indigo-600" /> Chỉnh Sửa Thử (EDIT)
                      </Button>
                    </Link>
                  )}

                  <a href={demoUrl} target={demoUrl.startsWith('http') ? "_blank" : "_self"} rel="noreferrer" className="w-full">
                    <Button variant="outline" size="lg" className="w-full gap-2 text-sm sm:text-base h-12 border-2 border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl shadow-none">
                      <Eye className="w-4 h-4" /> Xem Demo Trực Tiếp
                    </Button>
                  </a>
                </div>
              </div>
            );
          })()}

          {/* Features & Editable Schema Fields */}
          <div className="grid sm:grid-cols-2 gap-6 pt-4">
            {/* Features (Tags) */}
            <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border-2 border-slate-100">
              <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> Tính năng chính
              </h3>
              <ul className="space-y-2.5">
                {(template.tags && template.tags.length > 0 ? template.tags : ['Responsive', 'Fast Load', 'SEO Ready']).map((tag, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{tag}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Editable Schema Fields */}
            <div className="space-y-3 bg-indigo-50/40 p-4 rounded-2xl border-2 border-indigo-100/70">
              <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4 text-indigo-600" /> Phần có thể chỉnh sửa ({template.editableFields?.length || 0})
              </h3>
              <ul className="space-y-2.5">
                {(template.editableFields && template.editableFields.length > 0 ? template.editableFields : [
                  { id: '1', label: 'Tiêu đề & Chức danh' },
                  { id: '2', label: 'Mô tả giới thiệu' },
                  { id: '3', label: 'Màu nhấn thương hiệu' }
                ]).map((field, idx) => (
                  <li key={field.id || idx} className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 font-bold">
                    <MonitorSmartphone className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span className="truncate">{field.label || (field as any).name || (field as any).key}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
