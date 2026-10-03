import { useState, useEffect } from 'react';
import { api } from '@/src/services/api';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Loading } from '@/src/components/ui/Loading';
import { Users, Search, Mail, ShieldCheck, ShieldAlert, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getCustomers();
      setCustomers(data);
    } catch (e) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await api.admin.updateCustomerStatus(id, newStatus);
      toast.success(`Trạng thái khách hàng chuyển thành: ${newStatus === 'active' ? 'Đang hoạt động' : 'Tạm khóa'}`);
      setCustomers(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    } catch (e) {
      toast.error('Không thể cập nhật trạng thái khách hàng');
    }
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Danh sách Khách hàng</h1>
        <p className="text-slate-500 text-sm font-medium mt-1">Quản lý người mua đã đăng ký, lịch sử chi tiêu và quyền truy cập tài khoản.</p>
      </div>

      <Card className="p-4 bg-white border-2 border-slate-200 shadow-none rounded-[12px] flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 ml-1 flex-shrink-0" />
        <Input 
          placeholder="Tìm theo tên hoặc email khách hàng..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-0 shadow-none focus-visible:ring-0 px-2 h-11 text-sm md:text-base font-medium"
        />
      </Card>

      <Card className="bg-white border-2 border-slate-200 shadow-none rounded-[12px] overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center"><Loading /></div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-slate-100 bg-slate-50/50 text-slate-600 text-sm font-bold">
                <th className="py-3.5 px-4">Khách hàng</th>
                <th className="py-3.5 px-4">Vai trò</th>
                <th className="py-3.5 px-4">Đơn hàng</th>
                <th className="py-3.5 px-4">Tổng chi tiêu</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4">Ngày tham gia</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center border-2 border-slate-200">
                        {c.name ? c.name.substring(0, 2).toUpperCase() : 'KH'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{c.name}</p>
                        <p className="text-sm text-slate-500 font-medium">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-sm font-mono font-semibold uppercase px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                      {c.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900 text-sm">
                    {c.ordersCount || 1} đơn
                  </td>
                  <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                    ${c.totalSpent || 49}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${
                      c.status === 'active' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {c.status === 'active' ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                      {c.status === 'active' ? 'HOẠT ĐỘNG' : 'TẠM KHÓA'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-sm text-slate-500">
                    {new Date(c.createdAt || Date.now()).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleStatus(c.id, c.status || 'active')}
                      className="h-9 text-sm md:text-base font-bold px-3 rounded-[12px] shadow-none border-2 border-indigo-600 bg-white hover:bg-indigo-50 text-indigo-600 [&_svg]:text-indigo-600"
                    >
                      {c.status === 'active' ? 'Tạm khóa' : 'Mở khóa'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
