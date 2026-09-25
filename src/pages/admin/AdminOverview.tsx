import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/src/services/api';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Loading } from '@/src/components/ui/Loading';
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  FileCode2, 
  Sparkles, 
  ArrowUpRight, 
  TrendingUp,
  Clock,
  Plus,
  ArrowRight
} from 'lucide-react';

export default function AdminOverview() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await api.admin.getStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load stats', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Tổng quan Quản trị</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Chỉ số nền tảng, thống kê doanh thu và vận hành cửa hàng trực tiếp.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link to="/admin/templates">
            <Button className="gap-2 bg-indigo-600 text-white font-bold text-sm md:text-base rounded-[12px] shadow-[0_2px_3px_0_rgba(0,0,0,0.25)] border-2 border-indigo-600 [&_svg]:text-white">
              <Plus className="w-4 h-4" /> Thêm Template mới
            </Button>
          </Link>
          <Link to="/admin/orders">
            <Button variant="outline" className="gap-2 text-indigo-600 font-bold text-sm md:text-base rounded-[12px] shadow-none border-2 border-indigo-600 bg-white hover:bg-indigo-50 [&_svg]:text-indigo-600">
              <ShoppingBag className="w-4 h-4" /> Xem đơn hàng
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row: 5 Key Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* 1. Total Revenue */}
        <Card className="p-5 bg-white border-2 border-slate-200 shadow-none relative overflow-hidden rounded-[12px]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Tổng doanh thu</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
            {formatCurrency(stats?.totalRevenue)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-sm font-medium text-emerald-600">
            <TrendingUp className="w-4 h-4" />
            <span>+18.4% tháng này</span>
          </div>
        </Card>

        {/* 2. Total Orders */}
        <Card className="p-5 bg-white border-2 border-slate-200 shadow-none rounded-[12px]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Đơn hàng</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
            {stats?.ordersCount || 0}
          </p>
          <p className="text-sm text-slate-500 font-medium mt-2">Đã thanh toán & duyệt</p>
        </Card>

        {/* 3. Total Customers */}
        <Card className="p-5 bg-white border-2 border-slate-200 shadow-none rounded-[12px]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Khách hàng</span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
            {stats?.customersCount || 0}
          </p>
          <p className="text-sm text-slate-500 font-medium mt-2">Tài khoản người mua</p>
        </Card>

        {/* 4. Active Portfolios */}
        <Card className="p-5 bg-white border-2 border-slate-200 shadow-none rounded-[12px]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Instance hoạt động</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileCode2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
            {stats?.activePortfolios || 0}
          </p>
          <p className="text-sm text-slate-500 font-medium mt-2">Website đã cấp phát</p>
        </Card>

        {/* 5. Published Portfolios */}
        <Card className="p-5 bg-white border-2 border-slate-200 shadow-none rounded-[12px]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Đã xuất bản</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-600 mt-2 tracking-tight">
            {stats?.publishedPortfolios || 0}
          </p>
          <p className="text-sm text-slate-500 font-medium mt-2">Đang chạy trực tuyến</p>
        </Card>
      </div>

      {/* Grid: Popular Templates & Recent Customers */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Popular Templates (2 cols) */}
        <Card className="lg:col-span-2 p-6 bg-white border-2 border-slate-200 shadow-none rounded-[12px] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Template phổ biến</h2>
              <p className="text-sm text-slate-500">Mẫu giao diện có doanh thu và lượt mua cao nhất</p>
            </div>
            <Link to="/admin/templates" className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              Quản lý tất cả <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {stats?.popularTemplates && stats.popularTemplates.length > 0 ? (
              stats.popularTemplates.map((tpl: any, idx: number) => (
                <div key={tpl.id} className="flex items-center justify-between p-3 rounded-[12px] hover:bg-slate-50 border-2 border-slate-100 transition-colors">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="text-sm font-extrabold text-slate-400 w-5 text-center">#{idx + 1}</span>
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                      {tpl.thumbnail && tpl.thumbnail.startsWith('http') ? (
                        <img src={tpl.thumbnail} alt={tpl.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full ${tpl.thumbnail || 'bg-brand-500'}`} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{tpl.name}</p>
                      <p className="text-sm text-slate-500">{tpl.categoryName || 'Portfolio'}</p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 pl-4">
                    <p className="text-sm font-black text-slate-900">{formatCurrency(tpl.revenue)}</p>
                    <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block mt-0.5">
                      {tpl.salesCount} đã bán
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 py-6 text-center">Chưa có lượt bán template nào.</p>
            )}
          </div>
        </Card>

        {/* Recent Customers (1 col) */}
        <Card className="p-6 bg-white border-2 border-slate-200 shadow-none rounded-[12px] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Khách hàng mới</h2>
              <p className="text-sm text-slate-500">Người dùng vừa đăng ký gần đây</p>
            </div>
            <Link to="/admin/customers" className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {stats?.recentCustomers && stats.recentCustomers.length > 0 ? (
              stats.recentCustomers.map((cust: any) => (
                <div key={cust.id} className="flex items-center justify-between p-2.5 rounded-[12px] hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {cust.name ? cust.name.substring(0, 2).toUpperCase() : 'KH'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{cust.name}</p>
                      <p className="text-sm text-slate-500 truncate">{cust.email}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full flex-shrink-0">
                    {cust.ordersCount || 1} đơn hàng
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 py-6 text-center">Chưa có khách hàng nào.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Orders Table */}
      <Card className="p-6 bg-white border-2 border-slate-200 shadow-none rounded-[12px] space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Đơn hàng gần đây</h2>
            <p className="text-sm text-slate-500">Dòng giao dịch mua template theo thời gian thực</p>
          </div>
          <Link to="/admin/orders">
            <Button variant="outline" size="sm" className="gap-1.5 text-indigo-600 font-bold text-sm md:text-base rounded-[12px] shadow-none border-2 border-indigo-600 bg-white hover:bg-indigo-50 [&_svg]:text-indigo-600">
              Xem tất cả đơn hàng <ArrowUpRight className="w-4 h-4 text-indigo-600" />
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-600 text-sm font-bold bg-slate-50/50">
                <th className="py-3.5 px-3">Mã đơn</th>
                <th className="py-3.5 px-3">Khách hàng</th>
                <th className="py-3.5 px-3">Template</th>
                <th className="py-3.5 px-3">Tổng tiền</th>
                <th className="py-3.5 px-3">Trạng thái</th>
                <th className="py-3.5 px-3">Ngày tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                stats.recentOrders.map((ord: any) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-3 font-mono text-sm font-bold text-slate-900">{ord.id}</td>
                    <td className="py-3.5 px-3 font-medium text-slate-700">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{ord.customerName || 'Khách hàng'}</p>
                        <p className="text-sm text-slate-500">{ord.customerEmail}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-800 text-sm">{ord.templateName || 'Template'}</td>
                    <td className="py-3.5 px-3 font-bold text-slate-900 text-sm">{formatCurrency(ord.amount)}</td>
                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold ${
                        ord.status === 'paid' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : ord.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {ord.status === 'paid' ? 'ĐÃ THANH TOÁN' : ord.status === 'pending' ? 'CHỜ XỬ LÝ' : ord.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-sm text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(ord.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">Chưa ghi nhận đơn hàng nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
