import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Template } from '@/src/types';
import { api } from '@/src/services/api';
import { Button } from '@/src/components/ui/Button';
import { Loading } from '@/src/components/ui/Loading';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { 
  ArrowLeft, 
  CheckCircle2, 
  ExternalLink, 
  MonitorSmartphone, 
  ShoppingCart, 
  LayoutTemplate, 
  Zap, 
  Edit3, 
  Eye,
  ShieldCheck,
  Globe,
  Copy,
  Terminal,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { toast } from 'sonner';
import { formatSubdomainDisplay } from '@/src/utils/domain';

export default function TemplateDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [template, setTemplate] = useState<Template | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [ownedInstance, setOwnedInstance] = useState<any>(null);
  const [copied, setCopied] = useState(false);
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

  // Check if current user already owns this template
  useEffect(() => {
    if (!template) return;
    const checkOwnership = async () => {
      try {
        const portfolios = await api.portfolios.getAll();
        const found = portfolios.find((p: any) => 
          p.template_id === template.id || 
          p.template_slug === template.slug ||
          p.template_id === template.slug ||
          (template.slug && p.template_id?.includes(template.slug.replace(/^port-/, ''))) ||
          (template.name && p.template_name?.toLowerCase() === template.name.toLowerCase()) ||
          (template.slug && p.template_slug?.includes(template.slug))
        );
        if (found) {
          setOwnedInstance(found);
        }
      } catch (e) {
        console.error('Failed to check template ownership', e);
      }
    };
    checkOwnership();
  }, [template, user]);

  const handleCheckout = async () => {
    if (!template) return;
    if (ownedInstance) {
      toast.info('Bạn đã sở hữu template này rồi!');
      return;
    }
    navigate(`/checkout?slug=${template.slug}&templateId=${template.id}&amount=${template.salePrice || template.price}`);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Đã sao chép liên kết website!');
    setTimeout(() => setCopied(false), 2000);
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

  const isOwned = Boolean(ownedInstance);
  const ownedSubdomain = ownedInstance?.subdomain || (user?.email ? user.email.split('@')[0] : 'my-site');
  const cleanSubdomain = ownedSubdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');

  // Base deployment target (originUrl or demoUrl)
  const rawDemo = (template?.demoUrl || '').trim();
  const rawOrigin = (template?.originUrl || '').trim();
  const baseTarget = rawDemo || rawOrigin;

  const buildLicensedUrl = (type: 'site' | 'admin') => {
    if (baseTarget && (baseTarget.startsWith('http://') || baseTarget.startsWith('https://'))) {
      try {
        const urlObj = new URL(baseTarget);
        if (type === 'admin') {
          if (!urlObj.pathname.includes('admin')) {
            urlObj.pathname = urlObj.pathname.endsWith('/')
              ? `${urlObj.pathname}admin.html`
              : `${urlObj.pathname}/admin.html`.replace(/\/\//g, '/');
          }
        }
        urlObj.searchParams.set('licensed', 'true');
        urlObj.searchParams.set('trial', 'false');
        urlObj.searchParams.set('hideBanner', 'true');
        urlObj.searchParams.set('mode', 'published');
        urlObj.searchParams.set('domain', `${cleanSubdomain}.webcuaban.site`);
        urlObj.searchParams.set('subdomain', cleanSubdomain);
        urlObj.searchParams.set('tenant', cleanSubdomain);
        urlObj.searchParams.set('instanceId', ownedInstance?.id || `inst-${cleanSubdomain}`);
        return urlObj.toString();
      } catch (e) {
        // Fallback below
      }
    }
    return type === 'admin' 
      ? `https://${cleanSubdomain}.webcuaban.site/admin.html?licensed=true&hideBanner=true&tenant=${cleanSubdomain}`
      : `https://${cleanSubdomain}.webcuaban.site/?licensed=true&hideBanner=true&tenant=${cleanSubdomain}`;
  };

  const officialSiteUrl = buildLicensedUrl('site');
  const officialAdminUrl = buildLicensedUrl('admin');
  const displaySiteUrl = `https://${cleanSubdomain}.webcuaban.site`;

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
                     {isOwned ? formatSubdomainDisplay(ownedSubdomain) : (template.demoUrl || template.slug)}
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

              {/* Ownership Badge */}
              {isOwned && (
                <span className="text-xs sm:text-sm font-black text-emerald-700 bg-emerald-50 border border-emerald-300 px-3.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>ĐÃ SỞ HỮU BẢN QUYỀN</span>
                </span>
              )}

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
               {isOwned ? '✓ Đã kích hoạt bản quyền trọn đời' : 'Thanh toán 1 lần • Sở hữu vĩnh viễn'}
             </p>
          </div>

          {/* Action buttons */}
          {(() => {
            const rawOrigin = (template.originUrl || '').trim();
            const rawDemo = (template.demoUrl || '').trim();
            let demoUrl = '';
            if (rawDemo.startsWith('http://') || rawDemo.startsWith('https://')) {
              demoUrl = rawDemo;
            } else if (rawOrigin.startsWith('http://') || rawOrigin.startsWith('https://')) {
              demoUrl = rawOrigin;
            } else {
              const cleanSlug = template.slug.replace(/^port-/, '') || template.slug;
              demoUrl = `/p/${cleanSlug}`;
            }

            let editUrl = '';
            const explicitAdmin = (template.adminUrl || '').trim();
            if (explicitAdmin) {
              editUrl = explicitAdmin;
            } else {
              const targetUrl = rawDemo || rawOrigin;
              if (targetUrl && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://'))) {
                try {
                  const parsed = new URL(targetUrl);
                  if (parsed.pathname.includes('admin')) {
                    editUrl = parsed.toString();
                  } else if (parsed.hostname.includes('webcuaban.site') || parsed.pathname.endsWith('.html')) {
                    parsed.pathname = '/admin.html';
                    editUrl = parsed.toString();
                  } else if (parsed.pathname === '/' || parsed.pathname === '') {
                    parsed.pathname = '/admin.html';
                    editUrl = parsed.toString();
                  } else {
                    parsed.pathname = `${parsed.pathname.replace(/\/$/, '')}/admin.html`;
                    editUrl = parsed.toString();
                  }
                } catch {
                  const clean = targetUrl.replace(/\/$/, '');
                  editUrl = clean.includes('admin') ? clean : `${clean}/admin.html`;
                }
              } else if (template.slug) {
                const cleanSlug = template.slug.replace(/^port-/, '').trim();
                editUrl = `https://${cleanSlug}.webcuaban.site/admin.html`;
              } else {
                editUrl = `/admin/templates`;
              }
            }

            const isDemoExternal = demoUrl.startsWith('http://') || demoUrl.startsWith('https://');
            const isEditExternal = editUrl.startsWith('http://') || editUrl.startsWith('https://');

            return (
              <div className="space-y-3">
                {/* Primary Button */}
                {isOwned ? (
                  <button 
                    disabled
                    className="w-full gap-2 text-[15px] h-14 bg-slate-100 border-2 border-slate-300/80 text-slate-400 font-extrabold rounded-2xl flex items-center justify-center cursor-not-allowed select-none shadow-none transition-none"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span>Bạn Đã Sở Hữu Template Này (Đã Mua)</span>
                  </button>
                ) : (
                  <Button 
                    size="lg" 
                    className="w-full gap-2 text-[16px] h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/20 transition-transform active:scale-[0.99] cursor-pointer"
                    onClick={handleCheckout}
                    disabled={checkingOut}
                  >
                    <ShoppingCart className="w-5 h-5" /> {checkingOut ? 'Đang xử lý...' : 'Mua Template'}
                  </Button>
                )}

                {/* Secondary Action Buttons */}
                {isOwned ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <a
                      href={officialAdminUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 text-sm sm:text-base h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                      title="Mở bảng điều khiển quản trị template của bạn"
                    >
                      <Terminal className="w-4 h-4 text-indigo-200" />
                      <span>Quản Trị Template</span>
                    </a>

                    <a
                      href={officialSiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 text-sm sm:text-base h-12 border-2 border-emerald-500 bg-emerald-50/50 hover:bg-emerald-100/70 text-emerald-800 font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer"
                      title="Xem website thật của bạn"
                    >
                      <Globe className="w-4 h-4 text-emerald-600" />
                      <span>Xem Website Của Bạn</span>
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-600 ml-0.5" />
                    </a>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {isEditExternal ? (
                      <a 
                        href={editUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="w-full inline-flex items-center justify-center gap-2 text-sm sm:text-base h-12 border-2 border-indigo-600 bg-white hover:bg-indigo-50 text-indigo-600 font-bold rounded-xl shadow-none transition-colors cursor-pointer"
                        title="Mở ứng dụng AI Studio gốc để chỉnh sửa"
                      >
                        <Edit3 className="w-4 h-4 text-indigo-600" /> Chỉnh Sửa Thử (EDIT)
                      </a>
                    ) : (
                      <Link 
                        to={editUrl} 
                        className="w-full inline-flex items-center justify-center gap-2 text-sm sm:text-base h-12 border-2 border-indigo-600 bg-white hover:bg-indigo-50 text-indigo-600 font-bold rounded-xl shadow-none transition-colors cursor-pointer"
                        title="Mở trình chỉnh sửa portfolio"
                      >
                        <Edit3 className="w-4 h-4 text-indigo-600" /> Chỉnh Sửa Thử (EDIT)
                      </Link>
                    )}

                    {isDemoExternal ? (
                      <a 
                        href={demoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="w-full inline-flex items-center justify-center gap-2 text-sm sm:text-base h-12 border-2 border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl shadow-none transition-colors cursor-pointer"
                        title="Xem website ứng dụng trực tiếp"
                      >
                        <Eye className="w-4 h-4 text-slate-600" /> Xem Demo Trực Tiếp
                      </a>
                    ) : (
                      <Link 
                        to={demoUrl} 
                        className="w-full inline-flex items-center justify-center gap-2 text-sm sm:text-base h-12 border-2 border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl shadow-none transition-colors cursor-pointer"
                        title="Xem demo"
                      >
                        <Eye className="w-4 h-4 text-slate-600" /> Xem Demo Trực Tiếp
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Domain & Ownership Info Card */}
          {isOwned ? (
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 rounded-2xl border-2 border-emerald-300 shadow-sm space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h4 className="text-xs sm:text-sm font-extrabold text-emerald-950 uppercase tracking-wider">
                    🟢 Bản Quyền & Tên Miền Đang Hoạt Động
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  Trạng thái: Online
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Website của bạn đang hoạt động trên tên miền riêng chính thức:
              </p>

              <div className="flex items-center justify-between gap-2 font-mono text-xs sm:text-sm bg-white p-3 rounded-xl border border-emerald-300 text-emerald-900 font-bold shadow-xs">
                <span className="truncate">{displaySiteUrl}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleCopyUrl(displaySiteUrl)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    title="Sao chép tên miền"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <a
                    href={officialSiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                    title="Mở website"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-slate-500 italic">
                  ✨ Mọi tùy chỉnh trong Quản Trị sẽ được đồng bộ trực tiếp lên tên miền này.
                </p>
                <Link
                  to="/dashboard/domains"
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline shrink-0"
                >
                  Quản lý Subdomain &rarr;
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl border-2 border-indigo-200/80 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h4 className="text-xs sm:text-sm font-extrabold text-indigo-950 uppercase tracking-wider">
                  🌟 Quyền sở hữu Tên miền & Không gian Website riêng
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Sau khi thanh toán, bạn sẽ được cấp không gian thương hiệu vĩnh viễn với cấu trúc subdomain:
              </p>
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs sm:text-sm bg-white p-3 rounded-xl border border-indigo-200 text-indigo-900 font-bold shadow-xs">
                <span className="text-slate-400">https://</span>
                <span className="text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">[tên-của-bạn]</span>
                <span className="text-indigo-600">.webcuaban.site</span>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                ✨ Nếu bạn mua nhiều template, tất cả đều được gom gọn gàng trong không gian <code className="font-mono text-indigo-700 bg-white px-1 py-0.5 rounded border border-indigo-100">[tên-của-bạn].webcuaban.site/...</code>
              </p>
            </div>
          )}

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
