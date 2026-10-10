import { useEffect, useState } from 'react';
import { Button } from '@/src/components/ui/Button';
import { Plus, Globe, Eye, ArrowRight, Layers, ShoppingBag, Terminal, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/src/contexts/AuthContext';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { api } from '@/src/services/api';
import { PortfolioInstance, Template } from '@/src/types';
import { Loading } from '@/src/components/ui/Loading';

export default function DashboardOverview() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [portfolios, setPortfolios] = useState<PortfolioInstance[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.user_metadata?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';

  const username = (() => {
    if (user?.user_metadata?.username) return user.user_metadata.username;
    if (user?.phone) return user.phone.replace(/[^0-9]/g, '');
    if (user?.email) return user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9-]/g, '');
    return user?.id ? `user-${user.id.slice(0, 6)}` : 'user';
  })();

  useEffect(() => {
    async function loadData() {
      if (user) {
        try {
          const [list, tpls] = await Promise.all([
            api.portfolios.getByUser(user.id),
            api.templates.getAll()
          ]);
          setPortfolios(list || []);
          setTemplates(tpls || []);
        } catch (err) {
          console.error('Failed to load user portfolios in overview', err);
        }
      }
      setLoading(false);
    }
    loadData();
  }, [user]);

  const activeCount = portfolios.filter(p => p.status !== 'off' && p.status !== 'disabled').length;

  return (
    <div className="w-full space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2">
        <div className="space-y-1">
          <h1 className="text-[26px] sm:text-[28px] font-black text-slate-900 tracking-tight">
            {t('dash.overview.welcome')}, {firstName} 👋
          </h1>
          <p className="text-[16px] text-slate-600 font-medium">
            {t('dash.overview.subtitle')}
          </p>
        </div>
        <Link to="/templates" className="shrink-0">
          <Button className="gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[16px] px-6 py-3.5 rounded-2xl transition-all">
            <ShoppingBag className="w-5 h-5" /> {t('dash.nav.templateShop')}
          </Button>
        </Link>
      </div>

      {/* Overview Stat Cards (p-6, text >= 14px, no shadow) */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="p-6 bg-white border border-slate-200/90 rounded-2xl space-y-1">
          <h3 className="text-[14px] font-bold text-slate-500 uppercase tracking-wider">{t('dash.overview.active')}</h3>
          <p className="text-[32px] font-black text-emerald-600 tracking-tight">{activeCount}</p>
          <span className="text-[14px] text-slate-500 font-medium inline-block">
            {t('dash.overview.totalOwned').replace('{count}', String(portfolios.length))}
          </span>
        </div>

        <div className="p-6 bg-white border border-slate-200/90 rounded-2xl space-y-1">
          <h3 className="text-[14px] font-bold text-slate-500 uppercase tracking-wider">{t('dash.overview.primarySubdomain')}</h3>
          <p className="text-[18px] font-mono font-bold text-indigo-700 mt-2 truncate">
            {username}.webcuaban.site
          </p>
          <span className="text-[14px] text-emerald-600 font-bold inline-block">{t('dash.overview.statusActive')}</span>
        </div>
      </div>

      {/* Recent Portfolios Section (p-6, text >= 14px, no shadow) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[20px] font-bold text-slate-900">{t('dash.overview.recent')}</h2>
          <Link to="/dashboard/portfolios" className="text-[14px] font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1">
            {t('dash.overview.viewAll')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 flex items-center justify-center text-slate-500"><Loading /></div>
        ) : portfolios.length === 0 ? (
          <div className="p-8 text-center text-slate-500 border-dashed border-2 border-slate-200 bg-white rounded-2xl space-y-4">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto">
              <Layers className="w-7 h-7 text-slate-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-[18px] font-bold text-slate-900">{t('dash.overview.emptyTitle')}</h3>
              <p className="text-slate-500 font-medium text-[14px]">{t('dash.overview.emptyDesc')}</p>
            </div>
            <Link to="/templates" className="inline-block mt-2">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[14px] px-5 py-2.5 rounded-xl">
                {t('dash.overview.new')}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {portfolios.slice(0, 3).map((p, idx) => {
              const isOff = p.status === 'off' || p.status === 'disabled';
              const isActive = !isOff;
              const targetSub = (p.subdomain || username).trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || username;
              const fullUrl = `https://${targetSub}.webcuaban.site`;

              const tpl = p.template || templates.find(t => 
                t.id === p.template_id || 
                t.slug === p.template_id || 
                t.id === (p as any).templateId ||
                (p.name && t.name && t.name.toLowerCase().trim() === p.name.toLowerCase().trim()) ||
                (p.name && t.name && (t.name.toLowerCase().includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(t.name.toLowerCase())))
              );

              const targetTplAdmin = (tpl?.adminUrl || '').trim();
              const targetPubAdmin = (p.published_data?.admin_url || '').trim();
              const validPubAdmin = (targetPubAdmin.startsWith('http://') || targetPubAdmin.startsWith('https://')) ? targetPubAdmin : '';

              const baseAdminUrl = (targetTplAdmin.startsWith('http://') || targetTplAdmin.startsWith('https://'))
                ? targetTplAdmin
                : (validPubAdmin
                  || (tpl?.originUrl ? `${tpl.originUrl.replace(/\/$/, '')}/admin.html` : '')
                  || (tpl?.demoUrl ? `${tpl.demoUrl.replace(/\/$/, '')}/admin.html` : '')
                  || 'https://videograph.webcuaban.site/admin.html');

              const adminUrl = (() => {
                if (baseAdminUrl.startsWith('http://') || baseAdminUrl.startsWith('https://')) {
                  const sep = baseAdminUrl.includes('?') ? '&' : '?';
                  const domainHost = p.is_primary ? `${targetSub}.webcuaban.site` : `${targetSub}.webcuaban.site/${p.slug_path || 'template'}`;
                  const shopApiOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://www.webcuaban.site';
                  return `${baseAdminUrl}${sep}templateId=${encodeURIComponent(tpl?.id || p.slug_path || 'template')}&role=owner&licensed=true&trial=false&hideBanner=true&mode=published&licenseKey=activated&domain=${encodeURIComponent(domainHost)}&instance=${encodeURIComponent(p.id || `inst-${targetSub}`)}&user=${encodeURIComponent(user?.id || targetSub)}&tenant=${encodeURIComponent(targetSub)}&shopApi=${encodeURIComponent(shopApiOrigin)}`;
                }
                return `/dashboard/portfolios/${p.id || targetSub}/edit`;
              })();

              return (
                <div key={p.id || idx} className="bg-white p-6 rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-300 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                      <Globe className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h4 className="font-bold text-slate-900 text-[16px]">{p.name || 'Portfolio Template'}</h4>
                        {isActive ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[13px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {t('dash.myPortfolios.filterActive')}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[13px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            {t('dash.myPortfolios.filterOff')} (404)
                          </span>
                        )}
                      </div>
                      <p className="text-[14px] text-slate-500 font-mono mt-1">{fullUrl}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <a
                      href={isActive ? fullUrl : '#'}
                      target={isActive ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-[14px] font-bold border border-slate-200"
                    >
                      {t('dash.myPortfolios.viewWeb')}
                    </a>
                    <a
                      href={adminUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[14px] font-bold"
                    >
                      {t('dash.myPortfolios.adminWeb')}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
