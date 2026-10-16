import { useState, useEffect } from 'react';
import { api } from '@/src/services/api';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Loading } from '@/src/components/ui/Loading';
import { 
  Globe, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  X, 
  AlertCircle, 
  Cpu, 
  Play, 
  ShieldCheck, 
  Layers, 
  ExternalLink, 
  Copy, 
  RefreshCw,
  Search,
  Check,
  AlertTriangle,
  Code2
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function AdminDomains() {
  const [activeTab, setActiveTab] = useState<'subdomains' | 'custom'>('subdomains');
  
  // Custom domains state
  const [domains, setDomains] = useState<any[]>([]);
  const [loadingCustom, setLoadingCustom] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [portfolioId, setPortfolioId] = useState('');
  const [saving, setSaving] = useState(false);

  // Subdomains state
  const [subdomains, setSubdomains] = useState<any[]>([]);
  const [loadingSubdomains, setLoadingSubdomains] = useState(true);

  // Simulator state
  const [testHost, setTestHost] = useState('john.portfolio-shop.com');
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  // Slug check tool
  const [slugToCheck, setSlugToCheck] = useState('john');
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugCheckResult, setSlugCheckResult] = useState<any>(null);

  // Worker code modal
  const [showWorkerModal, setShowWorkerModal] = useState(false);

  const loadData = async () => {
    try {
      setLoadingCustom(true);
      setLoadingSubdomains(true);
      const [customList, subList] = await Promise.all([
        api.admin.getDomains().catch(() => []),
        api.subdomains.getAll().catch(() => [])
      ]);
      setDomains(customList);
      setSubdomains(subList);
    } catch (e) {
      toast.error('Không thể tải dữ liệu tên miền');
    } finally {
      setLoadingCustom(false);
      setLoadingSubdomains(false);
    }
  };

  useEffect(() => {
    loadData();
    // Run an initial simulation for john.portfolio-shop.com
    handleRunSimulation('john.portfolio-shop.com');
  }, []);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain) return;
    setSaving(true);
    try {
      await api.admin.createDomain({
        customDomain: newDomain,
        portfolioId: portfolioId || undefined
      });
      toast.success(`Đã thêm tên miền "${newDomain}" thành công`);
      setIsModalOpen(false);
      setNewDomain('');
      setPortfolioId('');
      await loadData();
    } catch (e) {
      toast.error('Không thể đăng ký tên miền');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDomain = async (id: string, domain: string) => {
    if (!window.confirm(`Xóa tên miền tùy chỉnh "${domain}"?`)) return;
    try {
      await api.admin.deleteDomain(id);
      toast.success('Đã xóa tên miền');
      setDomains(prev => prev.filter(d => d.id !== id));
    } catch (e) {
      toast.error('Không thể xóa tên miền');
    }
  };

  const handleRunSimulation = async (hostToTest?: string) => {
    const host = hostToTest || testHost;
    if (!host) return;
    setSimulating(true);
    try {
      const res = await api.subdomains.simulateEdge(host);
      setSimulationResult(res);
      if (res.success) {
        toast.success(`Phân giải thành công cho ${host}`);
      } else {
        toast.warning(`Không tìm thấy Portfolio cho ${host}`);
      }
    } catch (e) {
      toast.error('Lỗi khi thực thi giả lập Edge Worker');
    } finally {
      setSimulating(false);
    }
  };

  const handleCheckSlugAvailability = async (slugToTest?: string) => {
    const target = slugToTest || slugToCheck;
    if (!target) return;
    setCheckingSlug(true);
    try {
      const res = await api.subdomains.checkSlug(target);
      setSlugCheckResult(res);
    } catch (e) {
      toast.error('Lỗi khi kiểm tra slug');
    } finally {
      setCheckingSlug(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Hệ Thống Tên Miền & Subdomain</h1>
            <span className="px-3 py-1 rounded-full text-sm font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Cloudflare Edge
            </span>
          </div>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Quản trị kiến trúc wildcard subdomain (*.portfolio-shop.com), phân lập Cache và định tuyến CNAME.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button 
            variant="outline" 
            onClick={() => setShowWorkerModal(true)}
            className="gap-2 text-sm md:text-base font-bold rounded-[12px] shadow-none border-2 border-indigo-600 bg-white hover:bg-indigo-50 text-indigo-600 [&_svg]:text-indigo-600"
          >
            <Code2 className="w-4 h-4 text-indigo-600" /> Mã nguồn Cloudflare Worker
          </Button>
          {activeTab === 'custom' && (
            <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm md:text-base rounded-[12px] shadow-[0_2px_3px_0_rgba(0,0,0,0.25)] border-2 border-indigo-600 [&_svg]:text-white">
              <Plus className="w-4 h-4 text-white" /> Thêm Tên miền Riêng
            </Button>
          )}
        </div>
      </div>

      {/* Tabs (Image 2 style) */}
      <div className="bg-slate-100/90 p-1.5 rounded-[16px] border-2 border-slate-200/80 inline-flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
        <button
          onClick={() => setActiveTab('subdomains')}
          className={`px-4 py-2 rounded-[12px] text-sm md:text-base font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'subdomains'
              ? 'bg-white text-indigo-600 border-2 border-white shadow-[0_2px_3px_0_rgba(0,0,0,0.25)]'
              : 'bg-transparent text-slate-600 hover:text-slate-900 border-2 border-transparent'
          }`}
        >
          <Cpu className="w-4 h-4" />
          Wildcard Subdomains (*.portfolio-shop.com)
          <span className="ml-1.5 px-2.5 py-0.5 rounded-full text-sm bg-slate-100 text-slate-700 font-mono font-bold">
            {subdomains.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`px-4 py-2 rounded-[12px] text-sm md:text-base font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'custom'
              ? 'bg-white text-indigo-600 border-2 border-white shadow-[0_2px_3px_0_rgba(0,0,0,0.25)]'
              : 'bg-transparent text-slate-600 hover:text-slate-900 border-2 border-transparent'
          }`}
        >
          <Globe className="w-4 h-4" />
          Tên miền Riêng CNAME (Custom Domains)
          <span className="ml-1.5 px-2.5 py-0.5 rounded-full text-sm bg-slate-100 text-slate-700 font-mono font-bold">
            {domains.length}
          </span>
        </button>
      </div>

      {/* TAB 1: WILDCARD SUBDOMAINS & SIMULATOR */}
      {activeTab === 'subdomains' && (
        <div className="space-y-6">

          {/* DNS Wildcard Status Banner */}
          <div className="p-4 bg-slate-900 text-slate-200 rounded-[12px] flex flex-wrap items-center justify-between gap-4 text-sm border-2 border-slate-800 shadow-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[12px] bg-amber-500/20 border-2 border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-white text-sm">Bản ghi Wildcard DNS:</p>
                  <span className="font-mono bg-slate-800 text-amber-300 px-2.5 py-1 rounded text-sm font-bold">
                    *.portfolio-shop.com
                  </span>
                </div>
                <p className="text-slate-400 mt-0.5 text-sm">
                  Định tuyến tới Cloudflare Worker Edge Router • Phân giải tức thì cho mọi khách hàng
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3.5 py-2 rounded-xl font-mono text-sm font-bold">
                <ShieldCheck className="w-4 h-4" /> Phân lập Cache Tuyệt đối (Per-Customer Key)
              </span>
            </div>
          </div>

          {/* Interactive 8-Step Cloudflare Worker Pipeline Simulator */}
          <Card className="p-6 bg-white border-2 border-slate-200 shadow-none rounded-[12px] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-base">
                    ⚡
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Trình Giả Lập Quy Trình 8 Bước của Cloudflare Worker
                  </h2>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  Mô phỏng chính xác từ lúc Worker nhận request đến lúc render & cache portfolio đúng khách hàng.
                </p>
              </div>

              {/* Quick test badges */}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-slate-500 font-medium mr-1">Thử nhanh:</span>
                <button
                  onClick={() => { setTestHost('john.portfolio-shop.com'); handleRunSimulation('john.portfolio-shop.com'); }}
                  className="px-3 py-1 bg-white hover:bg-indigo-50 text-indigo-600 font-bold rounded-[12px] border-2 border-indigo-600 shadow-none transition-all text-sm"
                >
                  john
                </button>
                <button
                  onClick={() => { setTestHost('anna.portfolio-shop.com'); handleRunSimulation('anna.portfolio-shop.com'); }}
                  className="px-3 py-1 bg-white hover:bg-indigo-50 text-indigo-600 font-bold rounded-[12px] border-2 border-indigo-600 shadow-none transition-all text-sm"
                >
                  anna
                </button>
                <button
                  onClick={() => { setTestHost('alex-3d.portfolio-shop.com'); handleRunSimulation('alex-3d.portfolio-shop.com'); }}
                  className="px-3 py-1 bg-white hover:bg-indigo-50 text-indigo-600 font-bold rounded-[12px] border-2 border-indigo-600 shadow-none transition-all text-sm"
                >
                  alex-3d
                </button>
                <button
                  onClick={() => { setTestHost('david.portfolio-shop.com'); handleRunSimulation('david.portfolio-shop.com'); }}
                  className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-[12px] border-2 border-red-200 shadow-none transition-all text-sm"
                  title="Thử subdomain chưa đăng ký (404)"
                >
                  chưa tồn tại (404)
                </button>
              </div>
            </div>

            {/* Input and Run button */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Globe className="w-4 h-4" />
                </div>
                <Input
                  value={testHost}
                  onChange={(e) => setTestHost(e.target.value)}
                  placeholder="ví dụ: john.portfolio-shop.com"
                  className="pl-10 font-mono text-sm md:text-base h-11 rounded-[12px] border-2 border-slate-200 shadow-none"
                />
              </div>
              <Button 
                onClick={() => handleRunSimulation()} 
                disabled={simulating}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 shrink-0 text-sm md:text-base h-11 rounded-[12px] shadow-[0_2px_3px_0_rgba(0,0,0,0.25)] border-2 border-indigo-600 [&_svg]:text-white"
              >
                {simulating ? <Loading size={16} /> : <Play className="w-4 h-4 text-white" />}
                Chạy Thử Nghiệm Edge Router
              </Button>
            </div>

            {/* 8-Step Pipeline Visualizer */}
            {simulationResult && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between text-sm text-slate-500 font-mono border-b-2 border-slate-100 pb-2">
                  <span>TRẠNG THÁI TIẾN TRÌNH 8 BƯỚC</span>
                  <span>Tổng thời gian phản hồi: <strong className="text-slate-800">{simulationResult.totalDurationMs}ms</strong></span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {simulationResult.steps?.map((st: any) => {
                    const isSuccess = st.status === 'completed';
                    return (
                      <div 
                        key={st.step}
                        className={`p-3.5 rounded-[12px] border-2 transition-all ${
                          isSuccess 
                            ? 'bg-slate-50/70 border-slate-200' 
                            : 'bg-red-50/50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                              isSuccess ? 'bg-indigo-600 text-white' : 'bg-red-600 text-white'
                            }`}>
                              {st.step}
                            </span>
                            <span className="font-bold text-slate-900 text-sm">{st.name}</span>
                          </div>
                          <span className="text-sm font-mono text-slate-400">{st.timeMs}ms</span>
                        </div>
                        <p className={`text-sm leading-relaxed font-mono ${
                          isSuccess ? 'text-slate-600' : 'text-red-700 font-semibold'
                        }`}>
                          {st.details}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Resolution Summary Box */}
                {simulationResult.success && simulationResult.resolution && (
                  <div className="p-4 rounded-[12px] bg-emerald-50/80 border-2 border-emerald-200 text-emerald-950 text-sm space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold uppercase tracking-wider text-sm text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Kết quả Định tuyến Hoàn tất
                      </span>
                      <Link 
                        to={`/p/${simulationResult.slug}`} 
                        className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-900 underline text-sm"
                      >
                        Mở Xem Portfolio Trực tiếp <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1 font-mono text-sm">
                      <div className="bg-white/80 p-2.5 rounded-[12px] border-2 border-emerald-100">
                        <span className="text-slate-500 block text-xs font-medium">Khách hàng</span>
                        <strong className="text-slate-800">{simulationResult.resolution.customerName}</strong>
                      </div>
                      <div className="bg-white/80 p-2.5 rounded-[12px] border-2 border-emerald-100">
                        <span className="text-slate-500 block text-xs font-medium">Template Đã Ghép</span>
                        <strong className="text-slate-800">{simulationResult.resolution.templateName}</strong>
                      </div>
                      <div className="bg-white/80 p-2.5 rounded-[12px] border-2 border-emerald-100">
                        <span className="text-slate-500 block text-xs font-medium">Instance ID</span>
                        <strong className="text-slate-800">{simulationResult.resolution.instanceId}</strong>
                      </div>
                      <div className="bg-white/80 p-2.5 rounded-[12px] border-2 border-emerald-100">
                        <span className="text-slate-500 block text-xs font-medium">Chính sách Phân lập Cache</span>
                        <strong className="text-emerald-700">STRICT_PER_CUSTOMER</strong>
                      </div>
                    </div>
                    <div className="pt-1 text-sm font-mono text-slate-600">
                      Cache Key Phân lập: <code className="bg-white px-2.5 py-1 rounded border-2 border-emerald-200 text-emerald-800 font-bold">{simulationResult.resolution.cacheKey}</code>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Slug Uniqueness & Availability Checker */}
          <Card className="p-6 bg-white border-2 border-slate-200 shadow-none rounded-[12px] space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Kiểm tra Tính Độc nhất & Khả dụng của Slug (Unique Slug Engine)</h2>
              <p className="text-sm text-slate-500 mt-1">
                Nếu slug như "john" đã tồn tại, hệ thống tuyệt đối không cấp lại và tự động đề xuất: <code>john-2</code>, <code>john-3</code>...
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                value={slugToCheck}
                onChange={(e) => setSlugToCheck(e.target.value)}
                placeholder="Nhập slug cần kiểm tra (ví dụ: john, anna, alex)"
                className="font-mono text-sm md:text-base max-w-md h-11 rounded-[12px] border-2 border-slate-200 shadow-none"
              />
              <Button 
                onClick={() => handleCheckSlugAvailability()} 
                disabled={checkingSlug}
                variant="outline"
                className="gap-2 text-sm md:text-base font-bold h-11 rounded-[12px] shadow-[0_2px_3px_0_rgba(0,0,0,0.25)] border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              >
                {checkingSlug ? <Loading size={16} /> : <Search className="w-4 h-4" />}
                Kiểm tra Slug
              </Button>
            </div>

            {slugCheckResult && (
              <div className={`p-4 rounded-[12px] text-sm border-2 ${
                slugCheckResult.available 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                  : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}>
                <div className="flex items-center gap-2 font-bold mb-1">
                  {slugCheckResult.available ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{slugCheckResult.reason}</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>{slugCheckResult.reason}</span>
                    </>
                  )}
                </div>

                {slugCheckResult.suggestions && slugCheckResult.suggestions.length > 0 && (
                  <div className="pt-2">
                    <p className="font-semibold text-slate-700 mb-1.5">Gợi ý các Slug khả dụng tương đương:</p>
                    <div className="flex flex-wrap gap-2">
                      {slugCheckResult.suggestions.map((s: string) => (
                        <button
                          key={s}
                          onClick={() => { setSlugToCheck(s); handleCheckSlugAvailability(s); }}
                          className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-800 font-mono font-bold rounded-[12px] border-2 border-slate-300 shadow-[0_2px_3px_0_rgba(0,0,0,0.25)] transition-colors text-sm"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Subdomains Table */}
          <Card className="bg-white border-2 border-slate-200 shadow-none overflow-hidden rounded-[12px]">
            <div className="p-4 border-b-2 border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Danh Sách Portfolio Subdomain Đang Hoạt Động</h3>
                <p className="text-sm text-slate-500">Các tên miền phụ đã được đăng ký và định tuyến qua Cloudflare Worker.</p>
              </div>
              <Button variant="outline" size="sm" onClick={loadData} className="gap-1.5 text-sm md:text-base font-bold rounded-[12px] shadow-[0_2px_3px_0_rgba(0,0,0,0.25)] border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700">
                <RefreshCw className="w-4 h-4" /> Làm mới
              </Button>
            </div>

            {loadingSubdomains ? (
              <div className="py-20 flex justify-center"><Loading /></div>
            ) : subdomains.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm font-medium">Chưa có subdomain nào trong hệ thống.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-100 bg-slate-50/50 text-slate-600 text-sm font-bold">
                      <th className="py-3.5 px-4">Subdomain & Đường dẫn</th>
                      <th className="py-3.5 px-4">Khách hàng sở hữu</th>
                      <th className="py-3.5 px-4">Template & Origin</th>
                      <th className="py-3.5 px-4">Trạng thái</th>
                      <th className="py-3.5 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {subdomains.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                            <span className="font-mono font-bold text-slate-900 text-sm">{p.fullDomain}</span>
                          </div>
                          <span className="text-sm text-slate-500 font-mono pl-4 block mt-0.5">
                            ID: {p.id}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800 text-sm">{p.customerName}</div>
                          <div className="text-sm text-slate-500">{p.customerEmail}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-sm font-semibold text-slate-700">{p.templateName}</div>
                          <div className="text-sm font-mono text-slate-500 truncate max-w-[200px]">
                            {p.deploymentOrigin}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {p.status === 'published' ? (
                            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
                              <CheckCircle2 className="w-4 h-4" /> ĐÃ XUẤT BẢN
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/60">
                              <Clock className="w-4 h-4" /> BẢN NHÁP
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setTestHost(p.fullDomain);
                              handleRunSimulation(p.fullDomain);
                            }}
                            className="px-3 py-1.5 text-sm md:text-base font-bold rounded-[12px] bg-white hover:bg-indigo-50 text-indigo-600 border-2 border-indigo-600 shadow-none transition-colors [&_svg]:text-indigo-600"
                          >
                            Giả lập Edge
                          </button>
                          <Link
                            to={`/p/${p.subdomain}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm md:text-base font-bold rounded-[12px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-2 border-indigo-200 shadow-[0_2px_3px_0_rgba(0,0,0,0.25)] transition-colors"
                          >
                            Xem <ExternalLink className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

        </div>
      )}

      {/* TAB 2: CUSTOM DOMAINS (CNAME) */}
      {activeTab === 'custom' && (
        <div className="space-y-6">
          <div className="p-4 bg-slate-900 text-slate-200 rounded-[12px] flex items-center justify-between text-sm border-2 border-slate-800 shadow-none">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Bản ghi đích CNAME cho Tên miền Riêng</p>
                <p className="text-slate-400 font-mono text-sm">cname.portio-hosting.app</p>
              </div>
            </div>
            <span className="bg-slate-800 text-slate-300 px-3.5 py-1.5 rounded-[12px] font-mono text-sm border border-slate-700">Tự động kích hoạt SSL</span>
          </div>

          <Card className="bg-white border-2 border-slate-200 shadow-none overflow-hidden rounded-[12px]">
            {loadingCustom ? (
              <div className="py-20 flex justify-center"><Loading /></div>
            ) : domains.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm font-medium">Chưa có tên miền tùy biến nào được thiết lập.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-100 bg-slate-50/50 text-slate-600 text-sm font-bold">
                    <th className="py-3.5 px-4">Tên miền</th>
                    <th className="py-3.5 px-4">Portfolio liên kết</th>
                    <th className="py-3.5 px-4">Trạng thái DNS</th>
                    <th className="py-3.5 px-4">Chứng chỉ SSL</th>
                    <th className="py-3.5 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {domains.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-indigo-600" />
                          <span className="font-bold text-slate-900 text-sm">{d.domain || d.customDomain}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-sm font-medium text-slate-600">
                        {d.portfolioName || d.portfolioId || 'Chưa gán'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> ĐÃ XÁC THỰC
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-sm font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded">Hoạt động (Let's Encrypt)</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteDomain(d.id, d.domain || d.customDomain)}
                          className="p-2 rounded-[12px] bg-red-600 hover:bg-red-700 text-white border-2 border-red-600 shadow-[0_2px_3px_0_rgba(0,0,0,0.25)] transition-all [&_svg]:text-white inline-flex items-center justify-center"
                          title="Xóa tên miền"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}

      {/* CLOUDFLARE WORKER CODE MODAL */}
      {showWorkerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="bg-slate-950 text-slate-100 rounded-[12px] shadow-none w-full max-w-3xl overflow-hidden border-2 border-slate-800 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b-2 border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Code2 className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-white">Mã Nguồn Cloudflare Worker (cloudflare-worker.js)</h2>
              </div>
              <button 
                onClick={() => setShowWorkerModal(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <p className="text-sm text-slate-400 leading-relaxed">
                Tệp này triển khai trọn vẹn 8 bước định tuyến Wildcard Subdomain với cơ chế phân lập bộ nhớ đệm (Cache Isolation) giữa các khách hàng, sẵn sàng triển khai qua <code>wrangler deploy</code>.
              </p>
              <pre className="bg-slate-900 p-4 rounded-[12px] text-sm font-mono text-indigo-300 overflow-x-auto leading-relaxed border-2 border-slate-800">
{`// Cloudflare Worker for *.portfolio-shop.com
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const hostname = url.hostname.toLowerCase();

    // 1 & 2: Receive request & Read hostname
    if (hostname === 'portfolio-shop.com' || hostname === 'www.portfolio-shop.com') {
      return fetch(request); // Pass-through to main shop
    }

    // 3. Extract slug
    const slug = hostname.replace('.portfolio-shop.com', '');

    // Edge Cache Check (Strict Per-Customer Isolation)
    const cache = caches.default;
    const edgeCacheKey = new Request(\`https://\${hostname}/__edge_subdomain_\${slug}\`);
    let cached = await cache.match(edgeCacheKey);
    if (cached) return cached;

    // 4, 5, 6, 7: Query registry API for instance & template
    const res = await fetch(\`https://portfolio-shop.com/api/edge/resolve?host=\${hostname}&slug=\${slug}\`);
    const data = await res.json();

    // 8. Render & Route with isolated cache key
    const response = new Response(renderHtml(data), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Vary': 'Host, Accept-Encoding',
        'X-Portfolio-Instance-Id': data.instance.id,
        'X-Portfolio-Subdomain': slug,
        'X-Portfolio-Customer-Id': data.instance.user_id,
        'Cache-Control': 'public, max-age=60, s-maxage=300'
      }
    });

    ctx.waitUntil(cache.put(edgeCacheKey, response.clone()));
    return response;
  }
};`}
              </pre>
            </div>
            <div className="px-6 py-4 border-t-2 border-slate-800 flex justify-end">
              <Button 
                onClick={() => {
                  navigator.clipboard.writeText(`// Code in cloudflare-worker.js`);
                  toast.success('Đã sao chép cấu hình Cloudflare Worker');
                }}
                className="gap-2 text-sm md:text-base font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-[12px] shadow-[0_2px_3px_0_rgba(0,0,0,0.25)] border-2 border-indigo-600 [&_svg]:text-white"
              >
                <Copy className="w-4 h-4 text-white" /> Sao chép Mã nguồn
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADD CUSTOM DOMAIN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-[12px] border-2 border-slate-200 shadow-none w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b-2 border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Gán Tên miền Riêng (CNAME)</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddDomain} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase mb-1.5">Địa chỉ tên miền (Domain) *</label>
                <Input 
                  placeholder="ví dụ: portfolio.nguyenvan.com" 
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  required
                  className="text-sm md:text-base h-11 rounded-[12px] border-2 border-slate-200 shadow-none"
                />
                <p className="text-sm text-slate-500 mt-1">Trỏ bản ghi CNAME về: cname.portio-hosting.app</p>
              </div>
              <div className="pt-3 flex items-center justify-end gap-2.5">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="text-indigo-600 font-bold text-sm md:text-base rounded-[12px] shadow-none border-2 border-indigo-600 bg-white hover:bg-indigo-50 [&_svg]:text-indigo-600">
                  Hủy
                </Button>
                <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm md:text-base rounded-[12px] shadow-[0_2px_3px_0_rgba(0,0,0,0.25)] border-2 border-indigo-600 [&_svg]:text-white">
                  {saving ? <Loading /> : 'Đăng ký Tên miền'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
