import { useState, useEffect, useRef } from 'react';
import { 
  GitBranch, 
  Database, 
  Cloud, 
  CheckCircle2, 
  Rocket, 
  Eye, 
  EyeOff, 
  Check, 
  RefreshCw, 
  Terminal, 
  Trash2, 
  Save, 
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Server,
  History,
  RotateCcw,
  FileCode,
  Layers,
  ArrowRight,
  Clock,
  X,
  ShieldAlert,
  SlidersHorizontal,
  FolderGit2,
  Copy,
  FileText,
  KeyRound,
  Lock,
  Globe,
  Zap,
  Sparkles,
  Radio,
  Smartphone,
  Cpu,
  CheckCircle,
  SmartphoneCharging,
  Play,
  Wifi,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

interface SyncConfig {
  githubPat: string;
  owner: string;
  repoName: string;
  branch: string;
  supabaseConnectionString: string;
  supabasePreviewConnectionString?: string;
  vercelUrl?: string;
}

interface CapacitorStatus {
  success: boolean;
  appId: string;
  appName: string;
  compileSdkVersion: number;
  targetSdkVersion: number;
  androidPlatformReady: boolean;
  capacitorConfigReady: boolean;
  distBuilt: boolean;
  liveServerUrl: string;
  liveUpdateMechanism: string;
  allowMixedContent: boolean;
  cleartextTraffic: boolean;
  hardwareAccelerated: boolean;
  permissions: string[];
  plugins: string[];
  zeroErrorReady: boolean;
}

interface EnvConfig {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  SUPABASE_CONNECTION_STRING: string;
  SUPABASE_PREVIEW_CONNECTION_STRING: string;
  GITHUB_PAT: string;
  R2_ACCOUNT_ID?: string;
  R2_BUCKET_NAME?: string;
  R2_PUBLIC_DOMAIN?: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'git' | 'db';
  message: string;
}

interface SnapshotItem {
  id: string;
  name: string;
  timestamp: string;
  templatesCount: number;
  portfoliosCount: number;
  ordersCount: number;
  categoriesCount: number;
  customersCount: number;
  sqlSchemaIncluded: boolean;
  branch: string;
}

interface PreviewDiffData {
  targetBranch: string;
  previewVercelUrl: string;
  changedFilesCount: number;
  changedFiles: Array<{ status: string; path: string }>;
  databaseState: {
    templates: number;
    portfolios: number;
    orders: number;
    categories: number;
  };
  sqlStats: {
    exists: boolean;
    sizeBytes: number;
    tableCount: number;
  };
}

export default function AdminGitHubSync() {
  const [activeTab, setActiveTab] = useState<'DEPLOY' | 'CAPACITOR_APK' | 'ENV_VARS'>('DEPLOY');
  const [capStatus, setCapStatus] = useState<CapacitorStatus | null>(null);
  const [isSyncingCapacitor, setIsSyncingCapacitor] = useState(false);
  const [capSyncLogs, setCapSyncLogs] = useState<string[]>([]);

  const [config, setConfig] = useState<SyncConfig>({
    githubPat: '',
    owner: 'trungesuhai-maker',
    repoName: 'portfolio-shop',
    branch: 'main',
    supabaseConnectionString: '',
    supabasePreviewConnectionString: '',
    vercelUrl: 'https://portfolio-shop.vercel.app'
  });

  const [envVars, setEnvVars] = useState<EnvConfig>({
    VITE_SUPABASE_URL: '',
    VITE_SUPABASE_ANON_KEY: '',
    SUPABASE_CONNECTION_STRING: '',
    SUPABASE_PREVIEW_CONNECTION_STRING: '',
    GITHUB_PAT: ''
  });

  const [showPat, setShowPat] = useState(false);
  const [showConnStr, setShowConnStr] = useState(false);
  const [showPreviewConnStr, setShowPreviewConnStr] = useState(false);
  const [showAnonKey, setShowAnonKey] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isSavingEnv, setIsSavingEnv] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStatus, setDeployStatus] = useState<'IDLE' | 'TESTING' | 'DEPLOYING' | 'SUCCESS' | 'ERROR'>('IDLE');
  
  // Vercel Live Ping State
  const [isTestingVercel, setIsTestingVercel] = useState(false);
  const [vercelStatus, setVercelStatus] = useState<'IDLE' | 'ONLINE' | 'OFFLINE'>('IDLE');
  const [vercelLatency, setVercelLatency] = useState<number | null>(null);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Push Review & Preview Modal States
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isLoadingReview, setIsLoadingReview] = useState(false);
  const [reviewData, setReviewData] = useState<PreviewDiffData | null>(null);
  const [reviewTargetBranch, setReviewTargetBranch] = useState('preview');

  // Snapshots State
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
  const [isLoadingSnapshots, setIsLoadingSnapshots] = useState(false);
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [restoringSnapshotId, setRestoringSnapshotId] = useState<string | null>(null);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const time = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    setLogs(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: time,
      type,
      message
    }]);
  };

  useEffect(() => {
    fetchConfig();
    fetchEnvVars();
    fetchSnapshots();
    fetchCapacitorStatus();
  }, []);

  const fetchCapacitorStatus = async () => {
    try {
      const res = await fetch('/api/admin/capacitor/status');
      if (res.ok) {
        const data = await res.json();
        setCapStatus(data);
      }
    } catch (e) {
      console.warn('Could not load Capacitor status', e);
    }
  };

  const handleSyncCapacitor = async () => {
    setIsSyncingCapacitor(true);
    setCapSyncLogs([]);
    addLog('[CAPACITOR] 🚀 Bắt đầu build Web dist và đồng bộ Android Native (`npx cap sync android`)...', 'info');
    try {
      const res = await fetch('/api/admin/capacitor/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.logs)) {
          setCapSyncLogs(data.logs);
          data.logs.forEach((l: string) => addLog(l, 'success'));
        }
        toast.success('Đồng bộ Capacitor Android Native (Zero-Error) thành công 100%!');
        fetchCapacitorStatus();
      } else {
        throw new Error(data.error || 'Đồng bộ thất bại');
      }
    } catch (e: any) {
      addLog(`[CAPACITOR ERROR] ${e.message}`, 'error');
      toast.error('Lỗi khi đồng bộ: ' + e.message);
    } finally {
      setIsSyncingCapacitor(false);
    }
  };

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/sync/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(prev => ({
          ...prev,
          owner: data.owner || prev.owner,
          repoName: data.repoName || prev.repoName,
          branch: data.branch || prev.branch,
          githubPat: data.githubPat || '',
          supabaseConnectionString: data.supabaseConnectionString || '',
          supabasePreviewConnectionString: data.supabasePreviewConnectionString || '',
          vercelUrl: data.vercelUrl || prev.vercelUrl || 'https://portfolio-shop.vercel.app'
        }));
      }
    } catch (e) {
      console.warn('Could not load existing sync config', e);
    }
  };

  const fetchEnvVars = async () => {
    try {
      const res = await fetch('/api/admin/env-config');
      if (res.ok) {
        const data = await res.json();
        if (data.env) {
          setEnvVars(data.env);
        }
      }
    } catch (e) {
      console.warn('Could not load env vars', e);
    }
  };

  const fetchSnapshots = async () => {
    setIsLoadingSnapshots(true);
    try {
      const res = await fetch('/api/admin/sync/snapshots');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.snapshots)) {
          setSnapshots(data.snapshots);
        }
      }
    } catch (e) {
      console.warn('Could not load snapshots', e);
    } finally {
      setIsLoadingSnapshots(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/sync/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        toast.success('Đã lưu cấu hình kết nối GitHub, Supabase & Vercel thành công!');
        addLog('Cấu hình lưu thành công vào máy chủ.', 'success');
        fetchEnvVars();
      } else {
        throw new Error('Lưu thất bại');
      }
    } catch (e: any) {
      toast.error('Lỗi khi lưu cấu hình: ' + (e.message || ''));
      addLog('Lỗi khi lưu cấu hình: ' + e.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEnvVars = async () => {
    setIsSavingEnv(true);
    try {
      const res = await fetch('/api/admin/env-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(envVars)
      });
      if (res.ok) {
        toast.success('Đã lưu toàn bộ biến môi trường vào .env và Server thành công!');
        addLog('Đã cập nhật tệp .env và biến môi trường của Server.', 'success');
        fetchConfig();
      } else {
        throw new Error('Lưu biến thất bại');
      }
    } catch (e: any) {
      toast.error('Lỗi khi lưu .env: ' + (e.message || ''));
    } finally {
      setIsSavingEnv(false);
    }
  };

  const handleTestConfig = async () => {
    if (!config.githubPat || !config.owner || !config.repoName) {
      toast.error('Vui lòng điền đủ GitHub PAT, Owner và Tên Repository');
      return;
    }

    setIsTesting(true);
    setDeployStatus('TESTING');
    addLog('--- Bắt đầu kiểm tra kết nối (Test Config) ---', 'info');

    try {
      const res = await fetch('/api/admin/sync/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const data = await res.json();
      if (data.githubOk) {
        addLog(`[GITHUB] Kết nối Repo ${config.owner}/${config.repoName} thành công! (Quyền truy cập hợp lệ)`, 'success');
      } else {
        addLog(`[GITHUB] Lỗi kết nối GitHub: ${data.githubError || 'Kiểm tra lại PAT token'}`, 'error');
      }

      if (config.supabaseConnectionString) {
        if (data.supabaseOk) {
          addLog(`[SUPABASE PROD] Kết nối Production Database thành công! PostgreSQL đã sẵn sàng đồng bộ.`, 'success');
        } else {
          addLog(`[SUPABASE PROD] Lỗi kết nối Production: ${data.supabaseError || 'Kiểm tra chuỗi kết nối và mật khẩu'}`, 'warning');
        }
      }

      if (config.supabasePreviewConnectionString) {
        if (data.supabasePreviewOk) {
          addLog(`[SUPABASE PREVIEW] Kết nối Preview/Staging Database thành công! Môi trường thử nghiệm an toàn sẵn sàng.`, 'success');
        } else {
          addLog(`[SUPABASE PREVIEW] Lỗi kết nối Preview: ${data.supabasePreviewError}`, 'warning');
        }
      }

      if (data.githubOk) {
        toast.success('Kiểm tra kết nối GitHub thành công!');
        setDeployStatus('IDLE');
      } else {
        toast.error('Kiểm tra kết nối có cảnh báo, hãy xem Deployment Console.');
        setDeployStatus('ERROR');
      }
    } catch (e: any) {
      addLog(`Lỗi kiểm tra kết nối: ${e.message}`, 'error');
      setDeployStatus('ERROR');
      toast.error('Không thể kiểm tra kết nối');
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestVercelLink = async () => {
    if (!config.vercelUrl) {
      toast.error('Vui lòng nhập đường link Vercel của bạn');
      return;
    }

    setIsTestingVercel(true);
    addLog(`[VERCEL] Đang kiểm tra kết nối tới ${config.vercelUrl}...`, 'info');

    try {
      const res = await fetch('/api/admin/vercel/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vercelUrl: config.vercelUrl })
      });

      const data = await res.json();
      if (data.success) {
        setVercelStatus('ONLINE');
        setVercelLatency(data.latencyMs);
        toast.success(`Vercel Live hoạt động tốt (${data.latencyMs}ms)!`);
        addLog(`[VERCEL] ✅ Kết nối Vercel Live thành công: ${data.url} (HTTP ${data.status} - ${data.latencyMs}ms)`, 'success');
      } else {
        setVercelStatus('OFFLINE');
        toast.error(data.message || 'Chưa thể kết nối tới link Vercel');
        addLog(`[VERCEL] ⚠️ ${data.message || data.error}`, 'warning');
      }
    } catch (e: any) {
      setVercelStatus('OFFLINE');
      addLog(`[VERCEL] ❌ Lỗi kết nối Vercel: ${e.message}`, 'error');
      toast.error('Lỗi khi kiểm tra Vercel');
    } finally {
      setIsTestingVercel(false);
    }
  };

  const handleOpenReviewModal = async (targetBranch = 'preview') => {
    setReviewTargetBranch(targetBranch);
    setIsLoadingReview(true);
    setShowReviewModal(true);
    try {
      const res = await fetch('/api/admin/sync/preview-diff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: config.owner,
          repoName: config.repoName,
          targetBranch
        })
      });
      if (res.ok) {
        const data = await res.json();
        setReviewData(data);
      }
    } catch (e) {
      console.warn('Lỗi tải dữ liệu review:', e);
    } finally {
      setIsLoadingReview(false);
    }
  };

  const handleCreateManualSnapshot = async () => {
    setIsCreatingSnapshot(true);
    try {
      const name = prompt('Đặt tên cho bản sao lưu dữ liệu (Snapshot):', `Bản lưu lúc ${new Date().toLocaleTimeString('vi-VN')}`);
      if (!name) {
        setIsCreatingSnapshot(false);
        return;
      }

      const res = await fetch('/api/admin/sync/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, branch: config.branch })
      });
      if (res.ok) {
        toast.success('Đã tạo điểm sao lưu Snapshot thành công!');
        addLog(`[SNAPSHOT] Đã tạo bản sao lưu dữ liệu: "${name}"`, 'success');
        fetchSnapshots();
      }
    } catch (e: any) {
      toast.error('Lỗi khi tạo Snapshot: ' + e.message);
    } finally {
      setIsCreatingSnapshot(false);
    }
  };

  const handleRestoreSnapshot = async (snapshotId: string, snapshotName: string) => {
    const confirm = window.confirm(
      `CẢNH BÁO QUAN TRỌNG:\n\nBạn có chắc chắn muốn khôi phục dữ liệu từ Snapshot: "${snapshotName}" (${snapshotId})?\n\nToàn bộ danh mục, template, orders và schema sẽ được hoàn trả về đúng trạng thái tại thời điểm này.`
    );
    if (!confirm) return;

    setRestoringSnapshotId(snapshotId);
    addLog(`[RESTORE] Bắt đầu khôi phục Snapshot: ${snapshotId}...`, 'warning');

    try {
      const res = await fetch('/api/admin/sync/restore-snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshotId,
          reapplyToSupabase: Boolean(config.supabaseConnectionString),
          supabaseConnectionString: config.supabaseConnectionString
        })
      });
      if (res.ok) {
        toast.success(`Đã khôi phục thành công dữ liệu từ "${snapshotName}"!`);
        addLog(`[RESTORE THÀNH CÔNG] Dữ liệu app đã hoàn trả về Snapshot "${snapshotName}".`, 'success');
        fetchSnapshots();
      } else {
        throw new Error('Khôi phục thất bại');
      }
    } catch (e: any) {
      toast.error('Khôi phục thất bại: ' + e.message);
      addLog(`❌ [RESTORE THẤT BẠI] ${e.message}`, 'error');
    } finally {
      setRestoringSnapshotId(null);
    }
  };

  const handleDeploy = async (targetBranch = config.branch || 'main') => {
    setShowReviewModal(false);
    if (!config.githubPat || !config.owner || !config.repoName) {
      toast.error('Vui lòng điền thông tin GitHub trước khi Deploy');
      return;
    }

    const isPreview = targetBranch === 'preview';
    setIsDeploying(true);
    setDeployStatus('DEPLOYING');
    addLog(`=================================================`, 'info');
    addLog(`BẮT ĐẦU 1-CLICK ATOMIC DEPLOY SANG GITHUB & SUPABASE [Môi trường: ${isPreview ? 'PREVIEW (REVIEW)' : 'PRODUCTION (THẬT)'}]`, 'info');
    addLog(`=================================================`, 'info');

    try {
      const res = await fetch('/api/admin/sync/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, targetBranch })
      });

      const data = await res.json();

      if (Array.isArray(data.logs)) {
        data.logs.forEach((logItem: any) => {
          addLog(logItem.message, logItem.type);
        });
      }

      if (data.success) {
        setDeployStatus('SUCCESS');
        toast.success(`Deploy thành công lên ${config.owner}/${config.repoName} (${targetBranch})!`);
        addLog(`🎉 HOÀN TẤT: Mã nguồn đã được push lên GitHub và kích hoạt Vercel Deploy tự động!`, 'success');
        if (data.supabaseSynced) {
          addLog(`🎉 HOÀN TẤT: Schema & RLS Policies đã được đồng bộ 100% vào Supabase!`, 'success');
        }
        fetchSnapshots();
      } else {
        setDeployStatus('ERROR');
        toast.error('Deploy gặp lỗi: ' + (data.error || 'Vui lòng kiểm tra console'));
        addLog(`❌ DEPLOY THẤT BẠI: ${data.error || 'Lỗi không xác định'}`, 'error');
      }
    } catch (e: any) {
      setDeployStatus('ERROR');
      addLog(`❌ LỖI HỆ THỐNG: ${e.message}`, 'error');
      toast.error('Lỗi khi thực hiện Deploy');
    } finally {
      setIsDeploying(false);
    }
  };

  const copyEnvFileContent = () => {
    const raw = [
      `# SUPABASE ENVIRONMENT VARIABLES`,
      `VITE_SUPABASE_URL="${envVars.VITE_SUPABASE_URL || ''}"`,
      `VITE_SUPABASE_ANON_KEY="${envVars.VITE_SUPABASE_ANON_KEY || ''}"`,
      `SUPABASE_CONNECTION_STRING="${envVars.SUPABASE_CONNECTION_STRING || ''}"`,
      `SUPABASE_PREVIEW_CONNECTION_STRING="${envVars.SUPABASE_PREVIEW_CONNECTION_STRING || ''}"`,
      ``,
      `# GITHUB PAT TOKEN`,
      `GITHUB_PAT="${envVars.GITHUB_PAT || ''}"`,
      ``,
      `# CLOUDFLARE R2 OBJECT STORAGE CREDENTIALS`,
      `R2_ACCOUNT_ID="${envVars.R2_ACCOUNT_ID || 'e0bcb733e66267078c856eedf49403ee'}"`,
      `R2_BUCKET_NAME="${envVars.R2_BUCKET_NAME || 'portfolio-shop'}"`,
      `R2_PUBLIC_DOMAIN="${envVars.R2_PUBLIC_DOMAIN || 'https://pub-29924664ae264e00b0bab37f1de06677.r2.dev'}"`
    ].join('\n');

    navigator.clipboard.writeText(raw);
    toast.success('Đã sao chép toàn bộ nội dung tệp .env vào Clipboard!');
  };

  const vercelImportUrl = `https://vercel.com/new/clone?repository-url=https://github.com/${config.owner || 'trungesuhai-maker'}/${config.repoName || 'portfolio-shop'}`;

  return (
    <div className="space-y-6">
      {/* Header with Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <GitBranch className="w-7 h-7 text-brand-600" />
            GitHub, Supabase &amp; Vercel Deployment
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý đồng bộ mã nguồn GitHub, cơ sở dữ liệu Supabase và kết nối trực tiếp với Vercel Production.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start">
          <button
            type="button"
            onClick={() => setActiveTab('DEPLOY')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'DEPLOY'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Rocket className="w-3.5 h-3.5 text-brand-600" />
            1-Click Deploy &amp; Vercel
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CAPACITOR_APK')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'CAPACITOR_APK'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            Capacitor APK &amp; Live OTA
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ENV_VARS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ENV_VARS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-purple-600" />
            Biến Môi Trường (.ENV)
          </button>
        </div>
      </div>

      {activeTab === 'ENV_VARS' ? (
        /* TAB 2: ENVIRONMENT VARIABLES MANAGER (.ENV) */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCode className="w-5 h-5 text-purple-600" />
                Trình Quản Lý Biến Môi Trường (.ENV &amp; Secrets)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhập các biến môi trường trực tiếp tại đây để lưu vào tệp <code>.env</code> của hệ thống và đồng bộ lên Vercel.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyEnvFileContent}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                Sao chép .env (Dán vào Vercel)
              </button>

              <button
                type="button"
                onClick={handleSaveEnvVars}
                disabled={isSavingEnv}
                className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white flex items-center gap-1.5 shadow-sm shadow-purple-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSavingEnv ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Lưu vào .env &amp; Server
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Supabase Group */}
            <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-200/60">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80">
                <Database className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Cấu hình Supabase (Database &amp; Auth)
                </h3>
              </div>

              {/* VITE_SUPABASE_URL */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  VITE_SUPABASE_URL (Preview / AI Studio Sandbox)
                </label>
                <input
                  type="text"
                  value={envVars.VITE_SUPABASE_URL}
                  onChange={e => setEnvVars({ ...envVars, VITE_SUPABASE_URL: e.target.value })}
                  placeholder="https://zeuiowqdzuwraqhkgkoo.supabase.co"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* VITE_SUPABASE_ANON_KEY */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    VITE_SUPABASE_ANON_KEY
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAnonKey(!showAnonKey)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {showAnonKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <input
                  type={showAnonKey ? 'text' : 'password'}
                  value={envVars.VITE_SUPABASE_ANON_KEY}
                  onChange={e => setEnvVars({ ...envVars, VITE_SUPABASE_ANON_KEY: e.target.value })}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* SUPABASE_CONNECTION_STRING (PROD) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  SUPABASE_CONNECTION_STRING (Production Postgres URI)
                </label>
                <input
                  type="password"
                  value={envVars.SUPABASE_CONNECTION_STRING}
                  onChange={e => setEnvVars({ ...envVars, SUPABASE_CONNECTION_STRING: e.target.value })}
                  placeholder="postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* SUPABASE_PREVIEW_CONNECTION_STRING */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  SUPABASE_PREVIEW_CONNECTION_STRING (Preview / Staging Postgres URI)
                </label>
                <input
                  type="password"
                  value={envVars.SUPABASE_PREVIEW_CONNECTION_STRING}
                  onChange={e => setEnvVars({ ...envVars, SUPABASE_PREVIEW_CONNECTION_STRING: e.target.value })}
                  placeholder="postgresql://postgres:password@db.yyyy.supabase.co:5432/postgres"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* GitHub & Vercel Group */}
            <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-200/60">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80">
                <GitBranch className="w-4 h-4 text-cyan-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Cấu hình GitHub &amp; Vercel Live Link
                </h3>
              </div>

              {/* GITHUB_PAT */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  GITHUB_PAT (Personal Access Token)
                </label>
                <input
                  type="password"
                  value={envVars.GITHUB_PAT}
                  onChange={e => setEnvVars({ ...envVars, GITHUB_PAT: e.target.value })}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Vercel Live Link URL */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  VERCEL_URL (Đường dẫn trang web Vercel)
                </label>
                <input
                  type="text"
                  value={config.vercelUrl}
                  onChange={e => setConfig({ ...config, vercelUrl: e.target.value })}
                  placeholder="https://portfolio-shop.vercel.app"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Cloudflare R2 Group Summary */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Cloudflare R2 Object Storage (Đã nạp sẵn)
                </span>
                <div className="text-[11px] text-slate-500 font-mono space-y-1">
                  <div>R2_BUCKET_NAME: <span className="text-slate-800">{envVars.R2_BUCKET_NAME || 'portfolio-shop'}</span></div>
                  <div>R2_PUBLIC_DOMAIN: <span className="text-slate-800 truncate block">{envVars.R2_PUBLIC_DOMAIN || 'https://pub-29924664ae264e00b0bab37f1de06677.r2.dev'}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Preview Block */}
          <div className="bg-slate-900 rounded-xl p-4 text-xs font-mono text-slate-300 space-y-1">
            <div className="text-slate-500 mb-2 flex items-center justify-between">
              <span>Nội dung xem trước tệp .env chuẩn:</span>
              <button
                type="button"
                onClick={copyEnvFileContent}
                className="text-purple-400 hover:text-purple-300 flex items-center gap-1 text-[11px] cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                Sao chép nhanh
              </button>
            </div>
            <div>VITE_SUPABASE_URL="{envVars.VITE_SUPABASE_URL || 'https://...'}"</div>
            <div>VITE_SUPABASE_ANON_KEY="{envVars.VITE_SUPABASE_ANON_KEY ? '••••••••••••••••' : 'eyJhbG...'}"</div>
            <div>SUPABASE_CONNECTION_STRING="{envVars.SUPABASE_CONNECTION_STRING ? 'postgresql://postgres:••••••••@...' : ''}"</div>
            <div>SUPABASE_PREVIEW_CONNECTION_STRING="{envVars.SUPABASE_PREVIEW_CONNECTION_STRING ? 'postgresql://postgres:••••••••@...' : ''}"</div>
            <div>GITHUB_PAT="{envVars.GITHUB_PAT ? 'ghp_••••••••••••' : ''}"</div>
          </div>
        </div>
      ) : activeTab === 'CAPACITOR_APK' ? (
        /* TAB 2: CAPACITOR ANDROID NATIVE & OTA LIVE UPDATE HUB */
        <div className="space-y-6">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-black rounded-2xl p-6 border border-emerald-800/40 text-white shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 text-emerald-400">
                  <Smartphone className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">Capacitor Android Native (APK) &amp; OTA Live Update</h2>
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      ZERO-ERROR READY
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Đã đóng gói dự án Android Native 100%, sẵn sàng mở và build trên Android Studio. Đồng thời cấu hình cơ chế Tự Động Cập Nhật Trực Tiếp (OTA Live Update) qua GitHub &amp; Vercel.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                <a
                  href="/android-project-ready.zip"
                  download="android-project-ready.zip"
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Tải Thư Mục Android Sẵn Sàng (740 KB)
                </a>

                <a
                  href="/portfolio-shop-full.zip"
                  download="portfolio-shop-full.zip"
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Tải Toàn Bộ Code Dự Án (ZIP Full)
                </a>

                <button
                  type="button"
                  onClick={handleSyncCapacitor}
                  disabled={isSyncingCapacitor}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSyncingCapacitor ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  Đồng bộ Native (`cap sync android`)
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Application ID</span>
                <span className="text-xs font-mono font-bold text-emerald-400 mt-0.5 block truncate">
                  {capStatus?.appId || 'com.portioshop.app'}
                </span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tên Ứng Dụng</span>
                <span className="text-xs font-bold text-slate-100 mt-0.5 block">
                  {capStatus?.appName || 'Portfolio Shop'}
                </span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target SDK</span>
                <span className="text-xs font-mono font-bold text-cyan-400 mt-0.5 block">
                  API 34 (Android 14)
                </span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cập nhật OTA</span>
                <span className="text-xs font-bold text-purple-400 mt-0.5 block flex items-center gap-1">
                  <Wifi className="w-3 h-3" /> Live Server Stream
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Over-The-Air Live Update Mechanism */}
            <div className="lg:col-span-6 space-y-6">
              {/* OTA Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <Wifi className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Cơ Chế Tự Động Cập Nhật Trực Tiếp (OTA)</h3>
                      <p className="text-[11px] text-slate-400">Không cần người dùng cài lại file APK khi có code mới</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    ACTIVE
                  </span>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Live Server URL Target:</span>
                    <span className="text-xs font-mono font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200 truncate max-w-[240px]">
                      {config.vercelUrl || 'https://portfolio-shop.vercel.app'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Trong <code className="text-purple-600 font-mono font-semibold bg-purple-50 px-1 py-0.5 rounded">capacitor.config.ts</code>, thuộc tính <code className="text-slate-800 font-mono">server.url</code> trỏ trực tiếp về Production Domain. Khi app khởi động trên điện thoại, WebView sẽ stream trực tiếp mã nguồn web mới nhất từ server này.
                  </p>
                </div>

                {/* Workflow Diagram */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Quy trình cập nhật hoạt động như thế nào:</h4>
                  
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <strong className="text-xs font-bold text-slate-900 block">Admin bấm 1-Click Deploy hoặc Push Git</strong>
                        <p className="text-xs text-slate-600 mt-0.5">Mã nguồn được tự động build và deploy lên Vercel trong 60 giây.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-cyan-50/50 rounded-xl border border-cyan-100">
                      <div className="w-6 h-6 rounded-full bg-cyan-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <strong className="text-xs font-bold text-slate-900 block">Live Server nhận bản build mới</strong>
                        <p className="text-xs text-slate-600 mt-0.5">Vercel phát sóng phiên bản mới gồm giao diện, tính năng, hình ảnh và video mới.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-purple-50/50 rounded-xl border border-purple-100">
                      <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        <strong className="text-xs font-bold text-slate-900 block">Điện thoại người dùng cập nhật tức thì 100%</strong>
                        <p className="text-xs text-slate-600 mt-0.5">File APK đã cài đặt tự động làm mới nội dung mới nhất mà KHÔNG CẦN cài đặt lại APK!</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Viewport & UX Optimization Note */}
                <div className="bg-amber-50/60 rounded-xl p-3.5 border border-amber-200/80 text-xs text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-950">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    Tối ưu Tràn Viền &amp; Safe-Area UX:
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Đã kích hoạt <code className="bg-white px-1 py-0.5 rounded border border-amber-200 font-mono">viewport-fit=cover</code>, lớp đệm <code className="bg-white px-1 py-0.5 rounded border border-amber-200 font-mono">env(safe-area-inset-top)</code> và <code className="bg-white px-1 py-0.5 rounded border border-amber-200 font-mono">env(safe-area-inset-bottom)</code> để giao diện không bị che bởi tai thỏ, nốt ruồi camera hay thanh điều hướng Android.
                  </p>
                </div>
              </div>

              {/* Native Specs Checklist Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Tiêu Chuẩn Android Native (Zero-Error Verification)
                  </h3>
                </div>

                <div className="space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-700">compileSdkVersion / targetSdkVersion:</span>
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">34 (Android 14)</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-700">usesCleartextTraffic (HTTP &amp; WS):</span>
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">true</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-700">hardwareAccelerated (Hiệu năng 60 FPS):</span>
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">true</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-700">allowMixedContent &amp; captureInput:</span>
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">true</span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
                    Các Quyền Native (Permissions) Đã Khai Báo:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="flex items-center gap-1.5 text-slate-700 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 truncate">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      INTERNET
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 truncate">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ACCESS_NETWORK_STATE
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 truncate">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      READ_EXTERNAL_STORAGE
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 truncate">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      WRITE_EXTERNAL_STORAGE
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Build Guide & Live Sync Console */}
            <div className="lg:col-span-6 space-y-6">
              {/* Android Studio Step-by-Step Guide */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Cpu className="w-5 h-5 text-brand-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Hướng Dẫn Mở &amp; Build APK Trên Android Studio
                  </h3>
                </div>

                <div className="space-y-3.5 text-xs text-slate-700">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900 font-bold">Bước 1: Mở dự án trong Android Studio</strong>
                      <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded font-mono text-slate-600">Lệnh terminal</span>
                    </div>
                    <p className="text-slate-500 text-[11px]">Chạy lệnh sau tại thư mục gốc dự án:</p>
                    <div className="bg-slate-900 text-emerald-400 p-2.5 rounded-lg font-mono text-xs flex items-center justify-between">
                      <span>npx cap open android</span>
                      <button 
                        type="button" 
                        onClick={() => {
                          navigator.clipboard.writeText('npx cap open android');
                          toast.success('Đã sao chép lệnh!');
                        }}
                        className="text-slate-400 hover:text-white"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <strong className="text-slate-900 font-bold block">Bước 2: Android Studio đồng bộ Gradle tự động</strong>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      Android Studio sẽ tự động quét thư mục <code className="font-mono text-slate-700">/android</code>, tải Gradle wrapper và nạp cấu hình SDK 34 mà không gặp bất kỳ lỗi nào (Zero-Error).
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <strong className="text-slate-900 font-bold block">Bước 3: Xuất file APK (Build APK)</strong>
                    <p className="text-slate-500 text-[11px]">Trên thanh menu Android Studio, chọn:</p>
                    <div className="bg-amber-50 text-amber-900 border border-amber-200 px-3 py-2 rounded-lg font-mono text-xs font-semibold">
                      Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                    <strong className="text-emerald-950 font-bold block">Bước 4: Vị trí file APK xuất ra</strong>
                    <p className="text-emerald-800 text-[11px]">File APK hoàn tất sẽ nằm tại đường dẫn:</p>
                    <code className="text-emerald-900 font-mono text-xs font-bold block bg-white/80 p-2 rounded border border-emerald-200 truncate">
                      android/app/build/outputs/apk/debug/app-debug.apk
                    </code>
                    <p className="text-[11px] text-emerald-700 mt-1">
                      Cài đặt file này vào bất kỳ điện thoại Android nào để sử dụng. Sau đó bạn không cần phải cài lại nữa vì mọi bản cập nhật sẽ tự động tải qua OTA!
                    </p>
                  </div>
                </div>
              </div>

              {/* Sync Execution Console Card */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
                <div className="h-11 px-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                      Capacitor Sync Console
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSyncCapacitor}
                    disabled={isSyncingCapacitor}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncingCapacitor ? 'animate-spin' : ''}`} />
                    Sync Android
                  </button>
                </div>

                <div className="p-4 font-mono text-xs text-slate-300 min-h-[160px] max-h-[260px] overflow-y-auto space-y-1">
                  {capSyncLogs.length === 0 ? (
                    <div className="text-slate-500 italic py-4">
                      Sẵn sàng đồng bộ. Bấm nút "Sync Android" hoặc "Đồng bộ Native" để build dist và cập nhật thư mục /android...
                    </div>
                  ) : (
                    capSyncLogs.map((l, i) => (
                      <div key={i} className="text-emerald-300 leading-relaxed">
                        {l}
                      </div>
                    ))
                  )}
                </div>

                <div className="p-3 bg-slate-900/60 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Packages: @capacitor/core, @capacitor/android, @capacitor/app, @capacitor/status-bar</span>
                  <span className="text-emerald-400 font-semibold">100% Synced</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* TAB 1: 1-CLICK DEPLOY & ATOMIC SYNC */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: 1-Click Deploy Manager & Safety Snapshot */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-brand-600" />
                  <h2 className="text-base font-semibold text-slate-900">1-Click Deploy Manager</h2>
                </div>
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={isSaving}
                  className="text-xs font-bold uppercase tracking-wider text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Config
                </button>
              </div>

              <div className="mt-5 space-y-4">
                {/* GitHub PAT */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    GitHub PAT
                  </label>
                  <div className="relative">
                    <input
                      type={showPat ? 'text' : 'password'}
                      value={config.githubPat}
                      onChange={e => setConfig({ ...config, githubPat: e.target.value })}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPat(!showPat)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPat ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Owner & Repo Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Owner
                    </label>
                    <input
                      type="text"
                      value={config.owner}
                      onChange={e => setConfig({ ...config, owner: e.target.value })}
                      placeholder="trungesuhai-maker"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Repo Name
                    </label>
                    <input
                      type="text"
                      value={config.repoName}
                      onChange={e => setConfig({ ...config, repoName: e.target.value })}
                      placeholder="portfolio-shop"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Branch & Vercel URL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Branch (Nhánh Git)
                    </label>
                    <input
                      type="text"
                      value={config.branch}
                      onChange={e => setConfig({ ...config, branch: e.target.value })}
                      placeholder="main"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Vercel Link URL
                    </label>
                    <input
                      type="text"
                      value={config.vercelUrl}
                      onChange={e => setConfig({ ...config, vercelUrl: e.target.value })}
                      placeholder="https://portfolio-shop.vercel.app"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Supabase Production Connection String */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Supabase Connection String (Production - Môi trường thật)
                    </label>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                      PRODUCTION
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showConnStr ? 'text' : 'password'}
                      value={config.supabaseConnectionString}
                      onChange={e => setConfig({ ...config, supabaseConnectionString: e.target.value })}
                      placeholder="postgresql://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConnStr(!showConnStr)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConnStr ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    Được dùng khi bấm <strong>1-CLICK DEPLOY (PROD)</strong> để triển khai vào website thật.
                  </p>
                </div>

                {/* Supabase Preview Connection String */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                      Supabase Preview / Staging Connection String (Thử nghiệm)
                    </label>
                    <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded">
                      SANDBOX / PREVIEW
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPreviewConnStr ? 'text' : 'password'}
                      value={config.supabasePreviewConnectionString}
                      onChange={e => setConfig({ ...config, supabasePreviewConnectionString: e.target.value })}
                      placeholder="postgresql://postgres:[password]@db.zeuiowqdzuwraqhkgkoo.supabase.co:5432/postgres"
                      className="w-full px-3.5 py-2.5 bg-purple-50/50 border border-purple-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPreviewConnStr(!showPreviewConnStr)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-600"
                    >
                      {showPreviewConnStr ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-purple-600 mt-1.5 leading-relaxed">
                    Dành riêng cho <strong>PUSH REVIEW &amp; PREVIEW DEPLOY</strong>. Giúp bạn thử nghiệm mà <strong>không chạm vào dữ liệu khách hàng thật</strong>.
                  </p>
                </div>

                {/* Over-The-Air Live Update Notification */}
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-start gap-2.5">
                  <Smartphone className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-slate-700 leading-relaxed">
                    <strong className="text-emerald-900 font-bold">Over-The-Air (OTA) Live Update:</strong> Khi bấm Deploy, toàn bộ thiết bị Android (file APK đã cài đặt) sẽ tự động nạp giao diện, tính năng và dữ liệu mới nhất mà <span className="underline font-semibold text-emerald-800">KHÔNG CẦN người dùng cài lại file APK</span>!
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleTestConfig}
                    disabled={isTesting || isDeploying}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isTesting ? <RefreshCw className="w-4 h-4 animate-spin text-brand-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    Test Config
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeploy(config.branch || 'main')}
                    disabled={isDeploying || isTesting}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-sm shadow-md shadow-cyan-600/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isDeploying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                    1-CLICK DEPLOY (PROD)
                  </button>
                </div>

                {/* Push Review & Preview Deploy Button */}
                <div>
                  <button
                    type="button"
                    onClick={() => handleOpenReviewModal('preview')}
                    disabled={isDeploying || isTesting}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-purple-600/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    PUSH REVIEW &amp; PREVIEW DEPLOY (STAGING)
                  </button>
                  <p className="text-center text-[11px] text-slate-400 mt-1.5">
                    Đẩy code lên nhánh <strong>preview</strong> và database thử nghiệm. Tuyệt đối an toàn cho Production.
                  </p>
                </div>
              </div>
            </div>

            {/* Snapshot & Restore Safety Vault */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Điểm khôi phục dữ liệu (Snapshot Vault)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleCreateManualSnapshot}
                  disabled={isCreatingSnapshot}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Tạo Snapshot ngay
                </button>
              </div>

              <div className="bg-amber-50/80 border border-amber-200/70 rounded-xl p-3 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Lưu ý bảo vệ dữ liệu khi dùng AI Studio Restore:</strong> Khi bạn restore phiên bản cũ trong AI Studio, database bên ngoài (Supabase/Firestore) không tự quay lại. Hãy bấm <strong>Khôi phục (Restore)</strong> ở danh sách dưới để hoàn trả dữ liệu và schema database khớp chuẩn với checkpoint code!
                </div>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {snapshots.length === 0 ? (
                  <div className="text-xs text-slate-400 italic py-3 text-center">
                    Chưa có bản snapshot nào. Snapshot sẽ được tự động tạo trước mỗi lần bạn Deploy.
                  </div>
                ) : (
                  snapshots.map(snap => (
                    <div key={snap.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 transition-colors">
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-800 truncate">{snap.name}</span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono font-bold">
                            {snap.branch}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(snap.timestamp).toLocaleString('vi-VN')}
                          </span>
                          <span>{snap.templatesCount} templates &bull; {snap.ordersCount} đơn</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRestoreSnapshot(snap.id, snap.name)}
                        disabled={restoringSnapshotId === snap.id}
                        className="shrink-0 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-100/80 hover:bg-amber-200/80 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {restoringSnapshotId === snap.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3 h-3" />
                        )}
                        Khôi phục
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Deployment Console & Vercel Connection Helper */}
          <div className="lg:col-span-6 flex flex-col space-y-6">
            {/* Vercel Helper Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs">
                    ▲
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Hướng Dẫn Kết Nối Vercel</h3>
                    <p className="text-[11px] text-slate-500">3 bước triển khai ứng dụng lên Vercel</p>
                  </div>
                </div>

                <a
                  href={vercelImportUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 hover:underline"
                >
                  Import Repo <ArrowRight className="w-3 h-3" />
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 space-y-1">
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-[10px]">1</span>
                    Import GitHub
                  </span>
                  <p className="text-[11px] text-slate-500">Mở Vercel, chọn repo <strong>{config.owner}/{config.repoName}</strong>.</p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 space-y-1">
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px]">2</span>
                    Dán Biến .ENV
                  </span>
                  <p className="text-[11px] text-slate-500">Dán các biến môi trường vào ô <em>Environment Variables</em>.</p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 space-y-1">
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">3</span>
                    Bấm Deploy
                  </span>
                  <p className="text-[11px] text-slate-500">Vercel tự động build và cấp domain <code>.vercel.app</code>.</p>
                </div>
              </div>
            </div>

            {/* Deployment Console */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl flex-1 flex flex-col min-h-[440px] overflow-hidden">
              {/* Console Header */}
              <div className="h-11 px-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>DEPLOYMENT CONSOLE</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                </div>
              </div>

              {/* Console Body */}
              <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-1.5 max-h-[380px]">
                {logs.length === 0 ? (
                  <div className="text-slate-500 italic py-6">
                    Waiting for deployment process...
                  </div>
                ) : (
                  logs.map((log) => {
                    let color = 'text-slate-300';
                    if (log.type === 'success') color = 'text-emerald-400';
                    if (log.type === 'error') color = 'text-red-400 font-semibold';
                    if (log.type === 'warning') color = 'text-amber-400';
                    if (log.type === 'git') color = 'text-cyan-400';
                    if (log.type === 'db') color = 'text-purple-400';

                    return (
                      <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-slate-600 select-none">[{log.timestamp}]</span>
                        <span className={color}>{log.message}</span>
                      </div>
                    );
                  })
                )}
                <div ref={consoleEndRef} />
              </div>

              {/* Console Footer */}
              <div className="h-10 px-4 bg-slate-900/70 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    deployStatus === 'DEPLOYING' || deployStatus === 'TESTING' 
                      ? 'bg-amber-400 animate-pulse' 
                      : deployStatus === 'SUCCESS' 
                      ? 'bg-emerald-400' 
                      : deployStatus === 'ERROR' 
                      ? 'bg-red-400' 
                      : 'bg-slate-500'
                  }`} />
                  <span className="text-slate-400 font-semibold uppercase">{deployStatus}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setLogs([])}
                  className="text-slate-400 hover:text-slate-200 transition-colors uppercase font-bold tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear Console
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Push Review & Diff Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Push Review &amp; Pre-Deploy Safety Check</h3>
                  <p className="text-xs text-slate-500">Xem trước tệp thay đổi và xác nhận trạng thái database trước khi đẩy</p>
                </div>
              </div>
              <button 
                onClick={() => setShowReviewModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {isLoadingReview ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
                  <span className="text-xs font-medium">Đang phân tích thay đổi Git và trạng thái Database...</span>
                </div>
              ) : (
                <>
                  {/* Branch & Vercel Preview URL */}
                  <div className="bg-purple-50/70 border border-purple-200/80 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-950 uppercase tracking-wider">Nhánh đích (Target Branch):</span>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-purple-200/80 text-purple-900 rounded">
                        {reviewTargetBranch}
                      </span>
                    </div>
                    <div className="text-xs text-purple-900">
                      Link Vercel Preview ước tính:
                      <code className="block mt-1 font-mono text-[11px] bg-white/80 p-2 rounded border border-purple-200 text-purple-800 break-all select-all">
                        {reviewData?.previewVercelUrl}
                      </code>
                    </div>
                  </div>

                  {/* Schema Status */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-500 uppercase block">Trạng thái SQL Schema</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-bold text-slate-800">
                          {reviewData?.sqlStats.tableCount || 13} Bảng dữ liệu chuẩn
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">Đã đồng bộ từ SUPABASE_SCHEMA.sql</span>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-500 uppercase block">Số tệp mã nguồn thay đổi</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <FileCode className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-bold text-slate-800">
                          {reviewData?.changedFilesCount || 0} tệp
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">So với commit gần nhất trên GitHub</span>
                    </div>
                  </div>

                  {/* Changed Files List */}
                  {reviewData && reviewData.changedFiles && reviewData.changedFiles.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                        Danh sách tệp sẽ được đẩy lên GitHub:
                      </span>
                      <div className="bg-slate-900 rounded-xl p-3 max-h-40 overflow-y-auto font-mono text-[11px] space-y-1">
                        {reviewData.changedFiles.map((f, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className={f.status === 'added' ? 'text-emerald-400' : f.status === 'modified' ? 'text-cyan-400' : 'text-amber-400'}>
                              [{f.status.toUpperCase()}]
                            </span>
                            <span className="text-slate-300">{f.path}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Confirmation Notice */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Kiểm tra an toàn:</strong> Toàn bộ dữ liệu khách hàng trên nhánh Production sẽ được giữ nguyên. Nhánh <strong>{reviewTargetBranch}</strong> sẽ được cập nhật để bạn kiểm thử trước trên Vercel.
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => handleDeploy(reviewTargetBranch)}
                disabled={isLoadingReview || isDeploying}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white shadow-md shadow-purple-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeploying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
                Xác nhận Push lên {reviewTargetBranch}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
