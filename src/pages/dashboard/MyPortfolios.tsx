import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/src/components/ui/Button';
import { useAuth } from '@/src/contexts/AuthContext';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { PortfolioInstance } from '@/src/types';
import { 
  Globe, 
  Layers, 
  Terminal, 
  Copy, 
  Check, 
  Power, 
  ShoppingBag, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertOctagon, 
  Eye
} from 'lucide-react';
import { Loading } from '@/src/components/ui/Loading';
import { toast } from 'sonner';
import { api } from '@/src/services/api';

export default function MyPortfolios() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [portfolios, setPortfolios] = useState<PortfolioInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
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
      const serverData = user?.id ? await api.portfolios.getByUser(user.id) : [];
      let list: PortfolioInstance[] = Array.isArray(serverData) ? serverData : [];

      // Merge local saved portfolios for this user or global guest purchase
      const userKey = `user_portfolios_${user?.id || 'guest'}`;
      const savedUserPortfolios = localStorage.getItem(userKey);
      const savedGlobalPortfolios = localStorage.getItem('my_portfolios');

      const localList: PortfolioInstance[] = [];
      if (savedUserPortfolios) {
        try { localList.push(...JSON.parse(savedUserPortfolios)); } catch (e) {}
      }
      if (savedGlobalPortfolios) {
        try { localList.push(...JSON.parse(savedGlobalPortfolios)); } catch (e) {}
      }

      // Merge unique items by subdomain or ID
      const portfolioMap = new Map<string, PortfolioInstance>();
      list.forEach(p => portfolioMap.set(p.subdomain || p.id, p));
      localList.forEach(p => {
        if (p.subdomain || p.id) portfolioMap.set(p.subdomain || p.id, p);
      });

      setPortfolios(Array.from(portfolioMap.values()));
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
    return () => window.removeEventListener('portfolio_purchased', handleUpdate);
  }, [user?.id]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(language === 'vi' ? `Đã sao chép liên kết: ${text}` : `Copied link: ${text}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Toggle domain status (Active <-> Off)
  const handleToggleStatus = async (p: PortfolioInstance) => {
    const isCurrentlyActive = p.status !== 'off' && p.status !== 'disabled';
    const newStatus = isCurrentlyActive ? 'off' : 'published';
    setTogglingId(p.id);

    try {
      await api.portfolios.toggleActiveStatus(p.id, newStatus);

      const updatedList = portfolios.map(item => {
        if (item.id === p.id) {
          return { ...item, status: newStatus, updated_at: new Date().toISOString() };
        }
        return item;
      });
      setPortfolios(updatedList);
      localStorage.setItem(`user_portfolios_${user?.id || 'guest'}`, JSON.stringify(updatedList));

      if (newStatus === 'published') {
        toast.success(
          language === 'vi' 
            ? `Đã BẬT tên miền "${p.subdomain || p.name}". Khách truy cập có thể xem website bình thường.`
            : `Turned ON domain "${p.subdomain || p.name}". Visitors can view the website normally.`
        );
      } else {
        toast.warning(
          language === 'vi'
            ? `Đã TẮT tên miền "${p.subdomain || p.name}". Người khác truy cập vào link sẽ thấy trang lỗi 404.`
            : `Turned OFF domain "${p.subdomain || p.name}". Visitors will see a 404 error page.`
        );
      }
    } catch (err: any) {
      toast.error(language === 'vi' ? 'Có lỗi xảy ra khi đổi trạng thái tên miền' : 'Failed to update domain status');
    } finally {
      setTogglingId(null);
    }
  };

  // Filter portfolios
  const filteredPortfolios = portfolios.filter(p => {
    const isOff = p.status === 'off' || p.status === 'disabled';
    const isActive = !isOff;
    
    if (statusFilter === 'active' && !isActive) return false;
    if (statusFilter === 'off' && !isOff) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (p.name || '').toLowerCase().includes(q);
      const matchSub = (p.subdomain || '').toLowerCase().includes(q);
      return matchName || matchSub;
    }
    return true;
  });

  const totalCount = portfolios.length;
  const activeCount = portfolios.filter(p => p.status !== 'off' && p.status !== 'disabled').length;
  const offCount = totalCount - activeCount;

  return (
    <div className="w-full space-y-6">
      
      {/* Top Header & Kho Template Action (Full Width, 24px spacing) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2">
        <div className="space-y-1">
          <h1 className="text-[26px] sm:text-[28px] font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <span>{t('dash.myPortfolios.title')}</span>
            <span className="text-[14px] font-bold font-mono px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-full">
              {totalCount} Templates
            </span>
          </h1>
          <p className="text-[16px] text-slate-600 font-medium">
            {t('dash.myPortfolios.subtitle')}
          </p>
        </div>

        {/* Nút Kho Template dẫn đến Shop */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/templates">
            <Button className="gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[16px] px-6 py-3.5 rounded-2xl transition-all">
              <ShoppingBag className="w-5 h-5" /> {t('dash.nav.templateShop')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 bg-white border border-slate-200/90 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[14px] font-bold text-slate-500 uppercase tracking-wider block">{t('dash.myPortfolios.totalCount')}</span>
            <span className="text-[28px] font-black text-slate-900 mt-1 block tracking-tight">{totalCount}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center font-bold">
            <Layers className="w-6 h-6 text-indigo-600" />
          </div>
        </div>

        <div className="p-6 bg-white border border-slate-200/90 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[14px] font-bold text-emerald-600 uppercase tracking-wider block">{t('dash.myPortfolios.onlineCount')}</span>
            <span className="text-[28px] font-black text-emerald-600 mt-1 block tracking-tight">{activeCount}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 bg-white border border-slate-200/90 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[14px] font-bold text-amber-600 uppercase tracking-wider block">{t('dash.myPortfolios.offlineCount')}</span>
            <span className="text-[28px] font-black text-amber-600 mt-1 block tracking-tight">{offCount}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertOctagon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-4">
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

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-[14px] font-bold text-slate-600 flex items-center gap-1.5">
            <Filter className="w-4 h-4" /> {t('dash.myPortfolios.filter')}
          </span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-xl text-[14px] font-bold transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t('dash.myPortfolios.filterAll')} ({totalCount})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-4 py-2 rounded-xl text-[14px] font-bold transition-colors cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            {t('dash.myPortfolios.filterActive')} ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('off')}
            className={`px-4 py-2 rounded-xl text-[14px] font-bold transition-colors cursor-pointer ${
              statusFilter === 'off'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            {t('dash.myPortfolios.filterOff')} ({offCount})
          </button>
        </div>
      </div>

      {/* Main Templates List */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-500">
          <Loading size={36} />
          <p className="mt-4 text-[14px] font-mono">Loading...</p>
        </div>
      ) : filteredPortfolios.length === 0 ? (
        <div className="p-8 text-center text-slate-500 border-dashed border-2 border-slate-200 bg-white rounded-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
            <Layers className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-[18px] font-bold text-slate-900">
              {searchQuery || statusFilter !== 'all' ? 'No matching templates found' : t('dash.myPortfolios.empty')}
            </h3>
            <p className="text-slate-500 text-[14px] max-w-md mx-auto">
              {t('dash.myPortfolios.emptyDesc')}
            </p>
          </div>
          <Link to="/templates">
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-[14px] px-5 py-2.5">
              <ShoppingBag className="w-4 h-4" /> {t('dash.nav.templateShop')}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPortfolios.map((p, idx) => {
            const isOff = p.status === 'off' || p.status === 'disabled';
            const isActive = !isOff;
            const targetSub = p.subdomain || username;
            const fullDomainUrl = `https://${targetSub}.webcuaban.site`;
            const editorRoute = `/dashboard/editor/${p.id || 'inst-' + targetSub}`;
            const isToggling = togglingId === p.id;

            return (
              <div 
                key={p.id || idx} 
                className={`p-6 bg-white border rounded-2xl transition-all space-y-6 ${
                  isOff ? 'border-amber-200 bg-amber-50/10' : 'border-slate-200/90 hover:border-indigo-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  
                  {/* Left: Template Info & URL */}
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-[20px] font-black text-slate-900 truncate tracking-tight">
                        {p.name || 'PORTFOLIO TEMPLATE'}
                      </h2>

                      {/* Status Badge */}
                      {isActive ? (
                        <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[14px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          {t('dash.myPortfolios.statusOnline')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[14px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          {t('dash.myPortfolios.statusOffline')}
                        </span>
                      )}

                      <span className="text-[13px] font-mono text-slate-500 bg-slate-100 px-3 py-1 rounded-lg font-semibold">
                        ID: {p.template_id || p.id.slice(0, 8)}
                      </span>
                    </div>

                    {/* Domain Url */}
                    <div className="flex flex-wrap items-center gap-3 text-[14px]">
                      <div className="flex items-center gap-2 font-mono font-bold text-slate-700 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl">
                        <Globe className="w-4 h-4 text-indigo-600" />
                        <span className={isActive ? "text-indigo-700" : "text-slate-400 line-through"}>
                          {fullDomainUrl}
                        </span>
                      </div>

                      <button
                        onClick={() => copyToClipboard(fullDomainUrl, `p-${p.id}`)}
                        className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-bold text-[14px] cursor-pointer"
                        title="Copy URL"
                      >
                        {copiedKey === `p-${p.id}` ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        <span>{t('dash.myPortfolios.copy')}</span>
                      </button>
                    </div>

                    {/* Offline Warning Notice */}
                    {isOff && (
                      <p className="text-[14px] text-amber-800 bg-amber-50 border border-amber-200 p-3 rounded-xl font-medium flex items-center gap-2">
                        <AlertOctagon className="w-5 h-5 text-amber-600 shrink-0" />
                        {t('dash.myPortfolios.offlineAlert')}
                      </p>
                    )}
                  </div>

                  {/* Right: Toggle Switch & Actions */}
                  <div className="flex flex-wrap items-center gap-4 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    
                    {/* BẬT / TẮT TRẠNG THÁI TÊN MIỀN (TOGGLE SWITCH) */}
                    <div className="flex items-center gap-3.5 pr-4 border-r border-slate-200">
                      <div className="text-right">
                        <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wider block">
                          {t('dash.myPortfolios.domainStatus')}
                        </span>
                        <span className={`text-[15px] font-extrabold ${isActive ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {isActive ? t('dash.myPortfolios.btnOn') : t('dash.myPortfolios.btnOff')}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(p)}
                        disabled={isToggling}
                        className={`relative inline-flex h-9 w-16 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                          isActive ? 'bg-emerald-600' : 'bg-slate-300'
                        }`}
                        title={isActive ? 'Turn OFF domain (404)' : 'Turn ON domain (Online)'}
                      >
                        <span
                          className={`inline-block h-7 w-7 transform rounded-full bg-white transition-transform shadow-md flex items-center justify-center ${
                            isActive ? 'translate-x-8 text-emerald-600' : 'translate-x-1 text-slate-400'
                          }`}
                        >
                          <Power className="w-4 h-4" />
                        </span>
                      </button>
                    </div>

                    {/* Nút Xem Website */}
                    <a
                      href={isActive ? fullDomainUrl : '#'}
                      onClick={(e) => {
                        if (isOff) {
                          e.preventDefault();
                          toast.warning(language === 'vi' ? 'Tên miền này đang TẮT. Hãy bật công tắc sang màu xanh trước khi mở xem.' : 'This domain is currently OFF.');
                        }
                      }}
                      target={isActive ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl border text-[14px] font-bold transition-all ${
                        isActive
                          ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                          : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Eye className="w-4 h-4" /> {t('dash.myPortfolios.viewWeb')}
                    </a>

                    {/* Nút Quản Trị Template */}
                    <Link
                      to={editorRoute}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[14px] font-bold transition-all cursor-pointer shadow-xs"
                    >
                      <Terminal className="w-4 h-4" /> {t('dash.myPortfolios.adminWeb')}
                    </Link>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
