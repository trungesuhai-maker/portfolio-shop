import { useState, useEffect } from 'react';
import { api } from '@/src/services/api';
import { Card } from '@/src/components/ui/Card';
import { Loading } from '@/src/components/ui/Loading';
import { ScrollText, Terminal, Shield, RefreshCw } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { toast } from 'sonner';

export default function AdminLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getLogs();
      setLogs(data);
    } catch (e) {
      toast.error('Không thể tải nhật ký hệ thống');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const getActionColor = (action: string) => {
    if (action.includes('PAYMENT') || action.includes('PAID')) return 'text-emerald-400';
    if (action.includes('ERROR') || action.includes('FAIL')) return 'text-red-400';
    if (action.includes('PROVISION') || action.includes('CREATE')) return 'text-blue-400';
    return 'text-amber-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Nhật ký Hệ thống & Kiểm toán (Audit Logs)</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Dòng sự kiện thời gian thực ghi nhận mua hàng, xác thực webhook thanh toán và khởi tạo Portfolio.</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadLogs} className="gap-2 text-sm md:text-base font-bold rounded-[12px] shadow-none border-2 border-indigo-600 bg-white hover:bg-indigo-50 text-indigo-600 [&_svg]:text-indigo-600">
          <RefreshCw className="w-4 h-4 text-indigo-600" /> Làm mới dòng dữ liệu
        </Button>
      </div>

      <Card className="bg-slate-950 border-2 border-slate-800 rounded-[12px] p-6 shadow-none text-slate-300 font-mono text-sm">
        <div className="flex items-center justify-between pb-4 border-b-2 border-slate-800 mb-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-white text-base">Dòng sự kiện hệ thống (Event Stream)</span>
          </div>
          <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" /> Trực tiếp (Live)
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center text-slate-400"><Loading /></div>
        ) : logs.length === 0 ? (
          <p className="text-slate-600 py-10 text-center text-sm font-medium">Chưa có nhật ký kiểm toán nào được ghi nhận.</p>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {logs.map((log) => (
              <div key={log.id} className="p-3.5 rounded-[12px] bg-slate-900/80 border-2 border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-slate-700 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`font-bold ${getActionColor(log.action)}`}>[{log.action}]</span>
                    <span className="text-white font-semibold">{log.message || log.details}</span>
                  </div>
                  <p className="text-sm text-slate-400">Tác nhân: {log.actor || 'hệ thống'} • Đối tượng: {log.target || 'N/A'}</p>
                </div>
                <div className="text-right text-sm text-slate-400 font-mono whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString('vi-VN')}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
