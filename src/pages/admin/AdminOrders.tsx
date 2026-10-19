import { useState, useEffect } from 'react';
import { api } from '@/src/services/api';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Loading } from '@/src/components/ui/Loading';
import { 
  ShoppingBag, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  AlertCircle,
  Eye,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getOrders();
      setOrders(data);
    } catch (e) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.admin.updateOrderStatus(id, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
      if (selectedOrder?.id === id) {
        setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      (o.customerName && o.customerName.toLowerCase().includes(search.toLowerCase())) ||
      (o.customerEmail && o.customerEmail.toLowerCase().includes(search.toLowerCase())) ||
      (o.templateName && o.templateName.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-4 h-4" /> ĐÃ THANH TOÁN</span>;
      case 'pending':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-amber-100 text-amber-800"><Clock className="w-4 h-4" /> CHỜ THANH TOÁN</span>;
      case 'failed':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-800"><XCircle className="w-4 h-4" /> THẤT BẠI</span>;
      case 'refunded':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-purple-100 text-purple-800"><RefreshCw className="w-4 h-4" /> HOÀN TIỀN</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-slate-100 text-slate-700">{status.toUpperCase()}</span>;
    }
  };

  const statusLabels: Record<string, string> = {
    all: 'Tất cả',
    paid: 'Đã thanh toán',
    pending: 'Chờ xử lý',
    refunded: 'Hoàn tiền',
    failed: 'Thất bại'
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Đơn hàng & Hóa đơn</h1>
        <p className="text-slate-500 text-sm font-medium mt-1">Kiểm tra lịch sử mua sắm, trạng thái thanh toán và xác thực giao dịch.</p>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-white border-2 border-slate-200 shadow-none rounded-[12px] flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input 
            placeholder="Tìm theo Mã đơn, tên khách hàng, email hoặc template..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 w-full text-sm md:text-base rounded-[12px] border-2 border-slate-200 shadow-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {['all', 'paid', 'pending', 'refunded', 'failed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-[12px] text-sm md:text-base font-bold transition-colors whitespace-nowrap ${
                statusFilter === st 
                  ? 'bg-slate-900 text-white border-2 border-slate-900 shadow-[0_2px_3px_0_rgba(0,0,0,0.25)]' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-2 border-slate-200'
              }`}
            >
              {statusLabels[st] || st}
            </button>
          ))}
        </div>
      </Card>

      {/* Orders Table */}
      <Card className="bg-white border-2 border-slate-200 shadow-none rounded-[12px] overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center"><Loading /></div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm font-medium">Không tìm thấy đơn hàng nào phù hợp bộ lọc.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-slate-100 bg-slate-50/50 text-slate-600 text-sm font-bold">
                  <th className="py-3.5 px-4">Mã đơn</th>
                  <th className="py-3.5 px-4">Khách hàng</th>
                  <th className="py-3.5 px-4">Template</th>
                  <th className="py-3.5 px-4">Số tiền</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4">Thời gian tạo</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-sm text-slate-900">{ord.id}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 text-sm">{ord.customerName || 'Khách hàng'}</p>
                      <p className="text-sm text-slate-500">{ord.customerEmail}</p>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 text-sm">{ord.templateName || 'Portfolio'}</td>
                    <td className="py-3.5 px-4 font-black text-slate-900 text-sm">${ord.amount}</td>
                    <td className="py-3.5 px-4">{getStatusBadge(ord.status)}</td>
                    <td className="py-3.5 px-4 text-sm text-slate-500">
                      {new Date(ord.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setSelectedOrder(ord)}
                          className="h-9 px-3 text-sm md:text-base gap-1.5 font-bold rounded-[12px] shadow-none border-2 border-indigo-600 bg-white hover:bg-indigo-50 text-indigo-600 [&_svg]:text-indigo-600"
                        >
                          <Eye className="w-4 h-4 text-indigo-600" /> Chi tiết
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-[12px] border-2 border-slate-200 shadow-none w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b-2 border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Đơn hàng: {selectedOrder.id}</h3>
                <p className="text-sm text-slate-500">{new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-700 p-1 text-sm font-bold">✕</button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-[12px] border-2 border-slate-200 bg-slate-50 text-sm">
                <div>
                  <span className="text-slate-500 font-semibold block">Tên khách hàng</span>
                  <span className="font-bold text-slate-800">{selectedOrder.customerName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Email</span>
                  <span className="font-bold text-slate-800">{selectedOrder.customerEmail}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Template</span>
                  <span className="font-bold text-slate-800">{selectedOrder.templateName}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Tổng thanh toán</span>
                  <span className="font-bold text-emerald-600">${selectedOrder.amount} USD</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase mb-2">Cập nhật / Ghi đè trạng thái</label>
                <div className="flex flex-wrap gap-2">
                  {['paid', 'pending', 'refunded', 'failed', 'cancelled'].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(selectedOrder.id, st)}
                      className={`px-3.5 py-1.5 rounded-[12px] text-sm md:text-base font-bold transition-colors ${
                        selectedOrder.status === st
                          ? 'bg-indigo-600 text-white border-2 border-indigo-600 shadow-[0_2px_3px_0_rgba(0,0,0,0.25)] [&_svg]:text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-2 border-slate-200'
                      }`}
                    >
                      {statusLabels[st] || st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase mb-1.5">Dữ liệu thô (JSON)</label>
                <pre className="p-3.5 bg-slate-900 text-emerald-400 rounded-[12px] text-sm font-mono overflow-x-auto border-2 border-slate-800">
                  {JSON.stringify(selectedOrder, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
