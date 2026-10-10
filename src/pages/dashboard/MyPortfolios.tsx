import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/src/components/ui/Button';
import { useAuth } from '@/src/contexts/AuthContext';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { PortfolioInstance, Template } from '@/src/types';
import { 
  Globe, 
  Layers, 
  Terminal, 
  Copy, 
  Check, 
  Power, 
  ShoppingBag, 
  Search, 
  CheckCircle2, 
  AlertOctagon, 
  Eye,
  Sparkles,
  ShoppingCart,
  Trash2,
  Crown
} from 'lucide-react';
import { Loading } from '@/src/components/ui/Loading';
import { toast } from 'sonner';
import { api } from '@/src/services/api';
import { supabase, isSupabaseConfigured } from '@/src/lib/supabase';

export default function MyPortfolios() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [portfolios, setPortfolios] = useState<PortfolioInstance[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'off'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const username = (() => {
    if (user?.user_metadata?.username) return user.user_metadata.username;
    if (user?.phone) return user.phone.replace(/[^0-9]/g, '');
    if (user?.email) return user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9-]/g, '');
    return user?.id ? `user-${user.id.slice(0, 6)}` : 'user';
  })();

  const fetchPortfolios = async () => {
    try {
      setLoading(true);
      const portfolioMap = new Map<string, PortfolioInstance>();

      // Load all available templates in parallel for accurate metadata & admin URL matching
      let allTemplates: Template[] = [];
      try {
        allTemplates = await api.templates.getAll();
        setTemplates(allTemplates || []);
      } catch (tErr) {
        console.warn('Failed to load templates metadata', tErr);
      }

      const savedPrimaryId = typeof window !== 'undefined' && user?.id ? localStorage.getItem(`primary_portfolio_${user.id}`) : null;

      // 1. Direct Supabase Query (Real Source of Truth)
      if (isSupabaseConfigured) {
        try {
          let query = supabase.from('portfolio_instances').select('*');
          if (user?.id) {
            query = query.or(`user_id.eq.${user.id},subdomain.eq.${username}`);
          }
          const { data: supaList } = await query;
          if (Array.isArray(supaList) && supaList.length > 0) {
            supaList.forEach(p => {
              if (p.status !== 'draft') {
                portfolioMap.set(p.subdomain || p.id, p);
              }
            });
          }
        } catch (supaErr) {
          console.warn('Supabase portfolio fetch error:', supaErr);
        }
      }

      // 2. Server API fallback/sync for purchased
      const serverData = user?.id ? await api.portfolios.getByUser(user.id) : [];
      if (Array.isArray(serverData)) {
        serverData.forEach(p => {
          if (p.status !== 'draft' && !portfolioMap.has(p.subdomain || p.id)) {
            portfolioMap.set(p.subdomain || p.id, p);
          }
        });
      }

      const rawList = Array.from(portfolioMap.values());
      let hasPrimary = false;

      const enrichedPurchased = rawList.map(item => {
        let tpl = item.template;
        if (!tpl) {
          tpl = allTemplates.find(t => t.id === item.template_id || t.slug === item.template_id || t.id === (item as any).templateId);
        }
        const cleanSlug = tpl?.slug ? tpl.slug.replace(/^port-/, '').toLowerCase() : (item.subdomain || 'template');
        const slug_path = item.slug_path || cleanSlug;
        
        let is_primary = Boolean(item.is_primary);
        if (savedPrimaryId) {
          is_primary = item.id === savedPrimaryId || item.subdomain === savedPrimaryId;
        }
        if (is_primary) hasPrimary = true;

        return {
          ...item,
          template: tpl,
          slug_path,
          is_primary
        };
      });

      // Default first item as primary if none explicitly set
      if (!hasPrimary && enrichedPurchased.length > 0) {
        enrichedPurchased[0].is_primary = true;
      }

      setPortfolios(enrichedPurchased);
    } catch (err) {
      console.error('Failed to load portfolios', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolios();

    const handleUpdate = () => fetchPortfolios();
    window.addEventListener('portfolio_purchased', handleUpdate);
    window.addEventListener('portfolio_primary_updated', handleUpdate);
    window.addEventListener('portfolio_status_updated', handleUpdate);
    return () => {
      window.removeEventListener('portfolio_purchased', handleUpdate);
      window.removeEventListener('portfolio_primary_updated', handleUpdate);
      window.removeEventListener('portfolio_status_updated', handleUpdate);
    };
  }, [user?.id]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(language === 'vi' ? `Đã sao chép liên kết: ${text}` : `Copied link: ${text}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Toggle domain status (Active <-> Off) with primary sync logic
  const handleToggleStatus = async (p: PortfolioInstance) => {
    const isCurrentlyActive = p.status !== 'off' && p.status !== 'disabled';
    const newStatus = isCurrentlyActive ? 'off' : 'published';
    setTogglingId(p.id);

    try {
      const targetSubdomain = p.subdomain || username;
      const isPrimary = Boolean(p.is_primary);

      // If primary: synchronize with root domain status
      if (isPrimary) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(`domain_status_${username}`, newStatus);
        }
        if (isSupabaseConfigured) {
          try {
            await supabase
              .from('domains')
              .update({ status: newStatus === 'published' ? 'active' : 'inactive' })
              .or(`portfolio_id.eq.${p.id},subdomain.eq.${username}`);
          } catch (e) {}
        }
      }

      // 1. Direct Supabase Update for the instance
      if (isSupabaseConfigured) {
        try {
          await supabase
            .from('portfolio_instances')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .or(`id.eq.${p.id},subdomain.eq.${targetSubdomain}`);
        } catch (supaToggleErr) {
          console.warn('Supabase toggle error:', supaToggleErr);
        }
      }

      // 2. Server API sync
      await api.portfolios.toggleActiveStatus(p.id, newStatus, {
        subdomain: targetSubdomain,
        name: p.name,
        template_id: p.template_id,
        userId: user?.id
      });

      const updatedList = portfolios.map(item => {
        if (item.id === p.id || (targetSubdomain && item.subdomain === targetSubdomain)) {
          return { ...item, status: newStatus, updated_at: new Date().toISOString() };
        }
        return item;
      });
      setPortfolios(updatedList);
      window.dispatchEvent(new Event('portfolio_status_updated'));

      if (isPrimary) {
        if (newStatus === 'published') {
          toast.success(
            language === 'vi' 
              ? `Đã BẬT Template chính và Tên miền "https://${username}.webcuaban.site". Khách truy cập có thể xem website bình thường.`
              : `Turned ON primary template and domain "https://${username}.webcuaban.site".`
          );
        } else {
          toast.warning(
            language === 'vi'
              ? `Đã TẮT Template chính và Tên miền "https://${username}.webcuaban.site". Khách truy cập sẽ thấy trang lỗi 404.`
              : `Turned OFF primary template and domain "https://${username}.webcuaban.site". Visitors will see 404.`
          );
        }
      } else {
        const slugPath = p.slug_path || (p.template?.slug ? p.template.slug.replace(/^port-/, '') : p.subdomain);
        const subUrl = `https://${username}.webcuaban.site/${slugPath}`;
        if (newStatus === 'published') {
          toast.success(
            language === 'vi' 
              ? `Đã BẬT Template phụ "${p.name}". Khách truy cập vào ${subUrl} có thể xem bình thường.`
              : `Turned ON secondary template "${p.name}".`
          );
        } else {
          toast.warning(
            language === 'vi'
              ? `Đã TẮT Template phụ "${p.name}". Link ${subUrl} sẽ hiển thị lỗi 404. Tên miền chính vẫn hoạt động bình thường.`
              : `Turned OFF secondary template "${p.name}". Primary domain remains active.`
          );
        }
      }
    } catch (err: any) {
      toast.error(language === 'vi' ? 'Có lỗi xảy ra khi đổi trạng thái' : 'Failed to update domain status');
    } finally {
      setTogglingId(null);
    }
  };

  // Set a template as Primary (Home website on root domain)
  const handleSetPrimary = async (p: PortfolioInstance) => {
    if (!user?.id || p.is_primary) return;
    setSettingPrimaryId(p.id);
    try {
      await api.portfolios.setPrimaryPortfolio(user.id, p.id);
      const updatedList = portfolios.map(item => ({
        ...item,
        is_primary: item.id === p.id
      }));
      setPortfolios(updatedList);
      toast.success(
        language === 'vi'
          ? `Đã đặt "${p.name || 'Template'}" làm Website Trang Chủ chính (https://${username}.webcuaban.site)!`
          : `Set "${p.name}" as primary homepage (https://${username}.webcuaban.site)!`
      );
    } catch (err) {
      toast.error(language === 'vi' ? 'Không thể đặt làm trang chủ' : 'Failed to set primary website');
    } finally {
      setSettingPrimaryId(null);
    }
  };

  // Filter purchased portfolios
  const filteredPortfolios = portfolios.filter(p => {
    const isOff = p.status === 'off' || p.status === 'disabled';
    const isActive = !isOff;
    
    if (statusFilter === 'active' && !isActive) return false;
    if (statusFilter === 'off' && !isOff) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (p.name || '').toLowerCase().includes(q);
      const matchSub = (p.subdomain || '').toLowerCase().includes(q);
      const matchSlug = (p.slug_path || '').toLowerCase().includes(q);
      return matchName || matchSub || matchSlug;
    }
    return true;
  });

  const totalCount = portfolios.length;
  const activeCount = portfolios.filter(p => p.status !== 'off' && p.status !== 'disabled').length;
  const offCount = totalCount - activeCount;

  // Render a single purchased portfolio card
  const renderPurchasedCard = (p: PortfolioInstance, idx: number) => {
    const isOff = p.status === 'off' || p.status === 'disabled';
    const isActive = !isOff;
    const isPrimary = Boolean(p.is_primary);
    const isToggling = togglingId === p.id;
    const isSettingPrimary = settingPrimaryId === p.id;

    const tpl = p.template || templates.find(t => 
      t.id === p.template_id || 
      t.slug === p.template_id || 
      t.id === (p as any).templateId ||
      (p.name && t.name && t.name.toLowerCase().trim() === p.name.toLowerCase().trim()) ||
      (p.name && t.name && (t.name.toLowerCase().includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(t.name.toLowerCase())))
    );

    const slugPath = (p.slug_path || (tpl?.slug ? tpl.slug.replace(/^port-/, '') : (p.subdomain || 'template'))).toLowerCase().replace(/[^a-z0-9-]/g, '');
    const activeUrl = isPrimary ? `https://${username}.webcuaban.site` : `https://${username}.webcuaban.site/${slugPath}`;
    const subpathUrl = `https://${username}.webcuaban.site/${slugPath}`;

    const targetTplAdmin = (tpl?.adminUrl || '').trim();
    const targetPubAdmin = (p.published_data?.admin_url || '').trim();
    const validPubAdmin = (targetPubAdmin.startsWith('http://') || targetPubAdmin.startsWith('https://')) ? targetPubAdmin : '';

    const baseAdminUrl = (targetTplAdmin.startsWith('http://') || targetTplAdmin.startsWith('https://'))
      ? targetTplAdmin
      : (validPubAdmin
        || (tpl?.originUrl ? `${tpl.originUrl.replace(/\/$/, '')}/admin.html` : '')
        || (tpl?.demoUrl ? `${tpl.demoUrl.replace(/\/$/, '')}/admin.html` : '')
        || 'https://videograph.webcuaban.site/admin.html');

    const templateAdminUrl = (() => {
      if (baseAdminUrl.startsWith('http://') || baseAdminUrl.startsWith('https://')) {
        const sep = baseAdminUrl.includes('?') ? '&' : '?';
        const shopApiOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://www.webcuaban.site';
        return `${baseAdminUrl}${sep}templateId=${encodeURIComponent(tpl?.id || slugPath)}&role=owner&licensed=true&trial=false&hideBanner=true&mode=published&licenseKey=activated&domain=${encodeURIComponent(activeUrl.replace(/^https?:\/\//, ''))}&instance=${encodeURIComponent(p.id || `inst-${username}`)}&user=${encodeURIComponent(user?.id || username)}&tenant=${encodeURIComponent(username)}&shopApi=${encodeURIComponent(shopApiOrigin)}`;
      }
      return `/dashboard/portfolios/${p.id || username}/edit`;
    })();

    return (
      <div 
        key={p.id || idx} 
        className={`p-5 sm:p-6 bg-white border rounded-2xl transition-all space-y-4 shadow-xs ${
          isPrimary 
            ? 'border-indigo-300 ring-2 ring-indigo-500/10 bg-gradient-to-br from-white via-white to-indigo-50/20' 
            : (isOff ? 'border-amber-200 bg-amber-50/10' : 'border-slate-200/90 hover:border-slate-300')
        }`}
      >
        <div className="space-y-4">
          {/* Header & Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <h3 className="text-[18px] sm:text-[19px] font-black text-slate-900 truncate tracking-tight">
                {p.name || tpl?.name || 'PORTFOLIO TEMPLATE'}
              </h3>

              {isPrimary ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-black bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white shadow-xs">
                  <span>👑 Website Chính (Trang Chủ)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  <span>Website Phụ (/slug)</span>
                </span>
              )}
            </div>

            {/* Status Badge */}
            {isActive ? (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[13px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                {t('dash.myPortfolios.statusOnline')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[13px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                {t('dash.myPortfolios.statusOffline')}
              </span>
            )}
          </div>

          {/* Domain Url Display */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5 text-[14px]">
              <div className={`flex items-center gap-2 font-mono font-bold px-3.5 py-2 rounded-xl flex-1 min-w-0 border ${
                isPrimary ? 'bg-amber-50/50 border-amber-300 text-amber-950' : 'bg-slate-50 border border-slate-200 text-slate-700'
              }`}>
                <Globe className={`w-4 h-4 shrink-0 ${isPrimary ? 'text-amber-600' : 'text-indigo-600'}`} />
                <span className={`truncate ${isActive ? (isPrimary ? 'text-indigo-900 font-extrabold' : 'text-indigo-700') : 'text-slate-400 line-through'}`}>
                  {activeUrl}
                </span>
              </div>

              <button
                onClick={() => copyToClipboard(activeUrl, `p-${p.id}`)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-[13px] border border-slate-200 transition-colors cursor-pointer shrink-0"
                title="Copy URL"
              >
                {copiedKey === `p-${p.id}` ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{t('dash.myPortfolios.copy')}</span>
              </button>
            </div>

            {isPrimary ? (
              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 px-1 font-medium gap-1">
                <span className="text-amber-700 font-bold">
                  ✨ Đang hiển thị trực tiếp tại trang chủ tên miền chính của bạn.
                </span>
                <span className="font-mono text-slate-400">
                  Link con: {subpathUrl}
                </span>
              </div>
            ) : (
              <div className="text-[11px] text-slate-500 px-1 font-medium">
                Website phụ thuộc thương hiệu của bạn. Truy cập qua link: <code className="font-mono font-bold text-indigo-600">{subpathUrl}</code>
              </div>
            )}
          </div>

          {/* Offline Warning Notice */}
          {isOff && (
            <p className="text-[13px] text-amber-800 bg-amber-50 border border-amber-200 p-3 rounded-xl font-medium flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {isPrimary 
                  ? 'Template chính đang TẮT. Tên miền https://' + username + '.webcuaban.site sẽ hiển thị trang lỗi 404.' 
                  : 'Template phụ này đang TẮT. Người dùng truy cập đường dẫn ' + subpathUrl + ' sẽ thấy trang lỗi 404.'}
              </span>
            </p>
          )}

          {/* Bottom Bar: Toggle + Đặt làm Trang chủ + 2 Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            {/* Toggle Status */}
            <div className="flex items-center gap-3">
              <div className="text-left">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  {isPrimary ? 'Trạng thái Tên miền chính' : 'Trạng thái Website'}
                </span>
                <span className={`text-[13px] font-extrabold ${isActive ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {isActive ? t('dash.myPortfolios.btnOn') : t('dash.myPortfolios.btnOff')}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleToggleStatus(p)}
                disabled={isToggling}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors duration-300 ease-in-out cursor-pointer focus:outline-none ${
                  isActive ? 'bg-emerald-500 shadow-inner' : 'bg-slate-300 hover:bg-slate-400'
                }`}
                title={isActive ? 'BẬT (Online) - Nhấn để Tắt' : 'TẮT (Offline) - Nhấn để Bật'}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-all duration-300 ease-in-out flex items-center justify-center ${
                    isActive ? 'translate-x-5 text-emerald-600' : 'translate-x-0 text-slate-400'
                  }`}
                >
                  <Power className={`w-3 h-3 transition-transform duration-300 ${isActive ? 'rotate-0 scale-100' : 'rotate-180 scale-90'}`} />
                </span>
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* NÚT ĐẶT LÀM TRANG CHỦ CHÍNH */}
              {isPrimary ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 text-[12px] font-extrabold cursor-default select-none">
                  <Crown className="w-3.5 h-3.5 text-amber-600" />
                  <span>Đang là Trang Chủ</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSetPrimary(p)}
                  disabled={isSettingPrimary}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 hover:border-amber-300 text-[12px] font-bold transition-all cursor-pointer"
                  title={`Gắn template này làm trang chủ chính cho https://${username}.webcuaban.site`}
                >
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isSettingPrimary ? 'Đang đặt...' : 'Đặt làm Trang Chủ'}</span>
                </button>
              )}

              {/* Nút Xem Website */}
              <a
                href={isActive ? activeUrl : '#'}
                onClick={(e) => {
                  if (isOff) {
                    e.preventDefault();
                    toast.warning(language === 'vi' ? 'Website này đang TẮT. Hãy bật công tắc sang màu xanh trước khi mở xem.' : 'This website is currently OFF.');
                  }
                }}
                target={isActive ? "_blank" : undefined}
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-[13px] font-bold transition-all ${
                  isActive
                    ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800 shadow-xs cursor-pointer'
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{t('dash.myPortfolios.viewWeb')}</span>
              </a>

              {/* Nút Quản lý Template */}
              <a
                href={templateAdminUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-extrabold transition-all cursor-pointer shadow-xs gap-1.5"
              >
                <Terminal className="w-3.5 h-3.5 text-indigo-200" />
                <span>{language === 'vi' ? 'Quản lý' : 'Manage'}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Top Header & Kho Template Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2">
        <div className="space-y-1">
          <h1 className="text-[26px] sm:text-[28px] font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <span>{t('dash.myPortfolios.title')}</span>
            <span className="text-[14px] font-bold font-mono px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-full">
              {totalCount} {language === 'vi' ? 'Đã sở hữu' : 'Owned'}
            </span>
          </h1>
          <p className="text-[16px] text-slate-600 font-medium">
            {t('dash.myPortfolios.subtitle')}
          </p>
        </div>

        {/* Nút Kho Template dẫn đến Shop */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/templates">
            <Button className="gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[16px] px-6 py-3.5 rounded-2xl transition-all shadow-md shadow-indigo-600/20">
              <ShoppingBag className="w-5 h-5" /> {t('dash.nav.templateShop')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview Stats Cards (3 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 bg-white border border-slate-200/90 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wider block">
              {language === 'vi' ? 'Template Đã Mua' : t('dash.myPortfolios.totalCount')}
            </span>
            <span className="text-[26px] font-black text-slate-900 mt-1 block tracking-tight">{totalCount}</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5 text-indigo-600" />
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200/90 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[13px] font-bold text-emerald-600 uppercase tracking-wider block">{t('dash.myPortfolios.onlineCount')}</span>
            <span className="text-[26px] font-black text-emerald-600 mt-1 block tracking-tight">{activeCount}</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200/90 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[13px] font-bold text-amber-600 uppercase tracking-wider block">{t('dash.myPortfolios.offlineCount')}</span>
            <span className="text-[26px] font-black text-amber-600 mt-1 block tracking-tight">{offCount}</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('dash.myPortfolios.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium text-slate-800 outline-none focus:bg-white focus:border-indigo-500 transition-all"
          />
        </div>

        {/* 3 Tabs Filter: Tất cả, Đang bật, Đã tắt */}
        <div className="inline-flex flex-wrap items-center p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 gap-1 w-full sm:w-fit">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] sm:text-[14px] transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-indigo-700 font-black shadow-xs'
                : 'text-slate-600 hover:text-slate-900 font-bold hover:bg-white/50'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>{t('dash.myPortfolios.filterAll')}</span>
            <span className={`text-[12px] px-2 py-0.5 rounded-full font-bold ${
              statusFilter === 'all' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200/70 text-slate-600'
            }`}>
              {totalCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('active')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] sm:text-[14px] transition-all cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-white text-emerald-700 font-black shadow-xs'
                : 'text-slate-600 hover:text-slate-900 font-bold hover:bg-white/50'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{t('dash.myPortfolios.filterActive')}</span>
            <span className={`text-[12px] px-2 py-0.5 rounded-full font-bold ${
              statusFilter === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200/70 text-slate-600'
            }`}>
              {activeCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('off')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] sm:text-[14px] transition-all cursor-pointer ${
              statusFilter === 'off'
                ? 'bg-white text-amber-700 font-black shadow-xs'
                : 'text-slate-600 hover:text-slate-900 font-bold hover:bg-white/50'
            }`}
          >
            <AlertOctagon className="w-4 h-4 text-amber-600" />
            <span>{t('dash.myPortfolios.filterOff')}</span>
            <span className={`text-[12px] px-2 py-0.5 rounded-full font-bold ${
              statusFilter === 'off' ? 'bg-amber-50 text-amber-700' : 'bg-slate-200/70 text-slate-600'
            }`}>
              {offCount}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Area - Only Purchased Templates */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-500">
          <Loading size={36} />
          <p className="mt-4 text-[14px] font-mono">Đang tải danh sách template...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPortfolios.length === 0 ? (
            <div className="p-12 text-center text-slate-500 border-dashed border-2 border-slate-200 bg-white rounded-3xl space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
                <Layers className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-[18px] font-bold text-slate-900">
                  {searchQuery 
                    ? (language === 'vi' ? 'Không tìm thấy template phù hợp' : 'No matching templates found') 
                    : (statusFilter === 'active' ? (language === 'vi' ? 'Không có template nào đang Bật' : 'No active templates') : (language === 'vi' ? 'Không có template nào đã Tắt' : 'Bạn chưa mua template nào'))}
                </h3>
                <p className="text-slate-500 text-[14px] max-w-md mx-auto">
                  {language === 'vi' 
                    ? 'Khám phá kho template đa dạng để chọn mẫu và đăng ký tên miền riêng ngay.' 
                    : 'Explore our template store to pick your website design.'}
                </p>
              </div>
              <Link to="/templates">
                <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-[14px] px-6 py-2.5 shadow-md shadow-indigo-600/20">
                  <ShoppingBag className="w-4 h-4" /> {t('dash.nav.templateShop')}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredPortfolios.map((p, idx) => renderPurchasedCard(p, idx))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
