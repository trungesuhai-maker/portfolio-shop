import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/src/components/ui/Button';
import { Loading } from '@/src/components/ui/Loading';
import { Template } from '@/src/types';
import { api } from '@/src/services/api';
import { useAuth } from '@/src/contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '@/src/lib/supabase';
import { 
  QrCode, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowLeft, 
  Sparkles, 
  Copy, 
  Check, 
  Clock, 
  Globe, 
  ExternalLink,
  Shield,
  FolderTree,
  Terminal,
  Lock,
  Zap,
  Building2,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { 
  ShopPaymentSettings, 
  DEFAULT_PAYMENT_SETTINGS, 
  getSavedPaymentSettings,
  generateVietQrUrl 
} from '@/src/types/paymentConfig';
import { createPayosPaymentLink, checkPayosPaymentDirect } from '@/src/services/payosClient';

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

  // Derive initial user ID / username
  const initialUsername = (() => {
    if (paramSubdomain) return paramSubdomain;
    if (user?.user_metadata?.username) return user.user_metadata.username;
    if (user?.phone) return user.phone.replace(/[^0-9]/g, '');
    if (user?.email) return user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9-]/g, '');
    return 'trung';
  })();

  // Subdomain & Customer configuration (Cách A)
  const [subdomain, setSubdomain] = useState(initialUsername);
  const [customerName, setCustomerName] = useState(
    (user?.user_metadata?.full_name as string) || 
    (user?.email ? user.email.split('@')[0] : 'Trần Văn Trung')
  );
  const [customerEmail, setCustomerEmail] = useState(user?.email || 'customer@example.com');
  
  // Payment processing state
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [createdSubdomain, setCreatedSubdomain] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins

  // Auto generated order code
  const [orderCode] = useState(() => paramOrderId || `ORD-${Math.floor(100000 + Math.random() * 900000)}`);

  useEffect(() => {
    // 1. Load payment settings configured in Admin (cached + server sync)
    const loadedSettings = getSavedPaymentSettings();
    setSettings(loadedSettings);
    setTimeLeft((loadedSettings.qrTimerMinutes || 15) * 60);

    // Fetch latest payment settings from backend
    fetch('/api/payment-settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.accountNumber) {
          setSettings(prev => ({ ...prev, ...data }));
          if (data.qrTimerMinutes) {
            setTimeLeft(data.qrTimerMinutes * 60);
          }
        }
      })
      .catch(() => {});

    async function loadTemplateData() {
      try {
        setLoading(true);
        if (paramSlug) {
          const tpl = await api.templates.getBySlug(paramSlug);
          if (tpl) setTemplate(tpl);
        } else if (paramTemplateId) {
          const { MOCK_TEMPLATES } = await import('@/src/services/mockData');
          const tpl = MOCK_TEMPLATES.find(t => t.id === paramTemplateId);
          if (tpl) setTemplate(tpl);
        } else {
          const { MOCK_TEMPLATES } = await import('@/src/services/mockData');
          const defaultTpl = MOCK_TEMPLATES.find(t => t.slug === 'port-photograph') || MOCK_TEMPLATES[0];
          setTemplate(defaultTpl);
        }
      } catch (err) {
        console.error('Error loading template for checkout:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTemplateData();
  }, [paramSlug, paramTemplateId]);

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

  // Synchronize price: take discount sale price or default
  const originalPrice = template?.price || 490000;
  const salePrice = template?.salePrice || template?.price || 390000;
  const finalAmount = paramAmount ? Number(paramAmount) : salePrice;

  const amountVND = (template?.currency === 'VND' || finalAmount >= 1000)
    ? finalAmount
    : Math.round(finalAmount * (settings.exchangeRate || 25000));
  const formattedVND = amountVND.toLocaleString('vi-VN');
  
  const cleanOrderCode = orderCode.replace(/[-_]/g, '');
  const transferContent = `${settings.transferPrefix || 'PORTFOLIO'} ${cleanOrderCode}`;
  const vietQrUrl = generateVietQrUrl(settings, amountVND, transferContent);

  // Official payOS Payment Link & Dynamic QR State
  const [payosData, setPayosData] = useState<{
    checkoutUrl?: string;
    qrCode?: string;
    qrImageUrl?: string;
    accountNumber?: string;
    accountName?: string;
    description?: string;
    orderCode?: number;
  } | null>(null);
  const [payosLoading, setPayosLoading] = useState(false);

  // Numeric order code for payOS (between 100000 and 999999)
  const numericCode = parseInt(cleanOrderCode.replace(/\D/g, ''), 10) || Math.floor(100000 + Math.random() * 899000);

  // Initialize official payOS payment request with merchant backend / direct fallback
  const initPayosOrder = useCallback((targetCode?: number) => {
    if (!amountVND || amountVND <= 0) return;
    const finalCode = targetCode || numericCode;
    setPayosLoading(true);

    createPayosPaymentLink(amountVND, finalCode, `ORD${finalCode}`)
      .then(data => {
        if (data && data.success) {
          setPayosData(data);
        }
      })
      .catch(err => {
        console.warn('payOS fallback to local VietQR:', err);
      })
      .finally(() => {
        setPayosLoading(false);
      });
  }, [amountVND, numericCode]);

  useEffect(() => {
    initPayosOrder();
  }, [initPayosOrder]);

  // Active display values (Strict payOS synchronization)
  const activeQrUrl = payosData?.qrImageUrl || vietQrUrl;
  const activeAccountNumber = settings.accountNumber || payosData?.accountNumber || '13316437';
  const activeAccountName = settings.accountHolder || payosData?.accountName || 'TRAN QUANG TRUNG';
  const activeTransferMemo = payosData?.description || (payosLoading ? 'Đang tạo mã định danh payOS...' : transferContent);

  const cleanSubdomain = (subdomain || 'trung').trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || 'trung';
  const templateSlug = template?.slug || 'photograph';
  
  // Clean Subdomain & Subpath URLs
  const liveWebsiteUrl = `https://${cleanSubdomain}.webcuaban.site`;

  // Multi-tenant Admin URL for Template (Phương án 2)
  const baseAdminUrl = (template?.adminUrl || '').trim() 
    || (template?.originUrl ? `${template.originUrl.replace(/\/$/, '')}/admin.html` : '')
    || (template?.demoUrl ? `${template.demoUrl.replace(/\/$/, '')}/admin.html` : '')
    || `https://${cleanSubdomain}.webcuaban.site/admin.html`;

  const adminWebsiteUrl = (() => {
    if (baseAdminUrl.startsWith('http://') || baseAdminUrl.startsWith('https://')) {
      const sep = baseAdminUrl.includes('?') ? '&' : '?';
      return `${baseAdminUrl}${sep}licensed=true&trial=false&hideBanner=true&mode=published&licenseKey=activated&domain=${encodeURIComponent(`${cleanSubdomain}.webcuaban.site`)}&instance=inst-${cleanSubdomain}&user=${encodeURIComponent(cleanSubdomain)}&tenant=${encodeURIComponent(cleanSubdomain)}`;
    }
    return `/dashboard/portfolios/inst-${cleanSubdomain}/edit`;
  })();

  const handleCompletePayment = async () => {
    if (paymentSuccess) return;
    setProcessing(true);
    try {
      const nowIso = new Date().toISOString();
      const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const targetUserId = user?.id || 'usr-customer';

      // Inherit draft customizations if the user edited this template beforehand
      let initialCustomData: any = {
        hero_title: customerName || cleanSubdomain.toUpperCase(),
        hero_subtitle: 'Portfolio AI Studio đã kích hoạt bản quyền chính thức'
      };

      try {
        let foundCustomData: any = null;
        const validUserId = user?.id && user.id.includes('-') && user.id.length >= 32 ? user.id : null;
        const templateId = template?.id || 't1';
        const templateSlug = (template?.slug || 'template').replace(/^port-/, '');

        // 1. Check Supabase Database for existing drafts
        if (isSupabaseConfigured) {
          try {
            const possibleDraftIds = [
              `draft-${user?.id}-${templateId}`,
              `draft-${user?.id}-${templateSlug}`,
              `draft-${cleanSubdomain}-${templateId}`,
              `draft-${cleanSubdomain}`,
              `draft-guest-${templateSlug}`,
              `draft-guest-videograph`
            ];

            const { data: supaDrafts } = await supabase
              .from('portfolio_instances')
              .select('*')
              .or(`id.in.(${possibleDraftIds.map(id => `"${id}"`).join(',')})${validUserId ? `,user_id.eq.${validUserId}` : ''}`);

            if (supaDrafts && supaDrafts.length > 0) {
              const matched = supaDrafts.find((d: any) => 
                (d.template_id === templateId || d.id.includes(templateId) || d.id.includes(templateSlug)) &&
                (d.custom_data || d.published_data)
              ) || supaDrafts[0];

              const dataCandidate = matched.custom_data || matched.published_data;
              if (dataCandidate && typeof dataCandidate === 'object' && Object.keys(dataCandidate).length > 0) {
                foundCustomData = dataCandidate;
              }
            }
          } catch (supaErr) {
            console.warn('[CheckoutPayment] Supabase draft fetch fallback:', supaErr);
          }
        }

        // 2. Check Backend Server API for existing drafts
        if (!foundCustomData) {
          const apiDraftIds = [
            `draft-${user?.id}-${templateId}`,
            `draft-${user?.id}-${templateSlug}`,
            `draft-${cleanSubdomain}-${templateId}`,
            `draft-${cleanSubdomain}`
          ];
          for (const dId of apiDraftIds) {
            try {
              const res = await fetch(`/api/portfolios/${encodeURIComponent(dId)}`);
              if (res.ok) {
                const pData = await res.json();
                if (pData && (pData.custom_data || pData.published_data)) {
                  const dataCandidate = pData.custom_data || pData.published_data;
                  if (dataCandidate && typeof dataCandidate === 'object' && Object.keys(dataCandidate).length > 0) {
                    foundCustomData = dataCandidate;
                    break;
                  }
                }
              }
            } catch (e) {}
          }
        }

        // 3. Check user-scoped draft keys in localStorage
        if (!foundCustomData && typeof window !== 'undefined') {
          const draftKeysToCheck = [
            `portfolio_data_draft-${user?.id}-${templateId}`,
            `portfolio_data_draft-${user?.id}-${templateSlug}`,
            `portfolio_data_draft-${cleanSubdomain}`,
            `portfolio_data_draft-${cleanSubdomain}-${templateId}`,
            `portfolio_data_draft-guest-${templateSlug}`,
            `portfolio_data_draft-guest-videograph`,
            `draft_${user?.id}_${templateId}`,
            `draft_${templateId}`,
            `portfolio_data_inst-${cleanSubdomain}`,
            `videograph_portfolio_data`,
            `videograph_portfolio_data_v1`,
            `portfolio_data_guest`
          ];

          for (const key of draftKeysToCheck) {
            const raw = localStorage.getItem(key);
            if (raw) {
              try {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
                  foundCustomData = parsed;
                  break;
                }
              } catch (e) {}
            }
          }
        }

        // 4. Check user_drafts_${userId} list in localStorage
        if (!foundCustomData && user?.id && typeof window !== 'undefined') {
          const userDraftsRaw = localStorage.getItem(`user_drafts_${user.id}`);
          if (userDraftsRaw) {
            try {
              const draftsList = JSON.parse(userDraftsRaw);
              if (Array.isArray(draftsList)) {
                const matchedDraft = draftsList.find((d: any) => 
                  d.template_id === templateId || 
                  d.id === `draft-${user.id}-${templateId}` ||
                  d.template?.id === templateId
                );
                if (matchedDraft && matchedDraft.custom_data && Object.keys(matchedDraft.custom_data).length > 0) {
                  foundCustomData = matchedDraft.custom_data;
                }
              }
            } catch (e) {}
          }
        }

        if (foundCustomData) {
          initialCustomData = { ...initialCustomData, ...foundCustomData };
        }
      } catch (draftErr) {
        console.warn('[CheckoutPayment] Draft inheritance notice:', draftErr);
      }

      // Pre-save into new official instance localStorage keys for instant reactivity
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`portfolio_data_inst-${cleanSubdomain}`, JSON.stringify(initialCustomData));
          localStorage.setItem(`portfolio_data_${cleanSubdomain}`, JSON.stringify(initialCustomData));
          localStorage.setItem('videograph_portfolio_data_v1', JSON.stringify(initialCustomData));
          localStorage.setItem('videograph_portfolio_data', JSON.stringify(initialCustomData));
        } catch (e) {}
      }

      // Construct Portfolio Instance
      const newPortfolio = {
        id: `inst-${cleanSubdomain}`,
        user_id: targetUserId,
        template_id: template?.id || 't1',
        name: template?.name || 'PORT PHOTOGRAPH',
        subdomain: cleanSubdomain,
        status: 'published',
        created_at: nowIso,
        updated_at: nowIso,
        template: template || undefined,
        custom_data: initialCustomData
      };

      // Construct Order Item
      const newOrder = {
        id: orderCode,
        orderId: orderCode,
        user_id: targetUserId,
        template_id: template?.id || 't1',
        templateName: template?.name || 'PORT PHOTOGRAPH',
        customer_email: customerEmail,
        customer_name: customerName,
        amount: amountVND,
        status: 'completed',
        duration: '1 Năm',
        expiresAt: oneYearLater,
        created_at: nowIso,
        subdomain: cleanSubdomain
      };

      // Direct Persistence into Supabase Database (Real Source of Truth)
      if (isSupabaseConfigured) {
        try {
          const validUserId = user?.id && user.id.includes('-') && user.id.length >= 32 ? user.id : null;
          const siteUrl = `https://${cleanSubdomain}.webcuaban.site`;
          const viewerUrl = `/p/${cleanSubdomain}`;
          const originUrl = template?.originUrl || template?.demoUrl || `https://webcuaban.site/p/${cleanSubdomain}`;
          const demoUrl = template?.demoUrl || originUrl;
          const adminUrl = adminWebsiteUrl;

          // 1. Insert/Upsert Order in public.orders
          await supabase.from('orders').upsert({
            id: orderCode,
            user_id: validUserId,
            customer_name: customerName,
            customer_email: customerEmail,
            customer_phone: (user as any)?.phone || null,
            template_id: template?.id || 't1',
            amount: amountVND,
            currency: 'VND',
            status: 'paid',
            payment_method: 'payos',
            transaction_ref: payosData?.description || transferContent,
            instance_id: `inst-${cleanSubdomain}`,
            metadata: {
              template_name: template?.name || 'PORT PHOTOGRAPH',
              subdomain: cleanSubdomain,
              site_url: siteUrl,
              viewer_url: viewerUrl,
              origin_url: originUrl,
              demo_url: demoUrl,
              admin_url: adminUrl,
              duration: '1 Năm'
            }
          });

          // 2. Insert Payment in public.payments
          await supabase.from('payments').upsert({
            id: `pay-${Date.now()}`,
            order_id: orderCode,
            amount: amountVND,
            currency: 'VND',
            gateway: 'vietqr_payos',
            transaction_id: payosData?.orderCode ? String(payosData.orderCode) : orderCode,
            status: 'completed',
            raw_payload: { subdomain: cleanSubdomain, template_id: template?.id, site_url: siteUrl }
          });

          // 3. Insert Portfolio in public.portfolio_instances
          await supabase.from('portfolio_instances').upsert({
            id: `inst-${cleanSubdomain}`,
            user_id: validUserId,
            template_id: template?.id || 't1',
            name: template?.name || 'PORT PHOTOGRAPH',
            subdomain: cleanSubdomain,
            custom_domain: `${cleanSubdomain}.webcuaban.site`,
            status: 'published',
            custom_data: initialCustomData,
            published_data: {
              site_url: siteUrl,
              viewer_url: viewerUrl,
              origin_url: originUrl,
              demo_url: demoUrl,
              admin_url: adminUrl,
              template_name: template?.name || 'PORT PHOTOGRAPH',
              customer_name: customerName || cleanSubdomain.toUpperCase(),
              customer_email: customerEmail,
              hero_title: initialCustomData?.hero_title || customerName || cleanSubdomain.toUpperCase(),
              hero_subtitle: initialCustomData?.hero_subtitle || 'Portfolio AI Studio đã kích hoạt bản quyền chính thức',
              ...initialCustomData
            },
            deployment_metadata: {
              official_url: siteUrl,
              internal_route: viewerUrl,
              origin_url: originUrl,
              demo_url: demoUrl,
              activated_at: nowIso
            }
          });

          // 4. Insert Domain in public.domains
          await supabase.from('domains').upsert({
            id: `dom-${cleanSubdomain}`,
            portfolio_id: `inst-${cleanSubdomain}`,
            subdomain: cleanSubdomain,
            full_domain: `${cleanSubdomain}.webcuaban.site`,
            custom_domain: `${cleanSubdomain}.webcuaban.site`,
            status: 'active',
            ssl_status: 'valid',
            verified: true,
            dns_records: {
              site_url: siteUrl,
              viewer_url: viewerUrl,
              origin_url: originUrl,
              demo_url: demoUrl
            }
          });

          // 5. Insert License in public.user_licenses
          if (validUserId) {
            await supabase.from('user_licenses').upsert({
              user_id: validUserId,
              template_id: template?.id || 't1',
              order_id: orderCode,
              license_type: 'standard',
              is_active: true
            });
          }
        } catch (supabaseErr) {
          console.warn('Supabase real-time storage sync notice:', supabaseErr);
        }
      }

      // Also notify backend server for persistence and sync
      try {
        await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderCode,
            userId: targetUserId,
            payload: { 
              status: 'success', 
              subdomain: cleanSubdomain,
              templateId: template?.id,
              templateName: template?.name,
              customerEmail,
              customerName,
              amount: amountVND,
              subpath: templateSlug
            }
          })
        });

        await fetch('/api/portfolios/migrate-draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subdomain: cleanSubdomain,
            userId: targetUserId,
            templateId: template?.id || 't1',
            instanceId: `inst-${cleanSubdomain}`
          })
        });

        await fetch('/api/portfolios/provision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subdomain: cleanSubdomain,
            templateId: template?.id || 't1',
            userId: targetUserId,
            customerName: customerName || cleanSubdomain,
            custom_data: initialCustomData
          })
        });

        // Direct write to backend sync endpoint for immediate consistency
        await fetch(`/api/portfolios/inst-${encodeURIComponent(cleanSubdomain)}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            custom_data: initialCustomData,
            user_id: targetUserId,
            subdomain: cleanSubdomain,
            status: 'published',
            template_id: template?.id || 't1',
            name: template?.name || 'PORT PHOTOGRAPH'
          })
        });

        // Clean up Supabase draft instance if existed
        if (isSupabaseConfigured) {
          const templateId = template?.id || 't1';
          const templateSlug = (template?.slug || 'template').replace(/^port-/, '');
          const delDraftIds = [
            `draft-${user?.id}-${templateId}`,
            `draft-${user?.id}-${templateSlug}`,
            `draft-${cleanSubdomain}-${templateId}`,
            `draft-${cleanSubdomain}`
          ];
          await supabase.from('portfolio_instances').delete().in('id', delDraftIds);
        }
      } catch (e) {
        // Fallback
      }

      // 2. Persist to local storage for instant reactivity across all client components
      if (typeof window !== 'undefined') {
        const slugPart = (template?.slug ? template.slug.replace(/^port-/, '') : (template?.id || 'portfolio')).toLowerCase().replace(/[^a-z0-9-]/g, '') || 'tpl';
        const userStorageKey = `user_portfolios_${targetUserId}`;
        const raw = localStorage.getItem(userStorageKey);
        let existingList: any[] = [];
        try {
          if (raw) existingList = JSON.parse(raw);
        } catch (e) {}
        if (!Array.isArray(existingList)) existingList = [];

        // If user has no existing purchased portfolio, this first template is automatically Primary
        const hasExistingPurchased = existingList.some(p => p.status !== 'draft');
        const isPrimary = !hasExistingPurchased;

        const enrichedPortfolio = {
          ...newPortfolio,
          id: isPrimary ? `inst-${cleanSubdomain}` : `inst-${cleanSubdomain}-${slugPart}`,
          slug_path: slugPart,
          is_primary: isPrimary
        };

        const filtered = existingList.filter(p => p.id !== enrichedPortfolio.id);
        filtered.unshift(enrichedPortfolio);

        localStorage.setItem(userStorageKey, JSON.stringify(filtered));
        localStorage.setItem('my_portfolios', JSON.stringify(filtered));

        if (isPrimary) {
          localStorage.setItem(`primary_portfolio_${targetUserId}`, enrichedPortfolio.id);
        }

        // Clean up draft if this template was previously drafted
        try {
          const draftsKey = `user_drafts_${targetUserId}`;
          const rawDrafts = localStorage.getItem(draftsKey);
          if (rawDrafts) {
            const draftsList = JSON.parse(rawDrafts);
            if (Array.isArray(draftsList)) {
              const updatedDrafts = draftsList.filter(d => d.template_id !== (template?.id || 't1') && d.id !== `draft-${targetUserId}-${template?.id}`);
              localStorage.setItem(draftsKey, JSON.stringify(updatedDrafts));
            }
          }
        } catch (e) {}

        // Save order
        const ordersKey = `user_orders_${targetUserId}`;
        const rawOrders = localStorage.getItem(ordersKey);
        let existOrders: any[] = [];
        try { if (rawOrders) existOrders = JSON.parse(rawOrders); } catch (e) {}
        if (!Array.isArray(existOrders)) existOrders = [];
        existOrders.unshift(newOrder);
        localStorage.setItem(ordersKey, JSON.stringify(existOrders));
      }

      // 3. Success state
      setCreatedSubdomain(cleanSubdomain);
      setPaymentSuccess(true);
      toast.success(`Thanh toán thành công! Template đã được thêm vào Dashboard của bạn.`);

      // Dispatch events to refresh dashboard UI instantly
      window.dispatchEvent(new Event('portfolio_purchased'));
      window.dispatchEvent(new Event('portfolio_primary_updated'));

    } catch (err: any) {
      toast.error(err.message || 'Lỗi xử lý thanh toán');
    } finally {
      setProcessing(false);
    }
  };

  // Auto-polling for real VietQR / payOS bank transfer detection
  useEffect(() => {
    if (paymentSuccess || loading) return;

    let isSubscribed = true;

    const checkPaymentStatus = async () => {
      try {
        const queryOrder = payosData?.orderCode ? String(payosData.orderCode) : orderCode;

        // 1. Direct payOS API check (Bypass all serverless & network hurdles)
        const directCheck = await checkPayosPaymentDirect(queryOrder);
        if (directCheck.paid && isSubscribed && !paymentSuccess) {
          handleCompletePayment();
          return;
        }

        // 2. Server check-status endpoint
        const res = await fetch(`/api/payments/check-status?orderId=${encodeURIComponent(queryOrder)}&amount=${amountVND}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.paid && isSubscribed && !paymentSuccess) {
            handleCompletePayment();
            return;
          }
        }

        // 3. Fallback direct check on original orderCode if different
        if (payosData?.orderCode && String(payosData.orderCode) !== orderCode) {
          const fallbackDirect = await checkPayosPaymentDirect(orderCode);
          if (fallbackDirect.paid && isSubscribed && !paymentSuccess) {
            handleCompletePayment();
            return;
          }
        }
      } catch (e) {
        // Ignore transient network errors
      }
    };

    const interval = setInterval(checkPaymentStatus, 2000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [orderCode, payosData?.orderCode, amountVND, paymentSuccess, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-slate-800">
        <Loading size={36} />
        <p className="mt-4 text-slate-500 font-mono text-sm">Đang kết nối cổng thanh toán VietQR bảo mật...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      
      {/* Top Clean Light Header */}
      <header className="border-b border-slate-200/90 bg-white sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              to="/templates"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại Shop
            </Link>
            <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-lg tracking-tight">
                {settings.checkoutTitle || 'Thanh Toán Mua Template'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-emerald-700 text-xs font-mono font-bold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">256-Bit SSL Encrypted •</span>
            <span>Bảo Mật Ngân Hàng</span>
          </div>
        </div>
      </header>

      {/* Main Payment Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10">
        
        {/* CHECKOUT FORM VIEW (LIGHT MODE) */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: VietQR Payment Display (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-white border-2 border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">
                      Chuyển Khoản Ngân Hàng (Quét QR VietQR)
                    </h2>
                    <p className="text-xs text-slate-500">
                      {payosData ? 'Mã QR payOS VietQR Pro tự động điền 100% khi quét' : 'Tự động điền 100% Số tài khoản, Tên người nhận và Số tiền khi quét'}
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  {payosData ? 'payOS • Napas 247' : 'Napas 247'}
                </span>
              </div>

              {/* Countdown Banner */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-mono">
                <span className="flex items-center gap-1.5 font-bold">
                  <Clock className="w-4 h-4 text-amber-600" /> Mã QR có hiệu lực trong:
                </span>
                <span className="font-extrabold text-sm text-amber-700">{formatTimer(timeLeft)}</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 items-center">
                {/* Dynamic QR Display */}
                <div className="flex flex-col items-center justify-center p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3">
                  <div className="flex items-center justify-between w-full px-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Cổng thanh toán payOS
                    </span>
                    <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                      Đơn #{payosData?.orderCode || numericCode}
                    </span>
                  </div>

                  <div className="relative p-2 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col items-center">
                    <img
                      src={activeQrUrl}
                      alt="VietQR Napas 247 Payment Code"
                      className="w-48 h-auto max-h-60 object-contain rounded-lg"
                    />
                    {payosLoading ? (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] rounded-xl flex flex-col items-center justify-center gap-2 z-10">
                        <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
                        <span className="text-[11px] font-bold text-indigo-900">Đang đồng bộ payOS...</span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 border-2 border-indigo-600/20 rounded-xl pointer-events-none animate-pulse" />
                    )}
                  </div>
                  
                  <div className="flex flex-col items-center gap-1.5 justify-center">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-full shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      Đang tự động xác nhận qua payOS (Real-time)
                    </span>
                  </div>

                  {payosData?.checkoutUrl && (
                    <a
                      href={payosData.checkoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold transition-all shadow-sm"
                    >
                      <ExternalLink className="w-4 h-4" /> Thanh toán trực tiếp trên Cổng payOS
                    </a>
                  )}

                  <span className="text-xs font-bold text-slate-800">
                    Mở App Ngân hàng bất kỳ để Quét QR (Tự động mở Popup khi nhận khoản)
                  </span>
                </div>

                {/* Bank Account Details */}
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                    <span className="text-slate-500 text-[11px] font-medium">Ngân hàng nhận</span>
                    <p className="font-bold text-slate-900 text-sm">
                      {settings.bankName || 'Ngân Hàng Á Châu (ACB)'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 text-[11px] font-medium">
                        Số tài khoản ({activeAccountName})
                      </span>
                      <p className="font-mono font-bold text-indigo-700 text-sm">{activeAccountNumber}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(activeAccountNumber, 'stk')}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 shadow-xs cursor-pointer"
                    >
                      {copiedKey === 'stk' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 text-[11px] font-medium">Số tiền cần chuyển</span>
                      <p className="font-mono font-extrabold text-emerald-600 text-base">{formattedVND} VNĐ</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(`${amountVND}`, 'money')}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 shadow-xs cursor-pointer"
                    >
                      {copiedKey === 'money' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 text-[11px] font-medium">Nội dung chuyển khoản</span>
                        {payosData?.description && (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                            Chuẩn payOS
                          </span>
                        )}
                      </div>
                      {payosLoading ? (
                        <div className="flex items-center gap-1.5 text-indigo-600 font-semibold text-xs mt-0.5">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Đang nạp mã định danh...</span>
                        </div>
                      ) : (
                        <p className="font-mono font-bold text-slate-900 text-xs truncate max-w-[190px]">
                          {activeTransferMemo}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!payosData && !payosLoading && (
                        <button
                          onClick={() => initPayosOrder()}
                          title="Tạo lại mã payOS"
                          className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-indigo-600 shadow-xs cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => copyToClipboard(activeTransferMemo, 'nd')}
                        disabled={payosLoading || !activeTransferMemo}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {copiedKey === 'nd' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Automated Verification Banner (100% Auto-Detect - No Button Needed) */}
              <div className="pt-2">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-emerald-950">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 font-bold shadow-xs mt-0.5">
                    <Zap className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="text-xs space-y-0.5">
                    <strong className="block text-sm font-extrabold text-emerald-900">
                      Hệ Thống Tự Động Xác Nhận Giao Dịch 100%
                    </strong>
                    <p className="text-emerald-800 text-[12px] leading-relaxed">
                      Ngay sau khi bạn quét mã & thực hiện chuyển khoản trên ứng dụng ngân hàng, hệ thống sẽ tự động xác nhận và mở <strong>Popup Bàn Giao Bản Quyền Website</strong> trong vài giây (Không cần bấm bất kỳ nút nào).
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Order Summary & Subdomain Configuration (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Template Summary Card */}
            <div className="bg-white border-2 border-slate-200/80 rounded-3xl p-6 sm:p-7 space-y-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-indigo-700 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                    {template?.categoryName || 'Portfolio Template'}
                  </span>
                  <h2 className="text-xl font-black text-slate-900 mt-2">
                    {template?.name || 'PORT PHOTOGRAPH'}
                  </h2>
                </div>
                
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-600">{formattedVND} ₫</span>
                  {originalPrice > salePrice && (
                    <span className="block text-xs text-slate-400 line-through font-mono">
                      {originalPrice.toLocaleString('vi-VN')} ₫
                    </span>
                  )}
                  <span className="block text-[11px] text-slate-500 font-medium">Thanh toán 1 lần</span>
                </div>
              </div>

              {/* Thumbnail */}
              <div className="aspect-[16/9] rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden relative">
                {template?.thumbnail ? (
                  <img 
                    src={template.thumbnail} 
                    alt={template.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 font-mono text-xs">
                    Mockup Preview
                  </div>
                )}
              </div>

              {/* Subdomain Input Configuration (Cách A) */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block text-[12px] font-bold text-slate-800 uppercase tracking-wider">
                    Tên Miền Gắn Với User ID Của Bạn *
                  </label>
                  <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Khả dụng
                  </span>
                </div>

                <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                  <Globe className="w-4 h-4 text-indigo-600 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="trung"
                    className="bg-transparent text-[14px] font-mono font-bold text-indigo-700 outline-none w-full"
                  />
                  <span className="text-xs font-mono font-bold text-slate-500 shrink-0">.webcuaban.site</span>
                </div>

                {/* Display Cara A: Folder Subpath Link Preview */}
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-900 text-[11px] uppercase tracking-wider">
                    <FolderTree className="w-3.5 h-3.5 text-indigo-600" />
                    Cấu Trúc Tên Miền Sau Kích Hoạt (Cách A):
                  </div>
                  <div className="font-mono text-indigo-700 text-xs font-bold break-all bg-white p-2 rounded-lg border border-indigo-200">
                    {liveWebsiteUrl}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Nếu bạn mua thêm template khác, tất cả sẽ nằm gọn gàng trong thư mục tên miền này (ví dụ: <span className="font-mono text-indigo-600">/{templateSlug}</span>).
                  </p>
                </div>
              </div>

              {/* Customer Information */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1">Họ và Tên chủ sở hữu</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Trần Văn Trung"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-[14px] font-medium text-slate-900 outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1">Email nhận thông báo</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-[14px] font-medium text-slate-900 outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Benefits summary list */}
              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Sở hữu trọn đời — Không phí duy trì hàng tháng</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Tự động ẩn hoàn toàn thanh banner mua dùng thử</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Bàn giao toàn quyền quản trị nội dung & hình ảnh</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </main>

      {/* POPUP MODAL SAU KHI HOÀN TẤT THANH TOÁN (THEO ĐÚNG YÊU CẦU H3) */}
      <AnimatePresence>
        {paymentSuccess && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-lg w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl text-center space-y-6 relative overflow-hidden"
            >
              {/* Top Accent Gradient Bar */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-indigo-600 to-purple-600" />

              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Thanh toán & Kích hoạt thành công
                </span>
                <h2 className="text-2xl font-black text-slate-900 pt-1">
                  Chúc Mừng Bạn Đã Sở Hữu Template!
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto">
                  Template <strong className="text-slate-800">{template?.name || 'Portfolio'}</strong> đã được gắn thành công vào tên miền của bạn. Thanh banner dùng thử đã được tự động ẩn vĩnh viễn.
                </p>
              </div>

              {/* Display Links */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-left space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <span>Tên miền sở hữu chính thức (Cách A):</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Đã Kích Hoạt
                  </span>
                </div>

                <div className="space-y-1.5 font-mono text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="truncate">
                      <span className="text-slate-400">Trang chủ: </span>
                      <strong className="text-indigo-600">{liveWebsiteUrl}</strong>
                    </div>
                    <button
                      onClick={() => copyToClipboard(liveWebsiteUrl, 'live')}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                    >
                      {copiedKey === 'live' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="truncate">
                      <span className="text-slate-400">Quản trị: </span>
                      <strong className="text-slate-800">{adminWebsiteUrl}</strong>
                    </div>
                    <button
                      onClick={() => copyToClipboard(adminWebsiteUrl, 'adm')}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                    >
                      {copiedKey === 'adm' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* HAI NÚT HÀNH ĐỘNG CHÍNH THEO ĐÚNG YÊU CẦU CỦA BẠN */}
              <div className="space-y-2.5 pt-1">
                <div className="grid sm:grid-cols-2 gap-2.5">
                  <a
                    href={liveWebsiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" /> Đến Trang Chủ Template
                  </a>

                  <a
                    href={adminWebsiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Terminal className="w-4 h-4 text-indigo-400" /> Đến Trang Quản Trị
                  </a>
                </div>

                <Link
                  to="/dashboard/domains"
                  className="block w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  Vào Quản Lý Tên Miền & Subdomain Của Bạn
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
