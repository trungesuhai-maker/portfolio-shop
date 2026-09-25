import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { supabase, isSupabaseConfigured } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';
import { PortfolioInstance } from '@/src/types';
import { Edit2, Eye, Globe, ExternalLink, AlertCircle } from 'lucide-react';
import { Loading } from '@/src/components/ui/Loading';
import { toast } from 'sonner';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { api } from '@/src/services/api';
import { MOCK_PORTFOLIOS } from '@/src/services/mockData';

export default function MyPortfolios() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [portfolios, setPortfolios] = useState<PortfolioInstance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPortfolios() {
      if (user) {
        try {
          if (isSupabaseConfigured) {
            const { data, error } = await supabase
              .from('portfolio_instances')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false });

            if (!error && data && data.length > 0) {
              setPortfolios(data);
              setLoading(false);
              return;
            }
          }
          // Internal backend API sync
          const data = await api.portfolios.getByUser(user.id);
          setPortfolios(data || []);
        } catch (err) {
          console.error('Failed to load portfolios', err);
        }
      }
      setLoading(false);
    }

    fetchPortfolios();
  }, [user]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">{t('dash.portfolios.title')}</h1>
          <p className="text-slate-500 font-medium mt-1">{t('dash.portfolios.subtitle')}</p>
        </div>
        <Link to="/templates">
          <Button className="shadow-soft-md">
            {t('dash.overview.new')}
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="py-20"><Loading /></div>
      ) : portfolios.length === 0 ? (
        <Card className="p-12 text-center text-slate-500 border-dashed border-2 bg-transparent shadow-none rounded-3xl">
          <h3 className="text-lg font-bold text-slate-900 mb-2">{t('dash.overview.emptyTitle')}</h3>
          <p className="text-slate-500 font-medium mb-6">{t('dash.overview.emptyDesc')}</p>
          <Link to="/templates">
            <Button>{t('dash.nav.browse')}</Button>
          </Link>
        </Card>
      ) : (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-900">{t('dash.portfolios.table.name')}</th>
                  <th className="px-6 py-4 font-bold text-slate-900">{t('dash.portfolios.table.status')}</th>
                  <th className="px-6 py-4 font-bold text-slate-900">{t('dash.portfolios.table.domain')}</th>
                  <th className="px-6 py-4 font-bold text-slate-900">{t('dash.portfolios.table.updated')}</th>
                  <th className="px-6 py-4 font-bold text-slate-900 text-right">{t('dash.portfolios.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {portfolios.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-slate-500 font-medium text-xs mt-1">ID: {p.template_id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        p.status === 'published' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {p.subdomain ? (
                        <Link to={`/p/${p.subdomain}`} target="_blank" className="inline-flex items-center gap-1.5 text-indigo-600 font-bold hover:text-indigo-700 font-mono text-xs">
                          {p.subdomain}.portfolio-shop.com <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : (
                        <span className="text-slate-400 font-medium">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">
                      {new Date(p.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link to={`/p/${p.subdomain}`} target="_blank">
                        <Button variant="outline" size="sm" className="h-8 px-3 gap-1.5 bg-white">
                          <Eye className="w-3.5 h-3.5" /> {t('dash.portfolios.btn.preview')}
                        </Button>
                      </Link>
                      <Link to={`/dashboard/portfolios/${p.id}/edit`}>
                        <Button variant="primary" size="sm" className="h-8 px-3 gap-1.5">
                          <Edit2 className="w-3.5 h-3.5" /> {t('dash.portfolios.btn.edit')}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
