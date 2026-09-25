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
  Sliders
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  ShopPaymentSettings, 
  DEFAULT_PAYMENT_SETTINGS, 
  getSavedPaymentSettings, 
  savePaymentSettings 
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

  useEffect(() => {
    // Load saved settings
    setSettings(getSavedPaymentSettings());

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

  const handleSave = () => {
    setSaving(true);
    try {
      savePaymentSettings(settings);
      toast.success('Đã lưu thành công cấu hình Trang Thanh Toán!');
    } catch (e) {
      toast.error('Lỗi khi lưu cấu hình');
    } finally {
      setTimeout(() => setSaving(false), 300);
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
                  <h2 className="text-base font-bold text-slate-900">1. Thông Tin Nhận Tiền Ngân Hàng (Quét QR VietQR)</h2>
                  <p className="text-xs text-slate-500">Hiển thị khi khách hàng chọn chuyển khoản quét mã QR</p>
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

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Tên Ngân Hàng Nhận Tiền
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="popular-banks"
                    value={settings.bankName}
                    onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                    placeholder="MB BANK (Quân Đội)"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-2.5 text-[14px] font-semibold text-slate-900 outline-none transition-all"
                  />
                  <datalist id="popular-banks">
                    {POPULAR_BANKS.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Số Tài Khoản (STK)
                </label>
                <input
                  type="text"
                  value={settings.accountNumber}
                  onChange={(e) => setSettings({ ...settings, accountNumber: e.target.value })}
                  placeholder="0988889999"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-2.5 text-[14px] font-bold text-indigo-600 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Tên Chủ Tài Khoản (In Hoa)
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
                    className="w-1/2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-2.5 text-[14px] font-bold text-slate-900 outline-none transition-all uppercase"
                  />
                  <span className="text-xs font-mono font-bold text-slate-500">+ [MÃ ĐƠN HÀNG]</span>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Tỷ Giá Quy Đổi (1 USD = ? VNĐ)
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
                <p className="text-[11px] text-slate-400 mt-1">Ví dụ: $29 sẽ tương đương {(29 * settings.exchangeRate).toLocaleString('vi-VN')} VNĐ</p>
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
            </div>
          </Card>

          {/* Section 2: Cổng Thẻ Quốc Tế (Visa / Master) & Sandbox */}
          <Card className="bg-white border-2 border-slate-200 shadow-sm rounded-2xl p-6 sm:p-7 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-black">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">2. Cổng Thanh Toán Thẻ Quốc Tế (Visa / MasterCard)</h2>
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

          {/* Section 3: Cấu hình Thương hiệu, Subdomain & Cam kết quyền lợi */}
          <Card className="bg-white border-2 border-slate-200 shadow-sm rounded-2xl p-6 sm:p-7 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-black">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">3. Cấu Hình Tên Miền Subdomain & Cam Kết Khách Hàng</h2>
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
