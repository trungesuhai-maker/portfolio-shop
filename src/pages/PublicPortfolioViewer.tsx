import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { api } from '@/src/services/api';
import { Loading } from '@/src/components/ui/Loading';
import { 
  Globe, 
  ExternalLink, 
  CheckCircle2, 
  ArrowLeft, 
  Sparkles, 
  Mail, 
  ShieldCheck, 
  Layers, 
  AlertTriangle,
  Search,
  Share2,
  X,
  Copy,
  Tag,
  Terminal
} from 'lucide-react';
import { toast } from 'sonner';
import { formatSubdomainDisplay, getRootDomain } from '@/src/utils/domain';

export default function PublicPortfolioViewer() {
  const { slug: routeSlug } = useParams<{ slug?: string }>();
  const [searchParams] = useSearchParams();
  const querySlug = searchParams.get('subdomain');
  
  // Resolve slug from route parameter, query param, or window hostname
  const getEffectiveSlug = () => {
    if (routeSlug) return routeSlug;
    if (querySlug) return querySlug;
    const hostname = window.location.hostname.toLowerCase();
    if (hostname.endsWith('.portfolio-shop.com')) {
      return hostname.replace('.portfolio-shop.com', '');
    }
    if (hostname.endsWith('.localhost')) {
      return hostname.replace('.localhost', '');
    }
    // Generic custom domain wildcard check (e.g., alex.mybrand.com or alex.portfolio.vn)
    if (!hostname.includes('run.app') && !hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
      const parts = hostname.split('.');
      if (parts.length >= 3 && !['www', 'admin', 'app', 'api', 'dev', 'preview', 'staging'].includes(parts[0])) {
        return parts[0];
      }
    }
    return 'john'; // Default demo preview
  };

  const currentSlug = getEffectiveSlug();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [showSeoInspector, setShowSeoInspector] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadPortfolio() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.subdomains.resolve(currentSlug);
        if (mounted) {
          setData(res);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadPortfolio();
    return () => { mounted = false; };
  }, [currentSlug]);

  // SEO Injection Hook: Injects document head meta tags dynamically
  useEffect(() => {
    if (!data?.instance) return;
    const instance = data.instance;
    const seo = instance.seo || {};
    const customData = instance.custom_data || {};

    const pageTitle = seo.seoTitle || `${instance.name} — Portfolio`;
    const pageDescription = seo.seoDescription || customData.hero_subtitle || 'Chào mừng bạn đến với Portfolio cá nhân trên Edge CDN.';
    const ogImage = seo.ogImage || 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&h=630&fit=crop';
    const canonicalUrl = seo.canonical || `https://${instance.subdomain}.portfolio-shop.com`;
    const faviconUrl = seo.favicon || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=64&h=64&fit=crop';

    // 1. Update Title
    const originalTitle = document.title;
    document.title = pageTitle;

    // Helper to set or create meta tag
    const setMetaTag = (attr: 'name' | 'property', key: string, content: string) => {
      let element = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, key);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
      return element;
    };

    // Helper to set or create link tag
    const setLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
      return element;
    };

    // 2. Set Meta Tags
    setMetaTag('name', 'description', pageDescription);
    setMetaTag('property', 'og:title', pageTitle);
    setMetaTag('property', 'og:description', pageDescription);
    setMetaTag('property', 'og:image', ogImage);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', pageTitle);
    setMetaTag('name', 'twitter:description', pageDescription);
    setMetaTag('name', 'twitter:image', ogImage);

    // 3. Set Canonical & Favicon Links
    setLinkTag('canonical', canonicalUrl);
    setLinkTag('icon', faviconUrl);

    return () => {
      document.title = originalTitle;
    };
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-300">
        <Loading size={32} />
        <p className="mt-4 text-sm font-mono text-slate-400">
          Đang phân giải Cloudflare Edge Route cho <span className="text-indigo-400 font-bold">{currentSlug}.portfolio-shop.com</span>...
        </p>
      </div>
    );
  }

  if (error || !data || data?.isOff || data?.instance?.status === 'off' || error?.isOff) {
    const isOffline = error?.isOff || data?.isOff || data?.instance?.status === 'off';

    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 antialiased">
        <div className="max-w-md w-full text-center space-y-6 bg-slate-900/90 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-2xl font-black">
            {isOffline ? '404' : '!'}
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-white">
              {isOffline ? '404 — Website Tạm Ngưng Hoạt Động' : 'Subdomain Chưa Được Đăng Ký'}
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              {isOffline 
                ? `Chủ sở hữu tên miền "${currentSlug}.webcuaban.site" đã tạm tắt trạng thái hoạt động của website này. Vui lòng quay lại sau.`
                : `Tên miền phụ ${currentSlug}.webcuaban.site hiện đang còn trống hoặc chưa xuất bản.`
              }
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-3">
            <Link 
              to="/" 
              className="w-full py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all text-sm shadow-lg shadow-indigo-600/20"
            >
              Về Trang Chủ Webcuaban
            </Link>
            <Link 
              to="/templates" 
              className="w-full py-2.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
            >
              Xem Kho Template Khác
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { instance, template, cache } = data;
  const isDraft = instance.status === 'draft';
  const customData = instance.custom_data || {};
  const heroTitle = customData.hero_title || instance.name;
  const heroSubtitle = customData.hero_subtitle || 'Chào mừng bạn đến với Portfolio của tôi';
  const aboutBio = customData.about_bio || '';
  const seo = instance.seo || {};

  // Check if user requested admin editor path (e.g. /photograph/admin.html or /admin or /admin/)
  const isPageAdminUrl = typeof window !== 'undefined' && (
    window.location.pathname.endsWith('/admin.html') || 
    window.location.pathname.endsWith('/admin') ||
    window.location.pathname.endsWith('/admin/')
  );

  // Check if this template is linked to an external live AI Studio project
  const liveDeploymentUrl = (template.originUrl || template.demoUrl || '').trim();
  const isLiveProxyEnabled = liveDeploymentUrl.startsWith('http://') || liveDeploymentUrl.startsWith('https://');
  const isLicensed = instance?.status === 'published' || instance?.status === 'active';

  // Construct licensed URL with license & hideBanner & tenant parameters
  let iframeUrl = liveDeploymentUrl;
  if (isLiveProxyEnabled) {
    try {
      let targetUrlStr = liveDeploymentUrl;
      if (isPageAdminUrl) {
        if (template.adminUrl && (template.adminUrl.startsWith('http://') || template.adminUrl.startsWith('https://'))) {
          targetUrlStr = template.adminUrl;
        } else {
          // Construct admin.html URL from liveDeploymentUrl
          const parsed = new URL(liveDeploymentUrl);
          if (!parsed.pathname.includes('admin.html')) {
            parsed.pathname = parsed.pathname.endsWith('/')
              ? `${parsed.pathname}admin.html`
              : `${parsed.pathname}/admin.html`.replace(/\/\//g, '/');
          }
          targetUrlStr = parsed.toString();
        }
      }

      const urlObj = new URL(targetUrlStr);
      if (isLicensed) {
        urlObj.searchParams.set('licensed', 'true');
        urlObj.searchParams.set('trial', 'false');
        urlObj.searchParams.set('mode', 'published');
        urlObj.searchParams.set('hideBanner', 'true');
        urlObj.searchParams.set('licenseKey', instance?.id || 'activated');
        urlObj.searchParams.set('domain', formatSubdomainDisplay(instance?.subdomain || currentSlug));
        urlObj.searchParams.set('subdomain', instance?.subdomain || currentSlug);
        urlObj.searchParams.set('tenant', instance?.subdomain || currentSlug);
        urlObj.searchParams.set('instanceId', instance?.id || `inst-${instance?.subdomain || currentSlug}`);
      }
      iframeUrl = urlObj.toString();
    } catch (e) {
      let base = liveDeploymentUrl;
      if (isPageAdminUrl) {
        base = template.adminUrl || `${liveDeploymentUrl.replace(/\/$/, '')}/admin.html`;
      }
      const separator = base.includes('?') ? '&' : '?';
      iframeUrl = isLicensed 
        ? `${base}${separator}licensed=true&trial=false&mode=published&hideBanner=true&tenant=${encodeURIComponent(instance?.subdomain || currentSlug)}&domain=${encodeURIComponent(formatSubdomainDisplay(instance?.subdomain || currentSlug))}`
        : base;
    }
  }

  // Function to broadcast license activation message to embedded template app
  const sendLicenseBroadcast = (targetWindow: Window | null) => {
    if (!targetWindow) return;
    try {
      const payload = {
        type: 'WEBCUABAN_LICENSE_SYNC',
        licensed: isLicensed,
        hideBanner: isLicensed,
        trial: !isLicensed,
        mode: isLicensed ? 'published' : 'trial',
        tenant: instance?.subdomain || currentSlug,
        subdomain: instance?.subdomain || currentSlug,
        domain: formatSubdomainDisplay(instance?.subdomain || currentSlug)
      };
      targetWindow.postMessage(payload, '*');
    } catch (e) {
      // Cross-origin safe
    }
  };

  // If live AI Studio project URL is connected, render Full-Viewport Live Gateway
  if (isLiveProxyEnabled) {
    return (
      <div className="fixed inset-0 w-full h-full bg-slate-950 flex flex-col overflow-hidden z-50">
        {/* Only show header bar for Demo / Unlicensed Preview, hide completely for official licensed domains */}
        {!isLicensed && (
          <header className="h-11 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between gap-3 text-xs shrink-0 z-50 select-none">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <Link 
                to="/templates"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors font-medium border border-slate-700/60 shrink-0"
                title="Quay lại danh mục Shop"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Shop</span>
              </Link>

              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-3 py-1 rounded-full font-mono text-[11px] font-bold truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                <span className="truncate">https://{formatSubdomainDisplay(instance.subdomain || currentSlug)}{isPageAdminUrl ? '/admin.html' : ''}</span>
              </div>

              <div className="hidden md:flex items-center gap-1.5 text-slate-400 text-xs">
                <span className="text-slate-600">•</span>
                <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">Template: <strong className="text-slate-200">{template.name}</strong> {isPageAdminUrl ? '(Admin Portal)' : ''}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowSeoInspector(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-medium border border-indigo-500/30 transition-colors text-xs cursor-pointer"
                title="Xem thẻ Meta SEO"
              >
                <Search className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">SEO Tags</span>
              </button>

              <a
                href={iframeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all text-xs shadow-sm cursor-pointer"
                title="Mở toàn màn hình tab mới"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Mở Tab Mới</span>
              </a>
            </div>
          </header>
        )}

        {/* Full-Viewport Zero-Latency Live IFrame */}
        <div className={`flex-1 w-full ${isLicensed ? 'h-full' : 'h-[calc(100vh-44px)]'} bg-slate-950 relative`}>
          <iframe
            src={iframeUrl}
            title={template.name}
            onLoad={(e) => {
              const win = e.currentTarget.contentWindow;
              sendLicenseBroadcast(win);
              // Send recurring postMessage signals to ensure child application receives it upon mounting
              setTimeout(() => sendLicenseBroadcast(win), 500);
              setTimeout(() => sendLicenseBroadcast(win), 1500);
            }}
            className="w-full h-full border-0 absolute inset-0 bg-slate-950"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        {/* Subtle floating navigation button for owner */}
        {isLicensed && instance?.id && (
          isPageAdminUrl ? (
            <a
              href={`https://${formatSubdomainDisplay(instance.subdomain || currentSlug)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="fixed bottom-4 right-4 z-50 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-emerald-600 text-slate-300 hover:text-white font-bold text-xs backdrop-blur-md shadow-lg border border-slate-700/60 flex items-center gap-1.5 transition-all opacity-70 hover:opacity-100 cursor-pointer"
              title="Xem website thật của bạn"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>Xem Trang Chủ Website</span>
            </a>
          ) : (
            <a
              href={`https://${formatSubdomainDisplay(instance.subdomain || currentSlug)}/admin.html`}
              className="fixed bottom-4 left-4 z-50 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-indigo-600 text-slate-300 hover:text-white font-bold text-xs backdrop-blur-md shadow-lg border border-slate-700/60 flex items-center gap-1.5 transition-all opacity-70 hover:opacity-100 cursor-pointer"
              title="Mở trang Quản Trị Template"
            >
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Quản Trị Template (/admin.html)</span>
            </a>
          )
        )}

        {/* SEO Inspector Modal */}
        {showSeoInspector && (
          <div 
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
            onClick={() => setShowSeoInspector(false)}
          >
            <div 
              className="bg-slate-900 text-white rounded-3xl max-w-xl w-full border border-slate-800 shadow-2xl p-6 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">Dynamic Subdomain SEO Inspector</h3>
                    <p className="text-[11px] text-slate-400">Được phân giải qua Cloudflare Edge tới https://{formatSubdomainDisplay(instance.subdomain || currentSlug)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSeoInspector(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-indigo-400">&lt;title&gt;</span>
                  <p className="font-semibold text-slate-200">{seo.seoTitle || `${template.name} — Portfolio`}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-indigo-400">&lt;meta name="description"&gt;</span>
                  <p className="text-slate-300">{seo.seoDescription || template.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-indigo-400">&lt;link rel="canonical"&gt;</span>
                    <p className="font-mono text-[11px] text-emerald-400 truncate">https://{formatSubdomainDisplay(instance.subdomain || currentSlug)}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-indigo-400">Live Proxy Target</span>
                    <p className="font-mono text-[11px] text-slate-400 truncate">{liveDeploymentUrl}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowSeoInspector(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white relative">
      
      {/* Edge Routing Floating Telemetry Bar */}
      <div className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>https://{formatSubdomainDisplay(instance.subdomain)}</span>
            </div>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Template: <strong className="text-white">{template.name}</strong></span>
            </div>
            <span className="text-slate-500 hidden md:inline">•</span>
            <div className="hidden md:flex items-center gap-1 text-slate-400 font-mono text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cache: {cache.isolationPolicy}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Live SEO Inspector Button */}
            <button
              onClick={() => setShowSeoInspector(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-bold border border-indigo-500/30 transition-colors text-xs"
            >
              <Search className="w-3.5 h-3.5 text-indigo-400" />
              <span>SEO Tags & Edge</span>
            </button>

            {isDraft && (
              <span className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[11px] font-bold">
                <AlertTriangle className="w-3 h-3" /> BẢN NHÁP
              </span>
            )}
            <Link 
              to="/dashboard/portfolios" 
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Quản lý Portfolios
            </Link>
            {/* Buy Portfolio CTA if in Edit mode or Draft */}
            {(searchParams.get('mode') === 'edit' || isDraft) && (
              <Link 
                to={`/templates/${template.slug || 'developer-minimalist'}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all text-xs shadow-md"
              >
                <span>🛒 Mua Portfolio Ngay</span>
              </Link>
            )}

            <Link 
              to="/templates" 
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-1 rounded-lg transition-colors text-xs"
            >
              Shop
            </Link>
          </div>
        </div>
      </div>

      {/* Main Portfolio Canvas */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-16 sm:py-24 flex flex-col justify-center">
        
        {isDraft && (
          <div className="mb-8 p-4 bg-amber-950/40 border border-amber-500/30 rounded-2xl text-amber-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Portfolio này hiện đang ở trạng thái <strong>Bản nháp (Draft)</strong>. Chỉ bạn và quản trị viên mới có thể xem trước.</span>
            </div>
            <Link 
              to={`/dashboard/editor/${instance.id}`}
              className="underline hover:text-white font-bold ml-4"
            >
              Xuất bản ngay
            </Link>
          </div>
        )}

        <div className="space-y-8">
          {/* Identity Tag with Favicon */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold">
            {seo.favicon ? (
              <img src={seo.favicon} alt="Favicon" className="w-4 h-4 rounded-full object-cover" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span>{instance.customerName || 'Chủ sở hữu Portfolio'}</span>
            <span className="text-slate-600">/</span>
            <span className="text-indigo-400 font-mono">https://{instance.subdomain}.portfolio-shop.com</span>
          </div>

          {/* Hero Section */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight">
              {heroTitle}
            </h1>
            <p className="text-xl sm:text-2xl text-slate-400 font-medium leading-relaxed max-w-3xl">
              {heroSubtitle}
            </p>
          </div>

          {/* About / Bio Section */}
          {aboutBio && (
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/50 border border-slate-800/80 text-slate-300 leading-relaxed max-w-3xl text-base space-y-2">
              <h2 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Giới thiệu bản thân</h2>
              <p>{aboutBio}</p>
            </div>
          )}

          {/* Design Philosophy (Project A: Designer Schema) */}
          {customData.design_philosophy && (
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900/90 to-indigo-950/30 border border-indigo-500/20 text-slate-200 leading-relaxed max-w-3xl text-base space-y-2">
              <h2 className="text-xs uppercase font-bold text-indigo-400 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Triết lý Thiết kế
              </h2>
              <p className="italic text-lg font-serif text-slate-100">"{customData.design_philosophy}"</p>
            </div>
          )}

          {/* Showcase Projects Preview */}
          <div className="pt-6 space-y-4">
            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Dự án & Công trình tiêu biểu</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-2 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-base">Distributed Cloud Edge Gateway</h4>
                  <ExternalLink className="w-4 h-4 text-slate-500" />
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Hạ tầng định tuyến wildcard subdomains phân tán toàn cầu với độ trễ dưới 20ms.
                </p>
                <div className="flex gap-1.5 pt-2">
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">TypeScript</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">Cloudflare</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-2 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-base">High-Performance Portfolio Engine</h4>
                  <ExternalLink className="w-4 h-4 text-slate-500" />
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Cơ chế phân lập cache tuyệt đối giữa các khách hàng, loại bỏ nguy cơ rò rỉ dữ liệu.
                </p>
                <div className="flex gap-1.5 pt-2">
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">Edge Cache</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">Vary Host</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-8 flex flex-wrap items-center gap-4">
            <a 
              href={`mailto:${instance.customerEmail || 'contact@portfolio-shop.com'}`}
              className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/25"
            >
              <Mail className="w-4 h-4" /> Liên hệ Hợp tác
            </a>
            <Link
              to={`/dashboard/editor/${instance.id}`}
              className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold border border-slate-800 transition-all text-sm"
            >
              Chỉnh sửa Portfolio này
            </Link>
          </div>

        </div>
      </main>

      {/* Edge Verification Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-10 px-6 text-center text-xs text-slate-500 space-y-3">
        <p>© 2026 {heroTitle}. Bản quyền thuộc về tác giả.</p>
        <div className="flex flex-wrap justify-center items-center gap-4 font-mono text-[11px] text-slate-500">
          <span>Subdomain: <strong className="text-indigo-400">{instance.subdomain}</strong></span>
          <span>•</span>
          <span>Instance ID: <strong className="text-slate-400">{instance.id}</strong></span>
          <span>•</span>
          <span>Customer ID: <strong className="text-slate-400">{instance.user_id}</strong></span>
          <span>•</span>
          <span className="text-emerald-500">✓ Cache Isolated</span>
        </div>
      </footer>

      {/* SEO & Edge Metadata Inspector Modal */}
      {showSeoInspector && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowSeoInspector(false)}
        >
          <div 
            className="bg-slate-900 text-white rounded-3xl max-w-xl w-full border border-slate-800 shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold">SEO & Head Tags Inspector</h3>
                  <p className="text-[11px] text-slate-400">Các thẻ meta đã được nhúng vào &lt;head&gt; của trang này</p>
                </div>
              </div>
              <button
                onClick={() => setShowSeoInspector(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase text-indigo-400">&lt;title&gt;</span>
                <p className="font-semibold text-slate-200">{seo.seoTitle || `${heroTitle} — Portfolio`}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase text-indigo-400">&lt;meta name="description"&gt;</span>
                <p className="text-slate-300">{seo.seoDescription || heroSubtitle}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-indigo-400">&lt;link rel="canonical"&gt;</span>
                  <p className="font-mono text-[11px] text-emerald-400 truncate">{seo.canonical || `https://${instance.subdomain}.portfolio-shop.com`}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-indigo-400">&lt;link rel="icon"&gt; (Favicon)</span>
                  <div className="flex items-center gap-2">
                    <img src={seo.favicon || 'https://via.placeholder.com/16'} alt="Fav" className="w-4 h-4 rounded object-cover" />
                    <p className="font-mono text-[11px] text-slate-400 truncate">{seo.favicon || 'Mặc định'}</p>
                  </div>
                </div>
              </div>

              {/* OpenGraph Card Preview */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase text-indigo-400">OpenGraph Social Preview (Facebook / X)</span>
                <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
                  <div className="aspect-video max-h-36 overflow-hidden">
                    <img src={seo.ogImage || 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800'} alt="OG" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-2.5">
                    <p className="text-[10px] font-mono text-slate-400 uppercase">{instance.subdomain}.portfolio-shop.com</p>
                    <p className="font-bold text-slate-100 text-xs truncate">{seo.seoTitle || heroTitle}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{seo.seoDescription || heroSubtitle}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(seo, null, 2));
                  toast.success('Đã sao chép cấu hình SEO JSON');
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" /> Copy SEO JSON
              </button>
              <button
                onClick={() => setShowSeoInspector(false)}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
