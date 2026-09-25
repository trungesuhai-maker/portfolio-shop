import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';
import { Order } from '@/src/types';
import { Loading } from '@/src/components/ui/Loading';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { api } from '@/src/services/api';

export default function Orders() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      if (user) {
        try {
          if (isSupabaseConfigured) {
            const { data, error } = await supabase
              .from('orders')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false });

            if (!error && data && data.length > 0) {
              setOrders(data);
              setLoading(false);
              return;
            }
          }

          // Fallback to Express backend API
          const list = await api.orders.getByUser(user.id);
          setOrders(list || []);
        } catch (err) {
          console.error('Failed to load customer orders', err);
        }
      }
      setLoading(false);
    }

    fetchOrders();
  }, [user]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">{t('dash.orders.title')}</h1>
        <p className="text-slate-500 font-medium mt-1">{t('dash.orders.subtitle')}</p>
      </div>

      {loading ? (
        <div className="py-20"><Loading /></div>
      ) : orders.length === 0 ? (
        <Card className="p-12 text-center text-slate-500 border-dashed border-2 bg-transparent shadow-none rounded-3xl flex flex-col items-center justify-center space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">{t('dash.orders.emptyTitle')}</h3>
            <p className="text-slate-500 font-medium">{t('dash.orders.emptyDesc')}</p>
          </div>
          <Link to="/templates" className="mt-2">
            <Button variant="secondary" className="bg-white shadow-xs">{t('dash.nav.browse')}</Button>
          </Link>
        </Card>
      ) : (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-900">{t('dash.orders.table.id')}</th>
                <th className="px-6 py-4 font-bold text-slate-900">{t('dash.orders.table.template')}</th>
                <th className="px-6 py-4 font-bold text-slate-900">{t('dash.orders.table.date')}</th>
                <th className="px-6 py-4 font-bold text-slate-900">{t('dash.orders.table.status')}</th>
                <th className="px-6 py-4 font-bold text-slate-900 text-right">{t('dash.orders.table.amount')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{order.id.slice(0, 8)}...</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{order.template_id}</td>
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                      order.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 
                      order.status === 'failed' ? 'bg-red-50 text-red-600' :
                      'bg-amber-50 text-amber-600'
                    }`}>
                      {order.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-extrabold text-slate-900">
                    ${order.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
