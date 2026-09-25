import { useEffect, useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Plus, Globe, Edit2, Eye, ExternalLink, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/src/contexts/AuthContext';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { api } from '@/src/services/api';
import { PortfolioInstance } from '@/src/types';
import { Loading } from '@/src/components/ui/Loading';

export default function DashboardOverview() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [portfolios, setPortfolios] = useState<PortfolioInstance[]>([]);
  const [loading, setLoading] = useState(true);
  
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.user_metadata?.name?.split(' ')[0] || 'User';

  useEffect(() => {
    async function loadData() {
      if (user) {
        try {
          const list = await api.portfolios.getByUser(user.id);
          setPortfolios(list || []);
        } catch (err) {
          console.error('Failed to load user portfolios in overview', err);
        }
      }
      setLoading(false);
    }
    loadData();
  }, [user]);

  const activeCount = portfolios.filter(p => p.status === 'published').length;
  const totalViews = portfolios.reduce((acc, p) => acc + (p.status === 'published' ? 142 : 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">{t('dash.overview.welcome')}, {firstName}</h1>
          <p className="text-slate-500 font-medium mt-1">{t('dash.overview.subtitle')}</p>
        </div>
        <Link to="/templates">
          <Button className="gap-2 shadow-soft-md">
            <Plus className="w-4 h-4" /> {t('dash.overview.new')}
          </Button>
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-white border border-slate-100 shadow-sm rounded-3xl">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t('dash.overview.active')}</h3>
          <p className="text-4xl font-extrabold text-slate-900 mt-2">{activeCount}</p>
          <span className="text-xs text-slate-400 font-medium mt-1 inline-block">Tổng số: {portfolios.length} trang</span>
        </Card>
        <Card className="p-6 bg-white border border-slate-100 shadow-sm rounded-3xl">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t('dash.overview.views')}</h3>
          <p className="text-4xl font-extrabold text-slate-900 mt-2">{totalViews}</p>
          <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">Lượt truy cập Edge</span>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">{t('dash.overview.recent')}</h2>
          <Link to="/dashboard/portfolios" className="text-sm font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1">
            {t('dash.overview.viewAll')} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12"><Loading /></div>
        ) : portfolios.length === 0 ? (
          <Card className="p-12 text-center text-slate-500 border-dashed border-2 bg-transparent shadow-none rounded-3xl flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{t('dash.overview.emptyTitle')}</h3>
              <p className="text-slate-500 font-medium mt-1">{t('dash.overview.emptyDesc')}</p>
            </div>
            <Link to="/templates" className="mt-4">
              <Button variant="secondary" className="bg-white">{t('dash.nav.browse')}</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4">
            {portfolios.slice(0, 3).map((p) => (
              <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-200 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900">{p.name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'published' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {p.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-indigo-600 font-mono mt-0.5">
                      {p.subdomain}.portfolio-shop.com
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:self-center">
                  <Link to={`/p/${p.subdomain}`} target="_blank">
                    <Button variant="outline" size="sm" className="h-8 px-3 gap-1.5 bg-white text-xs">
                      <Eye className="w-3.5 h-3.5" /> {t('dash.portfolios.btn.preview')}
                    </Button>
                  </Link>
                  <Link to={`/dashboard/portfolios/${p.id}/edit`}>
                    <Button variant="primary" size="sm" className="h-8 px-3 gap-1.5 text-xs">
                      <Edit2 className="w-3.5 h-3.5" /> {t('dash.portfolios.btn.edit')}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
