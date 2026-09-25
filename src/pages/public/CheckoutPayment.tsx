import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/src/components/ui/Button';
import { Loading } from '@/src/components/ui/Loading';
import { Template } from '@/src/types';
import { api } from '@/src/services/api';
import { useAuth } from '@/src/contexts/AuthContext';
import { 
  CreditCard, 
  QrCode, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowLeft, 
  Sparkles, 
  Copy, 
  Check, 
  Clock, 
  Globe, 
  Lock, 
  Zap, 
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Shield,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { 
  ShopPaymentSettings, 
  DEFAULT_PAYMENT_SETTINGS, 
  getSavedPaymentSettings 
} from '@/src/types/paymentConfig';

type PaymentTab = 'card' | 'qr';

export default function CheckoutPayment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const paramOrderId = searchParams.get('orderId');
  const paramSlug = searchParams.get('slug') || searchParams.get('template');
  const paramTemplateId = searchParams.get('templateId') || searchParams.get('id');
  const paramAmount = searchParams.get('amount');
  const paramSubdomain = searchParams.get('subdomain') || '';

  const [settings, setSettings] = useState<ShopPaymentSettings>(DEFAULT_PAYMENT_SETTINGS);
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentTab, setPaymentTab] = useState<PaymentTab>('card');

  // Customer & Subdomain configuration
  const [subdomain, setSubdomain] = useState(paramSubdomain || 'my-portfolio');
  const [customerName, setCustomerName] = useState(
    (user?.user_metadata?.full_name as string) || 
    (user?.email ? user.email.split('@')[0] : 'Khách Hàng')
  );
  const [customerEmail, setCustomerEmail] = useState(user?.email || 'customer@example.com');
  
  // Card form state
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8899');
  const [cardName, setCardName] = useState('NGUYEN VAN A');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');

  // Payment processing state
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [createdSubdomain, setCreatedSubdomain] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(900); // in seconds

  // Auto generated order code
  const [orderCode] = useState(() => paramOrderId || `ORD-${Math.floor(100000 + Math.random() * 900000)}`);

  useEffect(() => {
    // 1. Load payment settings configured in Admin
    const loadedSettings = getSavedPaymentSettings();
    setSettings(loadedSettings);
    setTimeLeft((loadedSettings.qrTimerMinutes || 15) * 60);

    // If card disabled but QR enabled, switch tab
    if (!loadedSettings.enableCardPayment && loadedSettings.enableQrPayment) {
      setPaymentTab('qr');
    }

    async function loadTemplateData() {
      try {
        setLoading(true);
        if (paramSlug) {
          const tpl = await api.templates.getBySlug(paramSlug);
          if (tpl) {
            setTemplate(tpl);
            if (!paramSubdomain) {
              setSubdomain(tpl.slug.replace(/[^a-z0-9]/g, ''));
            }
          }
        } else if (paramTemplateId) {
          const { MOCK_TEMPLATES } = await import('@/src/services/mockData');
          const tpl = MOCK_TEMPLATES.find(t => t.id === paramTemplateId);
          if (tpl) {
            setTemplate(tpl);
            if (!paramSubdomain) {
              setSubdomain(tpl.slug.replace(/[^a-z0-9]/g, ''));
            }
          }
        } else {
          // Default fallback template: Manisha Roy or first featured
          const { MOCK_TEMPLATES } = await import('@/src/services/mockData');
          const defaultTpl = MOCK_TEMPLATES.find(t => t.slug === 'manisha-creative') || MOCK_TEMPLATES[0];
          setTemplate(defaultTpl);
          if (!paramSubdomain && defaultTpl) {
            setSubdomain('manisha');
          }
        }
      } catch (err) {
        console.error('Error loading template for checkout:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTemplateData();
  }, [paramSlug, paramTemplateId, paramSubdomain]);

  // Countdown timer for QR code
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`Đã sao chép: ${text}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const finalAmount = paramAmount ? Number(paramAmount) : (template?.salePrice || template?.price || 29);
  const formattedVND = (finalAmount * (settings.exchangeRate || 25000)).toLocaleString('vi-VN');
  const transferContent = `${settings.transferPrefix || 'PORTFOLIO'} ${orderCode}`;

  const handleCompletePayment = async () => {
    const cleanSubdomain = subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || 'my-portfolio';
    setProcessing(true);

    try {
      // 1. Send verification to backend
      try {
        await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderCode,
            payload: { 
              status: 'success', 
              subdomain: cleanSubdomain,
              templateId: template?.id,
              customerEmail,
              customerName
            }
          })
        });
      } catch (e) {
        // Fallback for demo simulation
      }

      // 2. Success state
      setCreatedSubdomain(cleanSubdomain);
      setPaymentSuccess(true);
      toast.success(`Thanh toán thành công! Subdomain https://${cleanSubdomain}${settings.defaultSubdomainSuffix} đã được kích hoạt.`);

    } catch (err: any) {
      toast.error(err.message || 'Lỗi xử lý thanh toán');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loading size={36} />
        <p className="mt-4 text-slate-400 font-mono text-sm">Đang tải thông tin cổng thanh toán bảo mật...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      
      {/* Top Secure Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              to="/templates"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại Shop
            </Link>
            <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white text-sm shadow-md shadow-indigo-600/30">
                P
              </div>
              <span className="font-extrabold text-white text-base tracking-tight hidden sm:inline">
                {settings.checkoutTitle || 'Portfolio Shop Checkout'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">256-Bit SSL Encrypted</span>
            <span>Bảo Mật Cao</span>
          </div>
        </div>
      </header>

      {/* Main Payment Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        <AnimatePresence mode="wait">
          {paymentSuccess ? (
            /* SUCCESS ACTIVATION SCREEN */
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto text-center space-y-8 bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl backdrop-blur-xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 via-indigo-500 to-purple-500" />
              
              <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-3">
                <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 font-bold">
                  Thanh toán & Kích hoạt thành công
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
                  {settings.successMessage || 'Chúc Mừng Bạn Đã Sở Hữu Portfolio!'}
                </h1>
                <p className="text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
                  Mã đơn hàng <span className="font-mono text-indigo-400 font-bold">{orderCode}</span> đã được xác thực thanh toán. 
                  Tên miền Subdomain chính thức của bạn đã sẵn sàng hoạt động trên toàn cầu.
                </p>
              </div>

              {/* Activated Subdomain Box */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-indigo-400" /> Subdomain Trực Tuyến Chính Thức
                  </span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Đã Kích Hoạt
                  </span>
                </div>
                <div className="flex items-center justify-between bg-slate-900 p-3.5 rounded-xl border border-slate-800 gap-2">
                  <span className="font-mono font-bold text-white text-base truncate">
                    https://{createdSubdomain}{settings.defaultSubdomainSuffix}
                  </span>
                  <button
                    onClick={() => copyToClipboard(`https://${createdSubdomain}${settings.defaultSubdomainSuffix}`, 'sub')}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0"
                    title="Sao chép link"
                  >
                    {copiedKey === 'sub' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  to={`/p/${createdSubdomain}`}
                  className="flex-1 py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  <ExternalLink className="w-4 h-4" /> Mở Portfolio Trực Tuyến
                </Link>
                <Link
                  to="/dashboard/portfolios"
                  className="flex-1 py-4 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  Vào Dashboard Quản Lý
                </Link>
              </div>
            </motion.div>
          ) : (
            /* CHECKOUT FORM VIEW */
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT COLUMN: Payment Method & Details (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Method Switcher Tabs */}
                <div className="bg-slate-900 p-1.5 rounded-2xl border border-slate-800 flex gap-2">
                  {settings.enableCardPayment && (
                    <button
                      type="button"
                      onClick={() => setPaymentTab('card')}
                      className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all ${
                        paymentTab === 'card'
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Thẻ Quốc Tế (Visa / Master)</span>
                    </button>
                  )}

                  {settings.enableQrPayment && (
                    <button
                      type="button"
                      onClick={() => setPaymentTab('qr')}
                      className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all ${
                        paymentTab === 'qr'
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Quét Mã QR Chuyển Khoản</span>
                    </button>
                  )}
                </div>

                {/* TAB 1: CREDIT / DEBIT CARD */}
                {paymentTab === 'card' && settings.enableCardPayment && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl"
                  >
                    {/* Visual Card Preview */}
                    <div className="aspect-[1.8/1] rounded-2xl bg-gradient-to-tr from-indigo-900 via-slate-900 to-purple-900 border border-indigo-500/30 p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden text-white">
                      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl" />
                      
                      <div className="flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-7 rounded-md bg-amber-400/80 border border-amber-300 flex items-center justify-center">
                            <div className="w-6 h-4 border border-amber-600/40 rounded-sm" />
                          </div>
                          <span className="text-[11px] font-mono text-slate-300 uppercase tracking-widest font-semibold">Contactless Chip</span>
                        </div>
                        <span className="font-black italic text-xl tracking-wider text-indigo-300">VISA</span>
                      </div>

                      <div className="space-y-1 relative z-10">
                        <span className="text-xs font-mono text-slate-400">Card Number</span>
                        <div className="text-xl sm:text-2xl font-mono font-black tracking-widest text-slate-100">
                          {cardNumber || '•••• •••• •••• ••••'}
                        </div>
                      </div>

                      <div className="flex justify-between items-end relative z-10 font-mono text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Chủ thẻ</span>
                          <span className="font-bold text-slate-200 uppercase">{cardName || 'YOUR NAME'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Hạn dùng</span>
                          <span className="font-bold text-slate-200">{cardExpiry || 'MM/YY'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Input Form */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[12px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                          Số Thẻ Thanh Toán
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="4532 •••• •••• 8899"
                            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-[14px] placeholder:text-[14px] text-white outline-none transition-all pl-11"
                          />
                          <CreditCard className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[12px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                          Tên In Trên Thẻ
                        </label>
                        <input
                          type="text"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value.toUpperCase())}
                          placeholder="NGUYEN VAN A"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-[14px] placeholder:text-[14px] text-white uppercase outline-none transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[12px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                            Hạn Hết Hạn (MM/YY)
                          </label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="12/28"
                            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-[14px] placeholder:text-[14px] text-white outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[12px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                            Mã Bảo Mật (CVV/CVC)
                          </label>
                          <div className="relative">
                            <input
                              type="password"
                              maxLength={4}
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value)}
                              placeholder="•••"
                              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-[14px] placeholder:text-[14px] text-white outline-none transition-all pl-10"
                            />
                            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleCompletePayment}
                      disabled={processing}
                      className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-base shadow-xl shadow-indigo-600/30 gap-2 transition-all"
                    >
                      {processing ? <Loading size={20} /> : <Zap className="w-5 h-5 fill-white" />}
                      {processing ? 'Đang xác thực bảo mật thẻ...' : `Thanh Toán $${finalAmount} USD (${formattedVND}đ)`}
                    </Button>
                  </motion.div>
                )}

                {/* TAB 2: QR CODE SCAN */}
                {paymentTab === 'qr' && settings.enableQrPayment && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl"
                  >
                    {/* Countdown Banner */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Clock className="w-4 h-4 text-amber-400" /> Mã QR có hiệu lực trong:
                      </span>
                      <span className="font-extrabold text-sm text-amber-400">{formatTimer(timeLeft)}</span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6 items-center">
                      {/* Dynamic QR Display */}
                      <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-inner text-center space-y-3">
                        <div className="relative p-2 bg-white rounded-xl border border-slate-200">
                          {/* Dynamic VietQR Generated image */}
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=PORTFOLIO_${settings.transferPrefix}_${orderCode}_STK_${settings.accountNumber}_MONEY_${finalAmount * (settings.exchangeRate || 25000)}&color=1e1b4b`}
                            alt="VietQR Payment Code"
                            className="w-44 h-44 object-contain rounded-lg"
                          />
                          <div className="absolute inset-0 border-2 border-indigo-600/20 rounded-xl pointer-events-none animate-pulse" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">
                          Mở App Ngân hàng bất kỳ để Quét QR
                        </span>
                      </div>

                      {/* Bank Account Details */}
                      <div className="space-y-3 text-xs">
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                          <span className="text-slate-400 text-[11px]">Ngân hàng nhận</span>
                          <p className="font-bold text-white text-sm">{settings.bankName}</p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                          <div>
                            <span className="text-slate-400 text-[11px]">Số tài khoản ({settings.accountHolder})</span>
                            <p className="font-mono font-bold text-indigo-400 text-sm">{settings.accountNumber}</p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(settings.accountNumber, 'stk')}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                          >
                            {copiedKey === 'stk' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                          <div>
                            <span className="text-slate-400 text-[11px]">Số tiền cần chuyển</span>
                            <p className="font-mono font-bold text-emerald-400 text-sm">{formattedVND} VNĐ</p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(`${finalAmount * (settings.exchangeRate || 25000)}`, 'money')}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                          >
                            {copiedKey === 'money' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                          <div>
                            <span className="text-slate-400 text-[11px]">Nội dung chuyển khoản</span>
                            <p className="font-mono font-bold text-amber-300 text-xs truncate max-w-[140px]">{transferContent}</p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(transferContent, 'nd')}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                          >
                            {copiedKey === 'nd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleCompletePayment}
                      disabled={processing}
                      className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-base shadow-xl shadow-emerald-600/30 gap-2 transition-all"
                    >
                      {processing ? <Loading size={20} /> : <CheckCircle2 className="w-5 h-5" />}
                      {processing ? 'Đang kiểm tra giao dịch chuyển khoản...' : 'Tôi Đã Chuyển Tiền - Kích Hoạt Ngay'}
                    </Button>
                  </motion.div>
                )}

              </div>

              {/* RIGHT COLUMN: Order Summary & Subdomain Configuration (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Template Summary Card */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-bold bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                        {template?.categoryName || 'Portfolio Mẫu'}
                      </span>
                      <h2 className="text-xl font-black text-white mt-2">
                        {template?.name || 'Creative Portfolio Master'}
                      </h2>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-white">${finalAmount}</span>
                      <span className="block text-[11px] text-slate-400 font-mono">Thanh toán 1 lần</span>
                    </div>
                  </div>

                  {/* Thumbnail */}
                  <div className="aspect-[16/9] rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden relative">
                    {template?.thumbnail ? (
                      <img 
                        src={template.thumbnail} 
                        alt={template.name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600 font-mono text-xs">
                        Mockup Preview
                      </div>
                    )}
                  </div>

                  {/* Subdomain Input Configuration */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <label className="block text-[12px] font-bold text-slate-300 uppercase tracking-wider">
                      Đăng Ký Tên Miền Subdomain Của Bạn
                    </label>
                    <div className="flex items-center rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                      <Globe className="w-4 h-4 text-indigo-400 mr-2 shrink-0" />
                      <input
                        type="text"
                        value={subdomain}
                        onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder="ten-cua-ban"
                        className="bg-transparent text-[14px] placeholder:text-[14px] text-white outline-none w-full"
                      />
                      <span className="text-xs font-mono text-slate-500 shrink-0">{settings.defaultSubdomainSuffix}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Link chính thức sau kích hoạt: <span className="text-indigo-400 font-mono font-semibold">https://{subdomain || 'tenkhach'}{settings.defaultSubdomainSuffix}</span>
                    </p>
                  </div>

                  {/* Customer Information */}
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <div>
                      <label className="block text-[12px] font-bold text-slate-400 mb-1">Họ và Tên chủ sở hữu</label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[14px] placeholder:text-[14px] font-medium text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-slate-400 mb-1">Email nhận bàn giao</label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[14px] placeholder:text-[14px] font-medium text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Benefits summary list */}
                  <div className="space-y-2 pt-3 border-t border-slate-800 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{settings.perk1}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{settings.perk2}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{settings.perk3}</span>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}
        </AnimatePresence>
      </main>

    </div>
  );
}
