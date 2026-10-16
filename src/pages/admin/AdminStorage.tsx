import { useState, useEffect } from 'react';
import { 
  HardDrive, 
  UploadCloud, 
  Search, 
  Trash2, 
  Copy, 
  ExternalLink, 
  Filter, 
  Image as ImageIcon,
  Check,
  RefreshCw,
  Layers,
  FolderOpen,
  Settings,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  Zap,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Film,
  Sparkles
} from 'lucide-react';
import { api } from '@/src/services/api';
import { StorageFile, StorageCategory } from '@/src/types';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Loading } from '@/src/components/ui/Loading';
import { MediaStorageModal } from '@/src/components/common/MediaStorageModal';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

const CATEGORY_MAP: Record<StorageCategory, { label: string; badge: string; desc: string }> = {
  template_thumbnails: {
    label: 'Template Thumbnails',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    desc: 'Ảnh đại diện chính của các mẫu Template'
  },
  template_gallery: {
    label: 'Template Gallery',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    desc: 'Bộ ảnh showcase chi tiết tính năng Template'
  },
  customer_portfolio: {
    label: 'Customer Portfolio',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    desc: 'Ảnh giao diện các trang Portfolio của khách hàng'
  },
  avatar: {
    label: 'Avatar / Chân dung',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    desc: 'Ảnh hồ sơ cá nhân và nhà sáng tạo'
  },
  cover: {
    label: 'Cover / Banner',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    desc: 'Ảnh bìa banner khổ rộng toàn cảnh'
  },
  project_images: {
    label: 'Project Images',
    badge: 'bg-pink-50 text-pink-700 border-pink-200',
    desc: 'Ảnh các sản phẩm, case study dự án'
  }
};

export default function AdminStorage() {
  const [activeCategory, setActiveCategory] = useState<StorageCategory | 'all'>('all');
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<StorageFile | null>(null);

  // Cloudflare R2 ENV Settings State
  const [isR2ConfigOpen, setIsR2ConfigOpen] = useState(false);
  const [r2Loading, setR2Loading] = useState(false);
  const [r2Testing, setR2Testing] = useState(false);
  const [r2Status, setR2Status] = useState<'connected' | 'untested' | 'error'>('untested');
  const [r2StatusMsg, setR2StatusMsg] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const [r2Form, setR2Form] = useState({
    accountId: 'e0bcb733e66267078c856eedf49403ee',
    accessKeyId: '',
    secretAccessKey: '',
    bucketName: 'portfolio-shop',
    tokenName: 'shopportfolio-api-token',
    apiToken: '',
    publicDomain: 'https://pub-29924664ae264e00b0bab37f1de06677.r2.dev',
    enabled: true
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [filesData, statsData] = await Promise.all([
        api.storage.listFiles(activeCategory, search),
        api.storage.getStats()
      ]);
      setFiles(filesData);
      setStats(statsData);
    } catch (e) {
      toast.error('Không thể tải dữ liệu Storage');
    } finally {
      setLoading(false);
    }
  };

  const loadR2Config = async () => {
    try {
      const cfg = await api.storage.getR2Config();
      if (cfg) {
        setR2Form(prev => ({
          ...prev,
          accountId: cfg.accountId || prev.accountId,
          accessKeyId: cfg.accessKeyId || prev.accessKeyId,
          secretAccessKey: cfg.secretAccessKey || prev.secretAccessKey,
          bucketName: cfg.bucketName || prev.bucketName,
          tokenName: cfg.tokenName || prev.tokenName,
          apiToken: cfg.apiToken || prev.apiToken,
          publicDomain: cfg.publicDomain || prev.publicDomain,
          enabled: cfg.enabled ?? true
        }));
        if (cfg.accountId && cfg.accessKeyId && cfg.bucketName) {
          setR2Status('connected');
          setR2StatusMsg(`Sẵn sàng kết nối Bucket "${cfg.bucketName}"`);
        }
      }
    } catch (err) {
      console.warn("Could not load R2 config:", err);
    }
  };

  useEffect(() => {
    loadData();
    loadR2Config();
  }, [activeCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleSaveR2Config = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setR2Loading(true);
      const res = await api.storage.updateR2Config(r2Form);
      toast.success(res.message || 'Đã lưu cấu hình Cloudflare R2 ENV thành công!');
      await handleTestR2Connection();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu cấu hình R2');
    } finally {
      setR2Loading(false);
    }
  };

  const handleTestR2Connection = async () => {
    try {
      setR2Testing(true);
      const res = await api.storage.testR2Connection();
      if (res.success) {
        setR2Status('connected');
        setR2StatusMsg(`Kết nối R2 thành công (${res.latencyMs}ms) • Bucket: ${res.bucketName}`);
        toast.success(`⚡ Cloudflare R2 kết nối thành công (${res.latencyMs}ms)! Đã kiểm tra Put/Get/Delete.`);
      } else {
        setR2Status('error');
        setR2StatusMsg(res.error || 'Kiểm tra thất bại');
        toast.error(res.error || 'Kiểm tra kết nối R2 thất bại');
      }
    } catch (err: any) {
      setR2Status('error');
      setR2StatusMsg(err.error || err.message || 'Lỗi kết nối R2');
      toast.error(err.error || 'Không thể kết nối đến Cloudflare R2');
    } finally {
      setR2Testing(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Xác nhận xóa tệp "${name}" khỏi kho lưu trữ?`)) return;
    try {
      await api.storage.delete(id);
      toast.success('Đã xóa tệp thành công');
      setFiles(prev => prev.filter(f => f.id !== id));
      if (previewFile?.id === id) setPreviewFile(null);
      const newStats = await api.storage.getStats();
      setStats(newStats);
    } catch (e) {
      toast.error('Lỗi khi xóa tệp');
    }
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Đã copy đường dẫn CDN vào clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <HardDrive className="w-7 h-7 text-indigo-600" />
            Kho Lưu Trữ Cloudflare R2 & Bộ Nén Không Giảm Chất Lượng
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Tự động nén ảnh/video thông minh (giữ nguyên 100% độ nét), lưu trữ trực tiếp vào Cloudflare R2 Bucket.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            onClick={loadData}
            className="gap-1.5 text-indigo-600 bg-white text-sm font-bold px-3.5 py-2.5 rounded-xl border-2 border-indigo-600 shadow-none hover:bg-indigo-50"
          >
            <RefreshCw className="w-4 h-4 text-indigo-600" /> Làm mới
          </Button>
          <Button
            onClick={() => setIsUploadModalOpen(true)}
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl border-2 border-indigo-600 shadow-sm"
          >
            <UploadCloud className="w-4 h-4 text-white" /> Tải lên tài nguyên mới
          </Button>
        </div>
      </div>

      {/* Cloudflare R2 Storage ENV Configuration Panel */}
      <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/40 via-white to-sky-50/30 rounded-2xl shadow-sm overflow-hidden">
        <div 
          onClick={() => setIsR2ConfigOpen(!isR2ConfigOpen)}
          className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-white/40 transition-colors border-b border-indigo-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Cấu hình Cloudflare R2 Storage (Biến Môi Trường ENV)
                </h2>
                {r2Status === 'connected' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã kết nối R2 Bucket
                  </span>
                ) : r2Status === 'error' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2.5 py-0.5 rounded-full">
                    <AlertCircle className="w-3.5 h-3.5" /> Lỗi kết nối
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    <Zap className="w-3.5 h-3.5" /> Đã nạp Key
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Bucket: <span className="font-mono font-bold text-slate-700">{r2Form.bucketName}</span> • CDN: <span className="font-mono text-indigo-600 font-bold">{r2Form.publicDomain}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleTestR2Connection();
              }}
              disabled={r2Testing}
              className="px-3 py-1.5 bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 text-xs sm:text-sm font-black rounded-xl flex items-center gap-1.5 shadow-none transition-transform active:scale-95"
            >
              <Zap className={`w-3.5 h-3.5 ${r2Testing ? 'animate-spin' : ''}`} />
              {r2Testing ? 'Đang test...' : 'Kiểm tra kết nối R2'}
            </button>
            <div className="p-1 text-slate-400">
              {isR2ConfigOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isR2ConfigOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-5 sm:p-6 bg-white/70 space-y-5"
            >
              <form onSubmit={handleSaveR2Config} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Account ID */}
                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      R2_ACCOUNT_ID (Account ID)
                    </label>
                    <input
                      type="text"
                      value={r2Form.accountId}
                      onChange={(e) => setR2Form({ ...r2Form, accountId: e.target.value })}
                      placeholder="e0bcb733e66267078c856eedf49403ee"
                      className="w-full px-3.5 py-2 text-[14px] placeholder:text-[14px] bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                      required
                    />
                  </div>

                  {/* Bucket Name */}
                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      R2_BUCKET_NAME (Tên Bucket)
                    </label>
                    <input
                      type="text"
                      value={r2Form.bucketName}
                      onChange={(e) => setR2Form({ ...r2Form, bucketName: e.target.value })}
                      placeholder="portfolio-shop"
                      className="w-full px-3.5 py-2 text-[14px] placeholder:text-[14px] bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                      required
                    />
                  </div>

                  {/* Access Key ID */}
                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      R2_ACCESS_KEY_ID (Access Key)
                    </label>
                    <input
                      type="text"
                      value={r2Form.accessKeyId}
                      onChange={(e) => setR2Form({ ...r2Form, accessKeyId: e.target.value })}
                      placeholder="4cdcbdbf8484a2c1dbe5e5191c08fda4"
                      className="w-full px-3.5 py-2 text-[14px] placeholder:text-[14px] bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                      required
                    />
                  </div>

                  {/* Secret Access Key */}
                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      R2_SECRET_ACCESS_KEY (Secret Key)
                    </label>
                    <div className="relative">
                      <input
                        type={showSecret ? 'text' : 'password'}
                        value={r2Form.secretAccessKey}
                        onChange={(e) => setR2Form({ ...r2Form, secretAccessKey: e.target.value })}
                        placeholder="238b2124912a67d68014d72aff40ba6d194ece..."
                        className="w-full pl-3.5 pr-10 py-2 text-[14px] placeholder:text-[14px] bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Public Domain */}
                  <div className="md:col-span-2">
                    <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      R2_PUBLIC_DOMAIN (Đường dẫn Public CDN)
                    </label>
                    <input
                      type="url"
                      value={r2Form.publicDomain}
                      onChange={(e) => setR2Form({ ...r2Form, publicDomain: e.target.value })}
                      placeholder="https://pub-29924664ae264e00b0bab37f1de06677.r2.dev"
                      className="w-full px-3.5 py-2 text-[14px] placeholder:text-[14px] bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                      required
                    />
                    <span className="text-[11px] text-slate-400 font-medium mt-1 block">
                      Các ảnh upload lên sẽ tự động có URL bắt đầu bằng đường dẫn này (ví dụ: {r2Form.publicDomain}/template_thumbnails/image.jpg).
                    </span>
                  </div>

                  {/* Optional: Token Name & API Token */}
                  <div>
                    <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      R2_TOKEN_NAME (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      value={r2Form.tokenName}
                      onChange={(e) => setR2Form({ ...r2Form, tokenName: e.target.value })}
                      placeholder="shopportfolio-api-token"
                      className="w-full px-3.5 py-2 text-[14px] placeholder:text-[14px] bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      R2_API_TOKEN (Tùy chọn)
                    </label>
                    <div className="relative">
                      <input
                        type={showToken ? 'text' : 'password'}
                        value={r2Form.apiToken}
                        onChange={(e) => setR2Form({ ...r2Form, apiToken: e.target.value })}
                        placeholder="cfat_••••••••••••••••••••••••••••••••••••••••"
                        className="w-full pl-3.5 pr-10 py-2 text-[14px] placeholder:text-[14px] bg-slate-50 border border-slate-200 rounded-xl font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Dữ liệu lưu an toàn trên Cloudflare R2 S3 S3-Compatible Storage</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTestR2Connection}
                      disabled={r2Testing}
                      className="border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl text-sm"
                    >
                      <Zap className="w-4 h-4" /> Kiểm tra kết nối R2
                    </Button>
                    <Button
                      type="submit"
                      disabled={r2Loading}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-sm shadow-md"
                    >
                      <Save className="w-4 h-4" /> {r2Loading ? 'Đang lưu...' : 'Lưu cấu hình ENV'}
                    </Button>
                  </div>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3.5">
          <Card className="p-4 bg-white border-2 border-slate-200 shadow-none rounded-xl">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Tệp</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalFiles}</p>
            <span className="text-xs text-indigo-600 font-bold">{stats.r2FilesCount || 0} trên R2 CDN</span>
          </Card>

          <Card className="p-4 bg-emerald-50/70 border-2 border-emerald-200 shadow-none rounded-xl">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-emerald-600" /> Tiết kiệm nén
            </span>
            <p className="text-2xl font-black text-emerald-900 mt-1">{stats.totalSavedMegabytes || '0.00'} MB</p>
            <span className="text-xs text-emerald-700 font-medium">100% Độ nét nguyên bản</span>
          </Card>

          {Object.entries(stats.byCategory || {}).map(([catKey, catVal]: [string, any]) => {
            const info = CATEGORY_MAP[catKey as StorageCategory];
            if (!info) return null;
            return (
              <Card 
                key={catKey}
                onClick={() => setActiveCategory(catKey as StorageCategory)}
                className={`p-4 border-2 transition-all cursor-pointer shadow-none rounded-xl ${
                  activeCategory === catKey
                    ? 'bg-indigo-50/50 border-indigo-500 ring-2 ring-indigo-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="text-xs font-bold text-slate-700 truncate block">{info.label}</span>
                <p className="text-xl font-black text-slate-900 mt-1">{catVal.count} tệp</p>
                <span className="text-xs text-slate-400 font-medium">
                  {(catVal.bytes / 1024).toFixed(0)} KB
                </span>
              </Card>
            );
          })}
        </div>
      )}

      {/* Filter & Search Bar */}
      <Card className="p-4 bg-white border-2 border-slate-200 shadow-none rounded-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="bg-slate-100/90 p-1.5 rounded-xl border-2 border-slate-200/80 inline-flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap text-xs sm:text-sm font-bold ${
                activeCategory === 'all'
                  ? 'bg-white text-slate-900 border-2 border-white shadow-sm'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 border-2 border-transparent'
              }`}
            >
              Tất cả ({stats?.totalFiles || files.length})
            </button>
            {(Object.keys(CATEGORY_MAP) as StorageCategory[]).map((k) => (
              <button
                key={k}
                onClick={() => setActiveCategory(k)}
                className={`px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap text-xs sm:text-sm font-bold ${
                  activeCategory === k
                    ? 'bg-white text-indigo-600 border-2 border-white shadow-sm'
                    : 'bg-transparent text-slate-600 hover:text-slate-900 border-2 border-transparent'
                }`}
              >
                {CATEGORY_MAP[k].label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên tệp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium shadow-none"
            />
          </form>
        </div>
      </Card>

      {/* Files Grid */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400">
          <Loading size={32} />
          <p className="text-sm font-medium mt-3">Đang đồng bộ Storage...</p>
        </div>
      ) : files.length === 0 ? (
        <Card className="p-12 text-center bg-white border-2 border-slate-200 rounded-2xl shadow-none">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">Không tìm thấy tài nguyên</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Chưa có tệp nào được lưu trong nhóm này. Hãy tải lên ảnh hoặc video để phục vụ cho Master Template hoặc Customer Portfolio.
          </p>
          <Button
            onClick={() => setIsUploadModalOpen(true)}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl border-2 border-indigo-600 shadow-sm"
          >
            Tải lên ngay
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {files.map((file) => {
            const catInfo = CATEGORY_MAP[file.category] || CATEGORY_MAP.avatar;
            const isR2 = file.storageProvider === 'cloudflare_r2' || file.url.includes('r2.dev') || file.url.includes('cloudflarestorage');
            const isVideo = file.isVideo || file.mimeType?.startsWith('video/');

            return (
              <Card 
                key={file.id} 
                className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-none transition-all flex flex-col group hover:border-indigo-300 hover:shadow-md"
              >
                {/* Media Preview */}
                <div 
                  className="aspect-video bg-slate-100 relative overflow-hidden cursor-pointer border-b-2 border-slate-200"
                  onClick={() => setPreviewFile(file)}
                >
                  {isVideo ? (
                    file.posterUrl ? (
                      <img src={file.posterUrl} alt={file.name} className="w-full h-full object-cover" />
                    ) : (
                      <video src={file.url} className="w-full h-full object-cover" muted playsInline />
                    )
                  ) : (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  )}
                  
                  {isR2 && (
                    <div className="absolute top-2 right-2 bg-indigo-600/90 backdrop-blur-sm text-white text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                      <Cloud className="w-3 h-3" /> R2 CDN
                    </div>
                  )}

                  {isVideo && (
                    <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                      <Film className="w-3 h-3 text-white" /> Video
                    </div>
                  )}

                  {file.reductionPercentage && file.reductionPercentage > 0 ? (
                    <div className="absolute bottom-2 left-2 bg-emerald-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-sm">
                      <Zap className="w-2.5 h-2.5" /> -{file.reductionPercentage}%
                    </div>
                  ) : null}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(file.url);
                      }}
                      className="p-2.5 rounded-xl bg-white text-indigo-600 font-bold border-2 border-indigo-600 shadow-none hover:bg-indigo-50 transition-transform active:scale-95"
                      title="Copy URL"
                    >
                      <Copy className="w-4 h-4 text-indigo-600" />
                    </button>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2.5 rounded-xl bg-white text-indigo-600 font-bold border-2 border-indigo-600 shadow-none hover:bg-indigo-50 transition-transform active:scale-95"
                      title="Mở tab mới"
                    >
                      <ExternalLink className="w-4 h-4 text-indigo-600" />
                    </a>
                  </div>
                </div>

                {/* File Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${catInfo.badge}`}>
                      {catInfo.label}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-2.5 truncate" title={file.name}>
                      {file.name}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-2.5 border-t-2 border-slate-100">
                    <span>{(file.size / 1024).toFixed(0)} KB</span>
                    <button
                      onClick={() => handleDelete(file.id, file.name)}
                      className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-600 hover:text-white transition flex items-center gap-1.5 text-xs font-bold"
                      title="Xóa tệp"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Xóa
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      <MediaStorageModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        initialCategory={activeCategory !== 'all' ? activeCategory : 'template_thumbnails'}
        onSelect={() => {
          loadData();
        }}
      />

      {/* Lightbox Preview Modal */}
      {previewFile && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div 
            className="bg-white rounded-2xl border-2 border-slate-200 max-w-2xl w-full overflow-hidden shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{previewFile.name}</h3>
                <span className="text-xs text-slate-500 font-medium">{CATEGORY_MAP[previewFile.category]?.label}</span>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="w-8 h-8 rounded-xl border-2 border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[60vh] overflow-hidden rounded-xl bg-slate-100 border-2 border-slate-200">
              {previewFile.isVideo || previewFile.mimeType?.startsWith('video/') ? (
                <video src={previewFile.url} controls autoPlay className="w-full h-full max-h-[50vh] object-contain mx-auto" />
              ) : (
                <img src={previewFile.url} alt={previewFile.name} className="w-full h-full object-contain mx-auto" />
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-600 space-y-0.5">
                <p>
                  Kích thước: {(previewFile.size / 1024).toFixed(1)} KB 
                  {previewFile.originalSize ? ` (Gốc: ${(previewFile.originalSize / 1024).toFixed(1)} KB - Tiết kiệm ${previewFile.reductionPercentage || 0}%)` : ''} 
                  • {previewFile.mimeType}
                </p>
                <p className="font-mono text-xs truncate max-w-md text-indigo-600 font-bold">{previewFile.url}</p>
              </div>
              <div className="flex items-center gap-2.5">
                <Button
                  variant="outline"
                  onClick={() => handleCopy(previewFile.url)}
                  className="gap-1.5 text-sm font-bold rounded-xl border-2 border-indigo-600 bg-white text-indigo-600 hover:bg-indigo-50 shadow-none"
                >
                  <Copy className="w-4 h-4 text-indigo-600" /> Copy Link
                </Button>
                <Button
                  onClick={() => setPreviewFile(null)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl"
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
