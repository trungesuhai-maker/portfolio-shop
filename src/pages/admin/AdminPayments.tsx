import { useState, useEffect } from 'react';
import { api } from '@/src/services/api';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Loading } from '@/src/components/ui/Loading';
import { 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  QrCode, 
  Save, 
  ExternalLink, 
  Building2, 
  DollarSign, 
  Sparkles, 
  Layers, 
  Globe, 
  Lock, 
  RefreshCw,
  Eye,
  Sliders,
  Copy,
  Check,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  ShopPaymentSettings, 
  DEFAULT_PAYMENT_SETTINGS, 
  getSavedPaymentSettings, 
  savePaymentSettings,
  VIETQR_BANKS,
  generateVietQrUrl 
} from '@/src/types/paymentConfig';

const POPULAR_BANKS = [
  'MB BANK (Ngân hàng Quân Đội)',
  'Vietcombank (VCB)',
  'Techcombank (TCB)',
  'ACB (Á Châu)',
  'VPBank (Việt Nam Thịnh Vượng)',
  'VietinBank (Công Thương)',
  'BIDV (Đầu tư & Phát triển)',
  'TPBank (Tiên Phong)',
  'MoMo Business',
  'ZaloPay Merchant'
];

export default function AdminPayments() {
  const [activeTab, setActiveTab] = useState<'config' | 'transactions'>('config');
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [settings, setSettings] = useState<ShopPaymentSettings>(DEFAULT_PAYMENT_SETTINGS);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const webhookUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/webhooks/payment` 
    : 'https://ais-pre-cbg6p5tmrlyzcymqqfrmqj-395109314000.asia-southeast1.run.app/api/webhooks/payment';

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    toast.success('Đã sao chép link Webhook URL!');
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  useEffect(() => {
    // 1. Load saved settings from local storage initially
    const local = getSavedPaymentSettings();
    setSettings(local);

    // 2. Sync from backend API
    fetch('/api/payment-settings')
      .then(res => res.json())
      .then(serverSettings => {
        if (serverSettings && serverSettings.accountNumber) {
          setSettings(prev => ({ ...prev, ...serverSettings }));
          savePaymentSettings({ ...local, ...serverSettings });
        }
      })
      .catch(() => {});

    async function loadTransactions() {
      try {
        setLoading(true);
        const data = await api.admin.getPayments();
        setPayments(data);
      } catch (e) {
        toast.error('Failed to load payments');
      } finally {
        setLoading(false);
      }
    }
    loadTransactions();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      savePaymentSettings(settings);
      await fetch('/api/payment-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      toast.success('Đã lưu thành công cấu hình Thanh Toán & VietQR lên hệ thống!');
    } catch (e) {
      toast.error('Lỗi khi lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Bạn có chắc chắn muốn đặt lại tất cả thông tin về mặc định không?')) {
      setSettings(DEFAULT_PAYMENT_SETTINGS);
      savePaymentSettings(DEFAULT_PAYMENT_SETTINGS);
      toast.success('Đã khôi phục cài đặt mặc định!');
    }
  };

  const getProviderBadge = (provider: string) => {
    switch (provider?.toLowerCase()) {
      case 'stripe':
        return <span className="px-2.5 py-1 rounded text-[14px] font-bold bg-indigo-50 text-indigo-700">Stripe</span>;
      case 'payos':
        return <span className="px-2.5 py-1 rounded text-[14px] font-bold bg-blue-50 text-blue-700">PayOS</span>;
      case 'vnpay':
        return <span className="px-2.5 py-1 rounded text-[14px] font-bold bg-red-50 text-red-700">VNPay</span>;
      case 'sandbox':
      default:
        return <span className="px-2.5 py-1 rounded text-[14px] font-bold bg-emerald-50 text-emerald-700">Sandbox Test</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Cấu Hình & Quản Lý Thanh Toán</span>
          </h1>
          <p className="text-slate-500 text-[14px] font-medium mt-1">
            Thiết lập thông tin ngân hàng, mã QR VietQR, thẻ tín dụng và nội dung hiển thị khi khách hàng mua Portfolio.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/checkout?slug=manisha-creative"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[14px] font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
          >
            <Eye className="w-4 h-4" /> Xem Thử Trang Thanh Toán <ExternalLink className="w-3.5 h-3.5" />
          </a>
          
          {activeTab === 'config' && (
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 px-5 rounded-xl shadow-lg shadow-indigo-600/20"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('config')}
          className={`pb-3 font-bold text-sm flex items-center gap-2 relative transition-colors ${
            activeTab === 'config'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" /> Cài Đặt Trang Thanh Toán & VietQR
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 font-bold text-sm flex items-center gap-2 relative transition-colors ${
            activeTab === 'transactions'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" /> Nhật Ký Giao Dịch ({payments.length})
        </button>
      </div>

      {/* TAB 1: CONFIGURATION EDITOR */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          
          {/* Section 1: Thông tin Ngân hàng & VietQR */}
          <Card className="bg-white border-2 border-slate-200 shadow-sm rounded-2xl p-6 sm:p-7 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">1. Thông Tin Nhận Tiền Ngân Hàng (Quét QR VietQR)</h2>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Chuẩn Napas 247
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Tự động sinh mã VietQR chuẩn ngân hàng, khách quét là tự động điền STK, Số tiền và Cú pháp</p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableQrPayment}
                  onChange={(e) => setSettings({ ...settings, enableQrPayment: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-slate-700">Bật Quét QR</span>
              </label>
            </div>

            <div className="grid lg:grid-cols-12 gap-6 items-start">
              {/* Form Controls */}
              <div className="lg:col-span-8 grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Chọn Ngân Hàng Hỗ Trợ VietQR *
                  </label>
                  <select
                    value={settings.bankCode || 'MB'}
                    onChange={(e) => {
                      const selectedCode = e.target.value;
                      const bank = VIETQR_BANKS.find(b => b.code === selectedCode);
                      setSettings(prev => ({
                        ...prev,
                        bankCode: selectedCode,
                        bankName: bank ? bank.name : prev.bankName
                      }));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-2.5 text-[14px] font-semibold text-slate-900 outline-none transition-all"
                  >
                    {VIETQR_BANKS.map((b) => (
                      <option key={b.code} value={b.code}>
                        [{b.code}] {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 bg-amber-50 border border-amber-200/90 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Lưu ý quan trọng khi nhập STK nhận tiền VietQR:</strong>
                    <p className="mt-1 text-amber-800 leading-relaxed">
                      Ứng dụng ngân hàng (MB, Vietcombank, Techcombank, TPBank...) khi quét mã QR sẽ tự động truy vấn Napas 247 để xác thực số tài khoản. Vui lòng nhập <strong>ĐÚNG Số Tài Khoản Thật</strong> của bạn. Nếu giữ nguyên STK mẫu/mặc định (như 0988889999), ứng dụng ngân hàng khi quét mã sẽ báo <em>"Mã không có hiệu lực"</em> hoặc <em>"Tài khoản thụ hưởng không tồn tại"</em>.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Số Tài Khoản (STK) Thật *
                  </label>
                  <input
                    type="text"
                    value={settings.accountNumber}
                    onChange={(e) => setSettings({ ...settings, accountNumber: e.target.value.replace(/[^0-9a-zA-Z]/g, '') })}
                    placeholder="0988889999"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-2.5 text-[14px] font-bold text-indigo-600 outline-none transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Tên Chủ Tài Khoản (In Hoa) *
                  </label>
                  <input
                    type="text"
                    value={settings.accountHolder}
                    onChange={(e) => setSettings({ ...settings, accountHolder: e.target.value.toUpperCase() })}
                    placeholder="TRAN VAN TRUNG"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-2.5 text-[14px] font-bold uppercase text-slate-900 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Cú Pháp Nội Dung Chuyển Khoản
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={settings.transferPrefix}
                      onChange={(e) => setSettings({ ...settings, transferPrefix: e.target.value.toUpperCase() })}
                      placeholder="PORTFOLIO"
                      className="w-1/2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-2.5 text-[14px] font-bold text-slate-900 outline-none transition-all uppercase font-mono"
                    />
                    <span className="text-xs font-mono font-bold text-slate-500">+ [MÃ ĐƠN HÀNG]</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Thời Gian Hiệu Lực Mã QR (Phút)
                  </label>
                  <input
                    type="number"
                    value={settings.qrTimerMinutes}
                    onChange={(e) => setSettings({ ...settings, qrTimerMinutes: Number(e.target.value) || 15 })}
                    placeholder="15"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-2.5 text-[14px] text-slate-900 outline-none transition-all"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Tỷ Giá Quy Đổi (Nếu template dùng USD: 1 USD = ? VNĐ)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={settings.exchangeRate}
                      onChange={(e) => setSettings({ ...settings, exchangeRate: Number(e.target.value) || 25000 })}
                      placeholder="25000"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-2.5 text-[14px] font-bold text-emerald-600 outline-none transition-all pl-10"
                    />
                    <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₫</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Nếu template định giá bằng VNĐ (ví dụ 490.000₫), hệ thống sẽ giữ nguyên 490.000₫.
                  </p>
                </div>
              </div>

              {/* Live VietQR Preview Box */}
              <div className="lg:col-span-4 bg-slate-50 border-2 border-slate-200/80 rounded-2xl p-5 flex flex-col items-center text-center">
                <div className="flex items-center gap-1.5 mb-2">
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Mã VietQR Xem Trước Thực Tế</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">Mã này sẽ hiển thị khi khách mua Portfolio giá 490.000₫</p>
                
                <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm relative group mb-3">
                  <img
                    src={generateVietQrUrl(settings, 490000, `${settings.transferPrefix || 'PORTFOLIO'} DEMO8941`)}
                    alt="Live VietQR Preview"
                    className="w-48 h-auto max-h-60 object-contain rounded-lg"
                  />
                  <div className="absolute inset-0 bg-indigo-900/10 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md">
                      Quét thử bằng App Ngân Hàng
                    </span>
                  </div>
                </div>

                <div className="w-full text-left space-y-1 text-[11px] bg-white p-3 rounded-xl border border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ngân hàng:</span>
                    <span className="font-bold text-slate-800">{settings.bankCode || 'MB'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số tài khoản:</span>
                    <span className="font-mono font-bold text-indigo-600">{settings.accountNumber || 'Chưa nhập'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Chủ TK:</span>
                    <span className="font-bold text-slate-800 uppercase">{settings.accountHolder || 'Chưa nhập'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nội dung mẫu:</span>
                    <span className="font-mono font-bold text-slate-700">{settings.transferPrefix || 'PORTFOLIO'} DEMO8941</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Bạn có thể lấy điện thoại quét thử để kiểm tra</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Section 2: Cổng Tự Động Hóa payOS & Webhook (Tự động kích hoạt khi khách chuyển khoản) */}
          <Card className="bg-white border-2 border-indigo-200 shadow-sm rounded-2xl p-6 sm:p-7 space-y-6">
            <div className="flex items-center justify-between border-b border-indigo-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-black">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">2. Tự Động Xác Nhận Giao Dịch Qua payOS Webhook</h2>
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                      Tự động 100%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Khách quét mã chuyển tiền xong ➔ payOS bắn Webhook ➔ Hệ thống tự động kích hoạt Template trong 1 giây</p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enablePayOS !== false}
                  onChange={(e) => setSettings({ ...settings, enablePayOS: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-slate-700">Kích Hoạt payOS</span>
              </label>
            </div>

            {/* Webhook URL Box to copy into payOS */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Đường Dẫn Webhook URL Của Bạn (Dán vào mục Webhook URL trên payOS)
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Sao chép đường link này và dán vào ô <strong>Webhook URL</strong> khi tạo Kênh thanh toán trên <a href="https://payos.vn" target="_blank" rel="noreferrer" className="text-blue-600 font-bold underline">payOS.vn</a>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyWebhook}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                >
                  {copiedWebhook ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWebhook ? 'Đã Sao Chép Link!' : 'Sao Chép Webhook URL'}</span>
                </button>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 font-mono text-xs text-slate-700 font-semibold break-all flex items-center justify-between">
                <span>{webhookUrl}</span>
              </div>
            </div>

            {/* payOS API Credentials */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  payOS Client ID *
                </label>
                <input
                  type="text"
                  value={settings.payosClientId || ''}
                  onChange={(e) => setSettings({ ...settings, payosClientId: e.target.value.trim() })}
                  placeholder="e.g. 5f98a2..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-4 py-2.5 text-xs font-mono text-slate-900 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  payOS API Key *
                </label>
                <input
                  type="password"
                  value={settings.payosApiKey || ''}
                  onChange={(e) => setSettings({ ...settings, payosApiKey: e.target.value.trim() })}
                  placeholder="••••••••••••••••"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-4 py-2.5 text-xs font-mono text-slate-900 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  payOS Checksum Key *
                </label>
                <input
                  type="password"
                  value={settings.payosChecksumKey || ''}
                  onChange={(e) => setSettings({ ...settings, payosChecksumKey: e.target.value.trim() })}
                  placeholder="••••••••••••••••"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-4 py-2.5 text-xs font-mono text-slate-900 outline-none transition-all"
                />
              </div>
            </div>

            <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 space-y-1">
              <strong className="font-bold flex items-center gap-1.5 text-blue-950">
                <CheckCircle2 className="w-4 h-4 text-blue-600" /> Hướng dẫn kết nối trong 3 bước:
              </strong>
              <ol className="list-decimal pl-5 space-y-1 text-slate-700 text-[11px] leading-relaxed">
                <li>Vào <a href="https://payos.vn" target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold">payos.vn</a> ➔ Mục <strong>Kênh thanh toán</strong> ➔ Bấm <strong>Tạo kênh mới</strong> (Liên kết cùng tài khoản ngân hàng của bạn).</li>
                <li>Dán <strong>Webhook URL</strong> phía trên vào ô Webhook URL trên payOS và bấm <strong>Xác nhận Webhook</strong>.</li>
                <li>Copy 3 mã <code>Client ID</code>, <code>API Key</code>, <code>Checksum Key</code> dán vào 3 ô trên và bấm <strong>Lưu Thay Đổi</strong>.</li>
              </ol>
            </div>
          </Card>

          {/* Section 3: Cổng Thẻ Quốc Tế (Visa / Master) & Sandbox */}
          <Card className="bg-white border-2 border-slate-200 shadow-sm rounded-2xl p-6 sm:p-7 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-black">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">3. Cổng Thanh Toán Thẻ Quốc Tế (Visa / MasterCard)</h2>
                  <p className="text-xs text-slate-500">Tích hợp giao diện thẻ trực quan và bảo mật 256-Bit SSL</p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableCardPayment}
                  onChange={(e) => setSettings({ ...settings, enableCardPayment: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-slate-700">Bật Thẻ Quốc Tế</span>
              </label>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Chế Độ Vận Hành
                </label>
                <select
                  value={settings.isSandboxMode ? 'sandbox' : 'live'}
                  onChange={(e) => setSettings({ ...settings, isSandboxMode: e.target.value === 'sandbox' })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-2.5 text-[14px] font-semibold text-slate-900 outline-none transition-all"
                >
                  <option value="sandbox">Sandbox Test (Mô phỏng tự động xác nhận thành công)</option>
                  <option value="live">Live Production (Chế độ thực tế qua Stripe Gateway)</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Stripe Publishable Key (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={settings.stripePublishableKey}
                  onChange={(e) => setSettings({ ...settings, stripePublishableKey: e.target.value })}
                  placeholder="pk_live_..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-2.5 text-xs font-mono text-slate-900 outline-none transition-all"
                />
              </div>
            </div>
          </Card>

          {/* Section 4: Cấu hình Thương hiệu, Subdomain & Cam kết quyền lợi */}
          <Card className="bg-white border-2 border-slate-200 shadow-sm rounded-2xl p-6 sm:p-7 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-black">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">4. Cấu Hình Tên Miền Subdomain & Cam Kết Khách Hàng</h2>
                <p className="text-xs text-slate-500">Tùy biến nội dung cam kết và đuôi domain hiển thị trong ô nhập Subdomain</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Tiêu Đề Trang Thanh Toán
                </label>
                <input
                  type="text"
                  value={settings.checkoutTitle}
                  onChange={(e) => setSettings({ ...settings, checkoutTitle: e.target.value })}
                  placeholder="Portfolio Shop Checkout"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-2.5 text-[14px] font-bold text-slate-900 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Đuôi Subdomain Mặc Định Của Shop
                </label>
                <input
                  type="text"
                  value={settings.defaultSubdomainSuffix}
                  onChange={(e) => setSettings({ ...settings, defaultSubdomainSuffix: e.target.value })}
                  placeholder=".portfolio-shop.com"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-2.5 text-[14px] font-bold text-indigo-600 outline-none transition-all"
                />
              </div>

              <div className="md:col-span-2 space-y-3">
                <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider">
                  3 Dòng Cam Kết Quyền Lợi Hiển Thị Trên Checkout
                </label>
                
                <input
                  type="text"
                  value={settings.perk1}
                  onChange={(e) => setSettings({ ...settings, perk1: e.target.value })}
                  placeholder="Cam kết 1"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  value={settings.perk2}
                  onChange={(e) => setSettings({ ...settings, perk2: e.target.value })}
                  placeholder="Cam kết 2"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  value={settings.perk3}
                  onChange={(e) => setSettings({ ...settings, perk3: e.target.value })}
                  placeholder="Cam kết 3"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Tiêu Đề Thông Báo Khi Thanh Toán Thành Công
                </label>
                <input
                  type="text"
                  value={settings.successMessage}
                  onChange={(e) => setSettings({ ...settings, successMessage: e.target.value })}
                  placeholder="Chúc Mừng Bạn Đã Sở Hữu Portfolio!"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-2.5 text-[14px] font-bold text-slate-900 outline-none transition-all"
                />
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-xs font-bold text-slate-400 hover:text-rose-600 transition-colors"
              >
                Khôi phục cài đặt mặc định
              </button>

              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 px-6 rounded-xl shadow-lg shadow-indigo-600/20"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Đang lưu...' : 'Lưu Thay Đổi Cấu Hình'}
              </Button>
            </div>
          </Card>

        </div>
      )}

      {/* TAB 2: TRANSACTIONS TABLE */}
      {activeTab === 'transactions' && (
        <Card className="bg-white border-2 border-slate-200 shadow-none rounded-[12px] overflow-hidden">
          {loading ? (
            <div className="py-20 flex justify-center"><Loading /></div>
          ) : payments.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-[14px] font-medium">Chưa có bản ghi thanh toán nào.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-slate-100 bg-slate-50/50 text-slate-600 text-[14px] font-bold">
                  <th className="py-3.5 px-4">Mã giao dịch</th>
                  <th className="py-3.5 px-4">Mã đơn hàng</th>
                  <th className="py-3.5 px-4">Cổng thanh toán</th>
                  <th className="py-3.5 px-4">Số tiền</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[14px] font-bold text-slate-900">{p.id}</td>
                    <td className="py-3.5 px-4 font-mono text-sm text-slate-500">{p.orderId}</td>
                    <td className="py-3.5 px-4">{getProviderBadge(p.provider)}</td>
                    <td className="py-3.5 px-4 font-black text-slate-900 text-sm">${p.amount} {p.currency || 'USD'}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[14px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ĐÃ XÁC THỰC
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-sm text-slate-500">
                      {new Date(p.createdAt).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

    </div>
  );
}
