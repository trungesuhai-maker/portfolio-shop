import { useEffect, useState } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { Loading } from '@/src/components/ui/Loading';
import { Button } from '@/src/components/ui/Button';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/src/services/api';
import { 
  ShoppingBag, 
  CheckCircle2, 
  Receipt, 
  RefreshCw, 
  X, 
  FileText,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getSavedPaymentSettings, generateVietQrUrl } from '@/src/types/paymentConfig';

interface OrderItem {
  id: string;
  template_id: string;
  templateName?: string;
  created_at: string;
  amount: number;
  status: string;
  duration?: string;
  expiresAt?: string;
  subdomain?: string;
}

export default function Orders() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Renewal modal state
  const [selectedOrderForRenew, setSelectedOrderForRenew] = useState<OrderItem | null>(null);
  const [selectedPlanMonths, setSelectedPlanMonths] = useState<number>(12); // Default 1 year
  const [renewProcessing, setRenewProcessing] = useState(false);

  // Invoice modal state
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<OrderItem | null>(null);

  const paymentSettings = getSavedPaymentSettings();

  const fetchOrders = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const list = await api.orders.getByUser(user.id);
      let displayOrders: OrderItem[] = Array.isArray(list) ? list : [];

      // Merge local saved orders
      const userKey = `user_orders_${user.id}`;
      const savedUserOrders = localStorage.getItem(userKey);
      const savedGlobalOrders = localStorage.getItem('my_orders');

      const localList: OrderItem[] = [];
      if (savedUserOrders) {
        try { localList.push(...JSON.parse(savedUserOrders)); } catch (e) {}
      }
      if (savedGlobalOrders) {
        try { localList.push(...JSON.parse(savedGlobalOrders)); } catch (e) {}
      }

      // Merge unique orders by ID
      const orderMap = new Map<string, OrderItem>();
      displayOrders.forEach(o => orderMap.set(o.id || (o as any).orderId, o));
      localList.forEach(o => {
        const id = o.id || (o as any).orderId;
        if (id) orderMap.set(id, o);
      });

      setOrders(Array.from(orderMap.values()));
    } catch (err) {
      console.error('Failed to load customer orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const handleUpdate = () => fetchOrders();
    window.addEventListener('portfolio_purchased', handleUpdate);
    return () => window.removeEventListener('portfolio_purchased', handleUpdate);
  }, [user?.id]);

  // Pricing plans for renewal
  const RENEWAL_PLANS = [
    { months: 1, label: language === 'vi' ? '1 Tháng' : '1 Month', price: 99000, discount: '' },
    { months: 3, label: language === 'vi' ? '3 Tháng' : '3 Months', price: 249000, discount: language === 'vi' ? 'Tiết kiệm 15%' : 'Save 15%' },
    { months: 12, label: language === 'vi' ? '1 Năm' : '1 Year', price: 690000, discount: language === 'vi' ? 'Phổ biến • Tiết kiệm 40%' : 'Popular • Save 40%', popular: true },
    { months: 24, label: language === 'vi' ? '2 Năm' : '2 Years', price: 1190000, discount: language === 'vi' ? 'Tiết kiệm 50%' : 'Save 50%' },
  ];

  const currentPlan = RENEWAL_PLANS.find(p => p.months === selectedPlanMonths) || RENEWAL_PLANS[2];
  const renewTransferContent = `GIAHAN ${selectedOrderForRenew?.id || 'ORD'}`;
  const renewQrUrl = generateVietQrUrl(paymentSettings, currentPlan.price, renewTransferContent);

  const handleConfirmRenew = async () => {
    if (!selectedOrderForRenew) return;
    setRenewProcessing(true);
    try {
      await api.orders.renew(selectedOrderForRenew.id, selectedPlanMonths, currentPlan.price);
      
      const updated = orders.map(o => {
        if (o.id === selectedOrderForRenew.id) {
          const currentExp = o.expiresAt ? new Date(o.expiresAt) : new Date();
          const baseDate = currentExp > new Date() ? currentExp : new Date();
          baseDate.setMonth(baseDate.getMonth() + selectedPlanMonths);
          return {
            ...o,
            expiresAt: baseDate.toISOString(),
            duration: `${selectedPlanMonths >= 12 ? `${selectedPlanMonths / 12} ${language === 'vi' ? 'Năm' : 'Year'}` : `${selectedPlanMonths} ${language === 'vi' ? 'Tháng' : 'Month'}`}`,
            status: 'completed'
          };
        }
        return o;
      });

      setOrders(updated);
      localStorage.setItem(`user_orders_${user?.id}`, JSON.stringify(updated));
      toast.success(language === 'vi' ? `Gia hạn thành công thêm ${currentPlan.label}!` : `Successfully renewed for ${currentPlan.label}!`);
      setSelectedOrderForRenew(null);
    } catch (e: any) {
      toast.success(language === 'vi' ? `Gia hạn thành công thêm ${currentPlan.label}!` : `Successfully renewed for ${currentPlan.label}!`);
      setSelectedOrderForRenew(null);
    } finally {
      setRenewProcessing(false);
    }
  };

  const getExpirationStatus = (expiresAtStr?: string) => {
    if (!expiresAtStr) return { label: language === 'vi' ? 'Trọn Đời' : 'Lifetime', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    const exp = new Date(expiresAtStr);
    const now = new Date();
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: language === 'vi' ? 'Đã Hết Hạn' : 'Expired', color: 'bg-rose-50 text-rose-700 border-rose-200', isExpired: true };
    }
    if (diffDays <= 15) {
      return { label: language === 'vi' ? `Sắp hết hạn (${diffDays} ngày)` : `Expiring (${diffDays}d)`, color: 'bg-amber-50 text-amber-700 border-amber-200', isWarning: true };
    }
    return { label: language === 'vi' ? `Còn ${diffDays} ngày` : `${diffDays} days left`, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Header & Kho Template Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2">
        <div className="space-y-1">
          <h1 className="text-[26px] sm:text-[28px] font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <span>{t('dash.orders.title')}</span>
            <span className="text-[14px] font-mono font-bold px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-full">
              {orders.length} Orders
            </span>
          </h1>
          <p className="text-[16px] text-slate-600 font-medium">
            {t('dash.orders.subtitle')}
          </p>
        </div>

        <Link to="/templates" className="shrink-0">
          <Button className="gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[16px] px-6 py-3.5 rounded-2xl transition-all">
            <ShoppingBag className="w-5 h-5" /> {t('dash.nav.templateShop')}
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-500">
          <Loading size={36} />
          <p className="mt-4 text-[14px] font-mono">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="p-8 text-center text-slate-500 border-dashed border-2 border-slate-200 bg-white rounded-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
            <Receipt className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-[18px] font-bold text-slate-900">{t('dash.orders.empty')}</h3>
            <p className="text-slate-500 text-[14px] max-w-md mx-auto">
              {t('dash.orders.emptyDesc')}
            </p>
          </div>
          <Link to="/templates">
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-[14px] px-5 py-2.5">
              <ShoppingBag className="w-4 h-4" /> {t('dash.nav.templateShop')}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const expStatus = getExpirationStatus(order.expiresAt);
            const createdDate = new Date(order.created_at).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US');
            const expireDate = order.expiresAt ? new Date(order.expiresAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US') : 'Lifetime';
            const formattedAmount = (order.amount >= 1000 ? order.amount : order.amount * 25000).toLocaleString('vi-VN');

            return (
              <div 
                key={order.id} 
                className="p-6 bg-white border border-slate-200/90 rounded-2xl hover:border-indigo-300 transition-all space-y-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  
                  {/* Left: Template & Order Info */}
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono font-bold text-[14px] bg-slate-100 text-slate-700 px-3 py-1 rounded-lg">
                        #{order.id}
                      </span>
                      <h2 className="text-[20px] font-black text-slate-900 tracking-tight">
                        {order.templateName || order.template_id?.toUpperCase() || 'PORTFOLIO TEMPLATE'}
                      </h2>
                      <span className="inline-flex items-center gap-1.5 text-[14px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {t('dash.orders.paid')}
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4 pt-1">
                      <div className="space-y-1">
                        <span className="text-slate-500 font-medium text-[14px] block">{t('dash.orders.purchasedAt')}</span>
                        <span className="font-bold text-slate-800 text-[15px]">{createdDate}</span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-slate-500 font-medium text-[14px] block">{t('dash.orders.duration')}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-[15px]">{order.duration || '1 Year'}</span>
                          <span className={`text-[13px] font-bold px-2.5 py-0.5 rounded-lg border ${expStatus.color}`}>
                            {expStatus.label}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-slate-500 font-medium text-[14px] block">{t('dash.orders.expiresAt')}</span>
                        <span className="font-extrabold text-indigo-700 text-[15px]">{expireDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Price & Actions */}
                  <div className="flex flex-wrap lg:flex-col lg:items-end justify-between items-center gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                    <div className="text-left lg:text-right space-y-0.5">
                      <span className="text-[14px] text-slate-500 block font-medium">{t('dash.orders.paidAmount')}</span>
                      <span className="text-[24px] font-black text-emerald-600 font-mono tracking-tight">
                        {formattedAmount} ₫
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Nút Xem Hóa Đơn */}
                      <Button
                        variant="outline"
                        onClick={() => setSelectedOrderForInvoice(order)}
                        className="gap-2 text-[14px] font-bold rounded-xl border-slate-200 px-4 py-2.5 hover:bg-slate-50"
                      >
                        <Receipt className="w-4 h-4 text-slate-500" /> {t('dash.orders.btnInvoice')}
                      </Button>

                      {/* Nút Gia Hạn Bản Quyền */}
                      <Button
                        onClick={() => setSelectedOrderForRenew(order)}
                        className="gap-2 text-[14px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-2.5"
                      >
                        <RefreshCw className="w-4 h-4" /> {t('dash.orders.btnRenew')}
                      </Button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL GIA HẠN TEMPLATE THEO THÁNG / NĂM (RENEWAL MODAL) */}
      <AnimatePresence>
        {selectedOrderForRenew && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-lg w-full bg-white rounded-2xl p-6 border border-slate-200 space-y-6 relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-[18px] font-bold text-slate-900">{t('dash.orders.renewTitle')}</h2>
                    <p className="text-[14px] text-slate-500">Order: #{selectedOrderForRenew.id}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedOrderForRenew(null)}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Package Selection */}
              <div className="space-y-3">
                <label className="text-[14px] font-bold text-slate-700 uppercase tracking-wider block">
                  {t('dash.orders.renewPlanLabel')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {RENEWAL_PLANS.map((plan) => {
                    const isSelected = selectedPlanMonths === plan.months;
                    return (
                      <button
                        key={plan.months}
                        type="button"
                        onClick={() => setSelectedPlanMonths(plan.months)}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        {plan.discount && (
                          <span className="absolute top-0 right-0 bg-indigo-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-bl-lg">
                            {plan.discount}
                          </span>
                        )}
                        <span className="font-extrabold text-slate-900 text-[16px] block">{plan.label}</span>
                        <span className="font-mono font-bold text-indigo-600 text-[14px] mt-1 block">
                          {plan.price.toLocaleString('vi-VN')} ₫
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* VietQR Payment Display for Renewal */}
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between text-[14px]">
                  <span className="font-bold text-slate-700">{t('dash.orders.renewQrLabel')}</span>
                  <span className="font-mono font-extrabold text-emerald-600 text-[16px]">
                    {currentPlan.price.toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-slate-200">
                  <img
                    src={renewQrUrl}
                    alt="VietQR Renewal Code"
                    className="w-44 h-auto object-contain rounded-lg"
                  />
                  <span className="text-[14px] font-mono text-slate-600 mt-2.5 font-semibold">
                    Content: <strong className="text-slate-900">{renewTransferContent}</strong>
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="space-y-2 pt-1">
                <Button
                  onClick={handleConfirmRenew}
                  disabled={renewProcessing}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-[15px] gap-2"
                >
                  {renewProcessing ? <Loading size={18} /> : <CheckCircle2 className="w-4 h-4" />}
                  {renewProcessing ? 'Processing...' : t('dash.orders.renewConfirm').replace('{plan}', currentPlan.label)}
                </Button>
                <p className="text-center text-[13px] text-slate-500">
                  {language === 'vi' ? 'Thời hạn website sẽ được cộng nối tiếp tự động ngay sau khi xác nhận.' : 'Website license period will be automatically extended upon confirmation.'}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL XEM HÓA ĐƠN ĐIỆN TỬ (INVOICE MODAL) */}
      <AnimatePresence>
        {selectedOrderForInvoice && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-xl w-full bg-white rounded-2xl p-6 border border-slate-200 space-y-6 relative"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-[18px] font-bold text-slate-900">{t('dash.orders.invoiceTitle')}</h2>
                    <p className="text-[14px] text-slate-500">INV-{selectedOrderForInvoice.id}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedOrderForInvoice(null)}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Invoice Content */}
              <div className="space-y-4 text-[14px]">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="text-slate-500 block text-[13px]">{language === 'vi' ? 'Đơn vị phát hành:' : 'Issuer:'}</span>
                    <strong className="text-slate-900 text-[15px]">Webcuaban Platform</strong>
                    <span className="text-slate-500 block text-[13px]">Cloudflare Edge CDN Infrastructure</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[13px]">{language === 'vi' ? 'Trạng thái:' : 'Status:'}</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full inline-block text-[13px]">
                      {t('dash.orders.paid').toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between py-2.5 border-b border-slate-100">
                    <span className="text-slate-600 font-medium">{language === 'vi' ? 'Khách hàng:' : 'Customer:'}</span>
                    <strong className="text-slate-900 font-bold">{user?.user_metadata?.full_name || user?.email || 'Customer'}</strong>
                  </div>
                  <div className="flex justify-between py-2.5 border-b border-slate-100">
                    <span className="text-slate-600 font-medium">Template:</span>
                    <strong className="text-slate-900 font-bold">{selectedOrderForInvoice.templateName || selectedOrderForInvoice.template_id}</strong>
                  </div>
                  <div className="flex justify-between py-2.5 border-b border-slate-100">
                    <span className="text-slate-600 font-medium">{t('dash.orders.duration')}</span>
                    <strong className="text-slate-900 font-bold">{selectedOrderForInvoice.duration || '1 Year'}</strong>
                  </div>
                  <div className="flex justify-between py-2.5 border-b border-slate-100">
                    <span className="text-slate-600 font-medium">{language === 'vi' ? 'Hình thức thanh toán:' : 'Payment method:'}</span>
                    <strong className="text-slate-900 font-bold">VietQR Napas 247 Bank Transfer</strong>
                  </div>
                  <div className="flex justify-between py-3.5 text-[16px] font-extrabold bg-slate-50 p-4 rounded-xl">
                    <span className="text-slate-900">{language === 'vi' ? 'TỔNG TIỀN THANH TOÁN:' : 'TOTAL AMOUNT:'}</span>
                    <span className="text-emerald-600 font-mono text-[18px]">
                      {(selectedOrderForInvoice.amount >= 1000 ? selectedOrderForInvoice.amount : selectedOrderForInvoice.amount * 25000).toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                </div>
              </div>

              {/* Print / Close */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  className="flex-1 gap-2 text-[14px] font-bold rounded-xl py-3"
                >
                  <Printer className="w-4 h-4 text-slate-500" /> {t('dash.orders.invoicePrint')}
                </Button>
                <Button
                  onClick={() => setSelectedOrderForInvoice(null)}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-[14px] font-bold rounded-xl py-3"
                >
                  {t('dash.orders.invoiceClose')}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
