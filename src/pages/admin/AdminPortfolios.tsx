import { useState, useEffect } from 'react';
import { api } from '@/src/services/api';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Loading } from '@/src/components/ui/Loading';
import { FileCode2, Search, Globe, Eye, EyeOff, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPortfolios() {
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadPortfolios = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getPortfolios();
      setPortfolios(data);
    } catch (e) {
      toast.error('Failed to load portfolio instances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolios();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    try {
      await api.admin.updatePortfolioStatus(id, newStatus);
      toast.success(`Trạng thái portfolio chuyển thành: ${newStatus === 'published' ? 'Đã xuất bản' : 'Bản nháp'}`);
      setPortfolios(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    } catch (e) {
      toast.error('Không thể cập nhật trạng thái portfolio');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Xóa bản portfolio "${name}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await api.admin.deletePortfolio(id);
      toast.success('Đã xóa bản portfolio');
      setPortfolios(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      toast.error('Không thể xóa bản portfolio');
    }
  };

  const filtered = portfolios.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase()) ||
    (p.customDomain && p.customDomain.toLowerCase().includes(search.toLowerCase())) ||
    (p.userEmail && p.userEmail.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Các bản Portfolio Khách hàng</h1>
        <p className="text-slate-500 text-sm font-medium mt-1">Danh sách website cá nhân trực tiếp được tạo từ các template đã mua.</p>
      </div>

      <Card className="p-4 bg-white border-2 border-slate-200 shadow-none rounded-[12px] flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 ml-1 flex-shrink-0" />
        <Input 
          placeholder="Tìm theo tên trang, slug, tên miền, email khách hàng..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-0 shadow-none focus-visible:ring-0 px-2 h-11 text-sm md:text-base font-medium"
        />
      </Card>

      <Card className="bg-white border-2 border-slate-200 shadow-none rounded-[12px] overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center"><Loading /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-slate-100 bg-slate-50/50 text-slate-600 text-sm font-bold">
                  <th className="py-3.5 px-4">Tên Portfolio</th>
                  <th className="py-3.5 px-4">Khách hàng</th>
                  <th className="py-3.5 px-4">Tên miền / Đường dẫn</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4">Cập nhật cuối</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((inst) => (
                  <tr key={inst.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[12px] bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm border-2 border-indigo-100">
                          <FileCode2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{inst.name}</p>
                          <p className="text-sm text-slate-500 font-mono">Mẫu: {inst.templateId || 'Tiêu chuẩn'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-sm font-semibold text-slate-800">{inst.userName || 'Khách hàng'}</p>
                      <p className="text-sm text-slate-500">{inst.userEmail}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <a 
                        href={`/p/${inst.subdomain || inst.slug}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono text-sm font-bold text-indigo-600 hover:text-indigo-700"
                      >
                        <Globe className="w-4 h-4 text-indigo-500" />
                        <span>{inst.subdomain || inst.slug}.portfolio-shop.com</span>
                      </a>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
                        inst.status === 'published' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {inst.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-sm text-slate-500">
                      {new Date(inst.updatedAt || inst.createdAt || Date.now()).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a 
                          href={`/p/${inst.slug}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-2 rounded-[12px] text-indigo-600 bg-white border-2 border-indigo-600 hover:bg-indigo-50 shadow-none transition-all inline-flex items-center justify-center [&_svg]:text-indigo-600"
                          title="Xem trang Portfolio trực tiếp"
                        >
                          <ExternalLink className="w-4 h-4 text-indigo-600" />
                        </a>
                        <button
                          onClick={() => handleToggleStatus(inst.id, inst.status)}
                          className="p-2 rounded-[12px] text-indigo-600 bg-white border-2 border-indigo-600 hover:bg-indigo-50 shadow-none transition-all inline-flex items-center justify-center [&_svg]:text-indigo-600"
                          title={inst.status === 'published' ? 'Gỡ xuất bản' : 'Xuất bản trực tiếp'}
                        >
                          {inst.status === 'published' ? <EyeOff className="w-4 h-4 text-amber-600" /> : <Eye className="w-4 h-4 text-emerald-600" />}
                        </button>
                        <button
                          onClick={() => handleDelete(inst.id, inst.name)}
                          className="p-2 rounded-[12px] bg-red-600 hover:bg-red-700 text-white border-2 border-red-600 shadow-[0_2px_3px_0_rgba(0,0,0,0.25)] transition-all [&_svg]:text-white inline-flex items-center justify-center"
                          title="Xóa portfolio"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
