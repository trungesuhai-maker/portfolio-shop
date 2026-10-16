import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Cable, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  Zap, 
  ShieldCheck, 
  HardDrive, 
  Eye, 
  Sliders, 
  ArrowRight, 
  Layers, 
  Terminal, 
  FileCode2, 
  Radio, 
  Check, 
  Globe, 
  DollarSign, 
  Tag, 
  FolderTree, 
  Info,
  Maximize2,
  Send,
  CloudLightning,
  Workflow
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/src/services/api';
import { Template, Category, TemplateField } from '@/src/types';

interface DiagnosticResult {
  manifestValid: boolean;
  originReachable: boolean;
  bridgeDetected: boolean;
  r2StorageReady: boolean;
  schemaCompatible: boolean;
  subdomainReady: boolean;
  details: string[];
}

// Helper function: Tự động căn cứ vào Live Demo URL để tạo ra Admin URL (/admin.html hoặc /admin)
export const deriveAdminUrlFromDemo = (demoUrl: string, format: 'html' | 'spa' = 'html'): string => {
  if (!demoUrl || !demoUrl.trim()) return '';
  const trimmed = demoUrl.trim();
  const targetPath = format === 'spa' ? '/admin' : '/admin.html';
  try {
    let urlObj: URL;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      urlObj = new URL(trimmed);
    } else {
      urlObj = new URL(`https://${trimmed}`);
    }

    let pathname = urlObj.pathname || '';
    pathname = pathname.replace(/\/+$/, '');

    if (!pathname || pathname === '') {
      pathname = targetPath;
    } else if (pathname.endsWith('/index.html') || pathname.endsWith('/index.php')) {
      pathname = pathname.replace(/\/(index\.html|index\.php)$/, targetPath);
    } else if (pathname.endsWith('.html') || pathname.endsWith('.php')) {
      const lastSlash = pathname.lastIndexOf('/');
      pathname = (lastSlash > 0 ? pathname.substring(0, lastSlash) : '') + targetPath;
    } else {
      pathname = `${pathname}${targetPath}`;
    }

    return `${urlObj.origin}${pathname}`;
  } catch {
    const clean = trimmed.split('?')[0].split('#')[0].replace(/\/+$/, '');
    if (clean.endsWith('/index.html')) {
      return clean.replace(/\/index\.html$/, targetPath);
    }
    return clean ? `${clean}${targetPath}` : '';
  }
};

export default function AdminConnectTemplate() {
  const navigate = useNavigate();

  // Active Tab: 'import' | 'sandbox' | 'prompt'
  const [activeTab, setActiveTab] = useState<'import' | 'sandbox' | 'prompt'>('import');

  // Import Mode: 'url' | 'json'
  const [importMode, setImportMode] = useState<'url' | 'json'>('url');

  // Input States
  const [targetUrl, setTargetUrl] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [isPulling, setIsPulling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Categories for select
  const [categories, setCategories] = useState<Category[]>([]);

  // Diagnostics State
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult | null>(null);
  const [detectedSource, setDetectedSource] = useState<string>('');
  const [latencyMs, setLatencyMs] = useState<number>(0);

  // Parsed / Draft Template State
  const [parsedTemplate, setParsedTemplate] = useState<Partial<Template> | null>(null);
  const [bridgeConfig, setBridgeConfig] = useState<{
    enabled: boolean;
    scriptUrl?: string;
    r2BucketSync?: boolean;
    storagePrefix?: string;
  }>({
    enabled: true,
    r2BucketSync: true,
    storagePrefix: 'templates/custom/'
  });

  // Sandbox Live Test States
  const [sandboxUrl, setSandboxUrl] = useState('');
  const [sandboxLog, setSandboxLog] = useState<{ time: string; type: string; message: string; direction: 'in' | 'out' }[]>([]);
  const [isTestingBridge, setIsTestingBridge] = useState(false);
  const [bridgeTestResult, setBridgeTestResult] = useState<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load categories
  useEffect(() => {
    api.categories.list().then(setCategories).catch(console.error);
  }, []);

  // Listen to postMessage from Sandbox Iframe
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!event.data) return;
      try {
        const payload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (payload.type && (payload.type.startsWith('PORTIO_') || payload.type.includes('READY') || payload.type.includes('SAVE'))) {
          setSandboxLog(prev => [
            {
              time: new Date().toLocaleTimeString(),
              type: payload.type,
              message: JSON.stringify(payload.data || payload, null, 2),
              direction: 'in'
            },
            ...prev.slice(0, 49)
          ]);
        }
      } catch (e) {}
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Căn cứ vào URL Live Demo để tự động tạo ra link trang admin
  const handleDemoUrlChange = (newDemoUrl: string) => {
    if (!parsedTemplate) {
      const newAutoAdmin = deriveAdminUrlFromDemo(newDemoUrl);
      setParsedTemplate({
        demoUrl: newDemoUrl,
        adminUrl: newAutoAdmin,
        originUrl: newDemoUrl
      });
      return;
    }

    const prevDemo = parsedTemplate.demoUrl || '';
    const prevAutoAdmin = deriveAdminUrlFromDemo(prevDemo);
    const newAutoAdmin = deriveAdminUrlFromDemo(newDemoUrl);

    // Kiểm tra xem có nên tự động cập nhật link admin hay không:
    // Tự động cập nhật nếu adminUrl đang trống, hoặc bằng với link tự động cũ, hoặc đang trỏ tới /admin.html
    const shouldUpdateAdmin =
      !parsedTemplate.adminUrl ||
      parsedTemplate.adminUrl.trim() === '' ||
      parsedTemplate.adminUrl === prevAutoAdmin ||
      parsedTemplate.adminUrl.endsWith('/admin.html');

    // Tự động cập nhật originUrl nếu đang rỗng hoặc trùng với demo cũ
    let newOriginUrl = parsedTemplate.originUrl;
    if (!parsedTemplate.originUrl || parsedTemplate.originUrl === prevDemo) {
      try {
        const u = new URL(newDemoUrl.startsWith('http') ? newDemoUrl : `https://${newDemoUrl}`);
        newOriginUrl = u.origin;
      } catch {
        newOriginUrl = newDemoUrl.split('?')[0].split('#')[0].replace(/\/+$/, '');
      }
    }

    setParsedTemplate(prev => {
      if (!prev) return null;
      return {
        ...prev,
        demoUrl: newDemoUrl,
        originUrl: newOriginUrl,
        adminUrl: shouldUpdateAdmin && newAutoAdmin ? newAutoAdmin : prev.adminUrl
      };
    });
  };

  // 1-Click Pull Manifest from URL
  const handlePullManifest = async () => {
    if (!targetUrl.trim()) {
      toast.error('Vui lòng nhập đường dẫn URL của template con');
      return;
    }

    setIsPulling(true);
    setDiagnostics(null);
    try {
      const res = await api.templates.pullManifest(targetUrl.trim());
      if (res && res.manifest) {
        setDiagnostics(res.diagnostics);
        setDetectedSource(res.detectedSource);
        setLatencyMs(res.latencyMs || 0);

        const m = res.manifest;
        const demo = m.demoUrl || targetUrl.trim();
        const derivedAdmin = m.adminUrl || deriveAdminUrlFromDemo(demo);
        setParsedTemplate({
          id: m.id || `tpl-${m.slug || Date.now().toString(36)}`,
          name: m.name || 'AI Studio Template',
          slug: m.slug || `tpl-${Date.now().toString(36)}`,
          description: m.description || '',
          categoryId: m.categoryId || (categories[0]?.id || 'c1'),
          categoryName: m.categoryName || (categories[0]?.name || 'Chung'),
          price: Number(m.price) || 490000,
          salePrice: m.salePrice ? Number(m.salePrice) : 390000,
          currency: m.currency || 'VND',
          originUrl: m.originUrl || targetUrl.trim(),
          demoUrl: demo,
          adminUrl: derivedAdmin,
          thumbnail: m.thumbnail || 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800',
          gallery: Array.isArray(m.gallery) && m.gallery.length > 0 ? m.gallery : [m.thumbnail || 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800'],
          version: m.version || '1.0.0',
          schemaVersion: m.schemaVersion || '1.0.0',
          status: m.status || 'published',
          badge: m.badge || 'new',
          isNew: m.isNew ?? true,
          isPopular: m.isPopular ?? false,
          isFeatured: m.isFeatured ?? true,
          tags: Array.isArray(m.tags) ? m.tags : (typeof m.tags === 'string' ? m.tags.split(',').map((t: string) => t.trim()) : ['AI Studio', 'V2 Bridge']),
          editableFields: Array.isArray(m.editableFields) && m.editableFields.length > 0 ? m.editableFields : [
            { id: 'f1', key: 'hero_title', label: 'Tiêu đề trang chính', type: 'string', isRequired: true, defaultValue: m.name || 'Chào mừng' },
            { id: 'f2', key: 'hero_subtitle', label: 'Phụ đề giới thiệu', type: 'text', isRequired: false, defaultValue: m.description || '' },
          ],
          defaultData: m.defaultData || {
            hero_title: m.name || 'Chào mừng',
            hero_subtitle: m.description || ''
          },
          seo: m.seo || {
            titleTemplate: `%s | ${m.name || 'Template'}`,
            description: m.description || ''
          }
        });

        if (m.bridgeConfig) {
          setBridgeConfig({
            enabled: m.bridgeConfig.enabled ?? true,
            scriptUrl: m.bridgeConfig.scriptUrl,
            r2BucketSync: m.bridgeConfig.r2BucketSync ?? true,
            storagePrefix: m.bridgeConfig.storagePrefix || `templates/${m.slug}/`
          });
        }

        // Set sandbox URL
        setSandboxUrl(m.demoUrl || targetUrl.trim());
        toast.success('Đã kéo và phân tích thành công cấu hình template con!');
      } else {
        toast.error('Không tìm thấy cấu hình manifest hợp lệ');
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi kéo cấu hình từ URL template con');
    } finally {
      setIsPulling(false);
    }
  };

  // Parse Manual JSON Input
  const handleParseJson = () => {
    if (!jsonInput.trim()) {
      toast.error('Vui lòng dán chuỗi JSON manifest');
      return;
    }

    try {
      const m = JSON.parse(jsonInput.trim());
      if (!m.name && !m.slug && !m.id) {
        toast.error('JSON thiếu các trường nhận diện cơ bản (name, slug hoặc id)');
        return;
      }

      const generatedDiag: DiagnosticResult = {
        manifestValid: true,
        originReachable: Boolean(m.originUrl || m.demoUrl),
        bridgeDetected: Boolean(m.bridgeConfig || m.bridgeVersion || m.shopBridge),
        r2StorageReady: Boolean(m.bridgeConfig?.r2BucketSync || m.r2Storage),
        schemaCompatible: Array.isArray(m.editableFields) && m.editableFields.length > 0,
        subdomainReady: true,
        details: [
          'JSON Manifest hợp lệ và đã parse thành công',
          m.originUrl ? `Origin URL: ${m.originUrl}` : 'Chưa có Origin URL rõ ràng',
          m.bridgeConfig?.r2BucketSync ? 'Cloudflare R2 Bucket Sync: Được kích hoạt' : 'Cloudflare R2: Sử dụng thiết lập mặc định của Shop',
          `Số trường tùy biến (Editable fields): ${Array.isArray(m.editableFields) ? m.editableFields.length : 0}`
        ]
      };

      setDiagnostics(generatedDiag);
      setDetectedSource('Dán trực tiếp JSON');
      setLatencyMs(0);

      const cleanSlug = m.slug || m.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `tpl-${Date.now().toString(36)}`;
      setParsedTemplate({
        id: m.id || `tpl-${cleanSlug}`,
        name: m.name || 'AI Studio Template',
        slug: cleanSlug,
        description: m.description || '',
        categoryId: m.categoryId || (categories[0]?.id || 'c1'),
        categoryName: m.categoryName || (categories[0]?.name || 'Chung'),
        price: Number(m.price) || 490000,
        salePrice: m.salePrice ? Number(m.salePrice) : 390000,
        currency: m.currency || 'VND',
        originUrl: m.originUrl || m.demoUrl || '',
        demoUrl: m.demoUrl || m.originUrl || '',
        adminUrl: m.adminUrl || deriveAdminUrlFromDemo(m.demoUrl || m.originUrl || ''),
        thumbnail: m.thumbnail || 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800',
        gallery: Array.isArray(m.gallery) && m.gallery.length > 0 ? m.gallery : [m.thumbnail || 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800'],
        version: m.version || '1.0.0',
        schemaVersion: m.schemaVersion || '1.0.0',
        status: m.status || 'published',
        badge: m.badge || 'new',
        isNew: m.isNew ?? true,
        isPopular: m.isPopular ?? false,
        isFeatured: m.isFeatured ?? true,
        tags: Array.isArray(m.tags) ? m.tags : (typeof m.tags === 'string' ? m.tags.split(',').map((t: string) => t.trim()) : ['AI Studio', 'V2 Bridge']),
        editableFields: Array.isArray(m.editableFields) && m.editableFields.length > 0 ? m.editableFields : [
          { id: 'f1', key: 'hero_title', label: 'Tiêu đề trang chính', type: 'string', isRequired: true, defaultValue: m.name || 'Chào mừng' },
          { id: 'f2', key: 'hero_subtitle', label: 'Phụ đề giới thiệu', type: 'text', isRequired: false, defaultValue: m.description || '' },
        ],
        defaultData: m.defaultData || {
          hero_title: m.name || 'Chào mừng',
          hero_subtitle: m.description || ''
        },
        seo: m.seo || {
          titleTemplate: `%s | ${m.name || 'Template'}`,
          description: m.description || ''
        }
      });

      if (m.bridgeConfig) {
        setBridgeConfig({
          enabled: m.bridgeConfig.enabled ?? true,
          scriptUrl: m.bridgeConfig.scriptUrl,
          r2BucketSync: m.bridgeConfig.r2BucketSync ?? true,
          storagePrefix: m.bridgeConfig.storagePrefix || `templates/${cleanSlug}/`
        });
      }

      if (m.demoUrl || m.originUrl) {
        setSandboxUrl(m.demoUrl || m.originUrl);
      }

      toast.success('Đã parse thành công JSON cấu hình!');
    } catch (err: any) {
      toast.error('Cú pháp JSON không hợp lệ: ' + err.message);
    }
  };

  // Load sample JSON
  const handleLoadSampleJson = () => {
    const sample = {
      "$schema": "https://webcuaban.site/schemas/template-manifest-v2.json",
      "id": "tpl-photograph-pro-v2",
      "name": "Photograph & Cinema Portfolio 4K",
      "slug": "photograph-cinema-pro",
      "description": "Template nghệ thuật chuyên nghiệp cho Nhiếp ảnh gia, Nhà làm phim, Đạo diễn hình ảnh với hệ thống Lightbox 4K và kết nối R2 Cloudflare.",
      "categoryId": "c3",
      "categoryName": "Photographer & Video Creator",
      "price": 590000,
      "salePrice": 450000,
      "currency": "VND",
      "originUrl": "https://photograph.webcuaban.site",
      "demoUrl": "https://photograph.webcuaban.site",
      "adminUrl": "https://photograph.webcuaban.site/admin.html",
      "thumbnail": "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1200&auto=format&fit=crop&q=80",
      "gallery": [
        "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1200&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=1200&auto=format&fit=crop&q=80"
      ],
      "version": "2.1.0",
      "badge": "popular",
      "isPopular": true,
      "isNew": false,
      "status": "published",
      "tags": ["Photography", "4K Video", "Dark Mode", "R2 Sync", "Shop Bridge"],
      "bridgeConfig": {
        "enabled": true,
        "scriptUrl": "https://photograph.webcuaban.site/Shop-Bridge.js",
        "r2BucketSync": true,
        "storagePrefix": "templates/photograph-pro/"
      },
      "editableFields": [
        { "id": "f1", "key": "brand_name", "label": "Tên Studio / Nhiếp ảnh gia", "type": "string", "isRequired": true, "defaultValue": "Alexandre Laurent" },
        { "id": "f2", "key": "tagline", "label": "Khẩu hiệu sáng tạo", "type": "string", "isRequired": true, "defaultValue": "Visual Storyteller & Cinema Director" },
        { "id": "f3", "key": "about_bio", "label": "Tiểu sử giới thiệu", "type": "text", "isRequired": false, "defaultValue": "Hơn 10 năm kinh nghiệm chụp ảnh thời trang quốc tế và quay phim tài liệu nghệ thuật." },
        { "id": "f4", "key": "accent_color", "label": "Màu sắc chủ đạo", "type": "string", "isRequired": false, "defaultValue": "#f59e0b" }
      ],
      "defaultData": {
        "brand_name": "Alexandre Laurent",
        "tagline": "Visual Storyteller & Cinema Director",
        "about_bio": "Hơn 10 năm kinh nghiệm chụp ảnh thời trang quốc tế và quay phim tài liệu nghệ thuật.",
        "accent_color": "#f59e0b"
      }
    };
    setJsonInput(JSON.stringify(sample, null, 2));
    toast.info('Đã tải mẫu JSON chuẩn hóa V2');
  };

  // Save and Activate Template to Shop
  const handleSaveAndActivate = async () => {
    if (!parsedTemplate || !parsedTemplate.name || !parsedTemplate.slug) {
      toast.error('Thiếu thông tin template cần kích hoạt');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<Template> = {
        ...parsedTemplate,
        price: Number(parsedTemplate.price) || 490000,
        salePrice: parsedTemplate.salePrice ? Number(parsedTemplate.salePrice) : undefined,
        tags: Array.isArray(parsedTemplate.tags) ? parsedTemplate.tags : ['AI Studio'],
        updatedAt: new Date().toISOString()
      };

      // Try update if template exists, otherwise create
      let saved: Template;
      try {
        const existing = await api.templates.getBySlug(payload.slug!);
        if (existing) {
          saved = await api.templates.update(existing.id, payload);
          toast.success(`Đã cập nhật và đồng bộ Template "${saved.name}" thành công!`);
        } else {
          saved = await api.templates.create(payload);
          toast.success(`Đã kích hoạt và đưa Template "${saved.name}" lên Shop thành công!`);
        }
      } catch (e) {
        saved = await api.templates.create(payload);
        toast.success(`Đã kích hoạt Template "${saved.name}" thành công!`);
      }

      // Automatically redirect or give action
      toast.custom((t: any) => (
        <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-200 flex flex-col gap-2">
          <p className="font-semibold text-slate-800">Template đã sẵn sàng trên Shop mẹ!</p>
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => {
                toast.dismiss(t);
                navigate(`/templates/${saved.slug}`);
              }}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700"
            >
              Xem trang Template
            </button>
            <button
              onClick={() => {
                toast.dismiss(t);
                navigate('/admin/templates');
              }}
              className="px-3 py-1.5 bg-slate-200 text-slate-800 rounded-lg text-xs font-bold hover:bg-slate-300"
            >
              Vào Quản lý Template
            </button>
          </div>
        </div>
      ), { duration: 8000 });
    } catch (err: any) {
      toast.error('Lỗi khi lưu template: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      setIsSaving(false);
    }
  };

  // Test Bridge Sandbox Ping
  const handleRunBridgeTest = async () => {
    const target = sandboxUrl.trim() || parsedTemplate?.originUrl || parsedTemplate?.demoUrl || '';
    if (!target) {
      toast.error('Vui lòng nhập URL cần kiểm tra Sandbox');
      return;
    }

    setIsTestingBridge(true);
    setBridgeTestResult(null);
    try {
      const res = await api.templates.testBridge({ originUrl: target });
      setBridgeTestResult(res);
      toast.success(`Kiểm tra thành công: HTTP ${res.httpStatus} (Ping: ${res.latencyMs}ms)`);
    } catch (err: any) {
      toast.error(err.message || 'Kiểm tra thất bại');
    } finally {
      setIsTestingBridge(false);
    }
  };

  // Send PostMessage to Sandbox Iframe
  const sendSandboxEvent = (type: string, data: any) => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) {
      toast.error('Iframe sandbox chưa sẵn sàng');
      return;
    }
    const message = { type, data, timestamp: Date.now() };
    iframeRef.current.contentWindow.postMessage(message, '*');

    setSandboxLog(prev => [
      {
        time: new Date().toLocaleTimeString(),
        type,
        message: JSON.stringify(data, null, 2),
        direction: 'out'
      },
      ...prev.slice(0, 49)
    ]);
    toast.info(`Đã bắn event [${type}] vào template con`);
  };

  // Master Prompt for Child Projects
  const masterPromptText = `[NHIỆM VỤ THIẾT LẬP KẾT NỐI V3 CHUẨN HÓA CHO DỰ ÁN TEMPLATE CON ĐẾN SHOP MẸ (SHOP-BRIDGE)]

Bạn là kỹ sư phụ trách dự án template con này. Dự án này được thiết kế để tích hợp tự động và bán trên nền tảng Shop Mẹ (Portio / Webcuaban.site) thông qua chuẩn V3 Bridge.

Vui lòng thực hiện NGAY các bước chuẩn hóa sau trong mã nguồn của dự án này:

===================================================================
1. TẠO FILE MANIFEST CHUẨN TẠI ĐƯỜNG DẪN: public/.well-known/shop-template-manifest.json
===================================================================
Nội dung file JSON phải chứa cấu trúc chuẩn hóa sau (hãy tự động trích xuất đúng tên dự án, ảnh thumbnail thực tế, mô tả thực tế của dự án hiện tại):
{
  "$schema": "https://webcuaban.site/schemas/template-manifest-v2.json",
  "id": "tpl-[ten-slug-du-an]",
  "name": "[Tên dự án template con của bạn]",
  "slug": "[slug-khong-dau-ngan-gon]",
  "description": "[Mô tả chi tiết tính năng của template]",
  "categoryId": "c3",
  "categoryName": "Photographer & Video Creator",
  "price": 490000,
  "salePrice": 390000,
  "currency": "VND",
  "originUrl": window.location.origin (hoặc URL chính của dự án),
  "demoUrl": window.location.origin,
  "adminUrl": window.location.origin + "/admin.html",
  "thumbnail": "[Đường dẫn ảnh preview thumbnail đại diện]",
  "gallery": ["[Ảnh 1]", "[Ảnh 2]"],
  "version": "1.0.0",
  "badge": "new",
  "status": "published",
  "tags": ["AI Studio", "Responsive", "Fast CDN", "R2 Ready"],
  "bridgeConfig": {
    "enabled": true,
    "scriptUrl": "https://www.webcuaban.site/Shop-Bridge.js",
    "r2BucketSync": true,
    "storagePrefix": "templates/[slug-du-an]/"
  },
  "editableFields": [
    { "id": "f1", "key": "brand_name", "label": "Tên Thương Hiệu / Khách Hàng", "type": "string", "isRequired": true, "defaultValue": "[Giá trị mẫu]" },
    { "id": "f2", "key": "hero_title", "label": "Tiêu đề trang chính", "type": "string", "isRequired": true, "defaultValue": "[Tiêu đề mẫu]" },
    { "id": "f3", "key": "hero_description", "label": "Đoạn giới thiệu", "type": "text", "isRequired": false, "defaultValue": "[Đoạn mô tả mẫu]" },
    { "id": "f4", "key": "accent_color", "label": "Màu chủ đạo", "type": "string", "isRequired": false, "defaultValue": "#6366f1" }
  ],
  "defaultData": {
    "brand_name": "[Giá trị mẫu]",
    "hero_title": "[Tiêu đề mẫu]",
    "hero_description": "[Đoạn mô tả mẫu]",
    "accent_color": "#6366f1"
  }
}

* QUY TẮC ĐỒNG BỘ: TỰ ĐỘNG TẠO "CUSTOM ADMIN URL" CĂN CỨ VÀO "ĐƯỜNG DẪN LIVE DEMO":
- Khi người dùng/admin điền vào trường thông tin "Đường Dẫn Live Demo" (demoUrl) trên form Kết Nối Template của Shop Mẹ, hệ thống sẽ TỰ ĐỘNG CĂN CỨ VÀO URL ĐÃ ĐIỀN TRÊN LIVE DEMO ĐỂ TẠO RA LINK URL ĐẾN ADMIN ("Custom Admin URL của Template con").
- Quy chuẩn bắt buộc cho dự án template con:
  1. Hỗ trợ cả 2 đường dẫn trang quản trị: \`/admin\` và \`/admin.html\`.
     + Nếu dùng React Router (Vite / Next.js SPA): Trong App.tsx phải khai báo cả 2 route:
       <Route path="/admin" element={<AdminPage />} />
       <Route path="/admin.html" element={<AdminPage />} />
     + Để không bị lỗi 404 trên Vercel: BẮT BUỘC tạo file \`vercel.json\` ở thư mục gốc:
       { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
     + Nếu dùng HTML tĩnh hoặc Multi-Page Vite: Đảm bảo có file \`admin.html\` và khai báo trong \`vite.config.ts\` (rollupOptions.input).
  2. Trong file \`shop-template-manifest.json\`, thuộc tính "adminUrl" khai báo: \`"adminUrl": window.location.origin + "/admin.html"\`.
  3. BẮT BUỘC nhúng duy nhất thẻ script Shop-Bridge.js vào thẻ <head> của \`index.html\` (và \`admin.html\` nếu là file riêng):
     \`<script src="https://www.webcuaban.site/Shop-Bridge.js"></script>\`
     (TUYỆT ĐỐI KHÔNG tự tạo thêm component header hay thanh dùng thử riêng bằng code React/HTML, vì Shop-Bridge.js đã tự động render thanh header chuẩn của Shop!).
  4. Nút "Chỉnh Sửa" (EDIT) hoặc "Vào Quản Trị" trên trang chủ: gán sự kiện điều hướng qua \`window.ShopBridge.getAdminUrl()\` hoặc \`/admin.html\` kèm search params để giữ nguyên toàn bộ tham số phiên dùng thử (hoặc để Shop-Bridge.js tự động nhận diện và gán link).

===================================================================
2. NHÚNG CẦU NỐI SHOP-BRIDGE.JS (TỰ ĐỘNG HIỂN THỊ THANH HEADER CHUẨN CỦA SHOP):
===================================================================
A. ĐỐI VỚI TEMPLATE MỚI:
Bạn KHÔNG CẦN và TUYỆT ĐỐI KHÔNG tự tạo bất kỳ file hay component header dùng thử nào (như ShopTrialHeader.tsx hay thanh banner riêng).

Chỉ cần nhúng DUY NHẤT 1 thẻ script sau vào trong cặp thẻ <head>...</head> của file \`index.html\` (và cả \`admin.html\` nếu là trang tĩnh độc lập):
\`\`\`html
<script src="https://www.webcuaban.site/Shop-Bridge.js"></script>
\`\`\`

B. NẾU DỰ ÁN ĐÃ LỠ TẠO COMPONENT HEADER THỦ CÔNG TRƯỚC ĐÓ:
- XÓA NGAY file \`src/components/ShopTrialHeader.tsx\` (hoặc component header dùng thử tự tạo tương tự).
- Trong \`App.tsx\` (hoặc layout): Gỡ bỏ \`import ShopTrialHeader...\`, xóa thẻ \`<ShopTrialHeader />\` và xóa class đệm thủ công thừa \`pt-[46px]\`.
- Toàn bộ thanh header dùng thử sẽ do \`Shop-Bridge.js\` tự động hiển thị và quản lý 100%.

* CƠ CHẾ HOẠT ĐỘNG HOÀN TOÀN TỰ ĐỘNG VÀ ĐỒNG BỘ CỦA SHOP-BRIDGE.JS:
1. Tự động hiển thị thanh Header Dùng Thử Mua Template chuẩn mực của Shop Mẹ:
   - Thanh Header nền Gradient Cam - Hồng - Tím sang trọng với Logo Webcuaban chính thức.
   - Dòng chữ: "Đang dùng thử template. | Mua ngay để sở hữu tên miền riêng & kích hoạt bản quyền".
   - Nút tròn nền trắng chữ cam nổi bật "MUA NGAY" (kèm icon giỏ hàng), tự động liên kết tới trang mua template của Shop mẹ.
   - Nút tắt nhanh banner "✕".
2. Tự động tương thích bố cục giao diện:
   - Tự động cộng khoảng trống \`padding-top: 46px\` cho \`<body>\`.
   - Tự động quét và đẩy các thanh Navbar/Header cố định (fixed / sticky) của template con xuống dưới banner, tuyệt đối không bị đè che khuất.
3. Tự động ẨN THÔNG MINH khi mở Modal / Popup / Drawer:
   - Khi người dùng bấm chỉnh sửa, upload ảnh, mở hộp thoại cấu hình, thanh header dùng thử sẽ tự động ẩn ngay lập tức để không bao giờ che khuất nút Lưu hay form nhập liệu của template con.
   - Khi đóng Modal / Popup thì thanh header tự động hiện trở lại.
4. Tự động ẨN HOÀN TOÀN 100% khi người dùng đã mua bản quyền:
   - Khi truy cập với tư cách chủ sở hữu (\`licensed=true\` hoặc \`role=owner\`), thanh header dùng thử sẽ ẩn vĩnh viễn, trả lại không gian 100% sạch sẽ cho khách hàng.
5. Tự động kết nối nút "EDIT" / "Admin" và "Về Trang Chủ":
   - Tự động bắt sự kiện tất cả các nút có nhãn "Chỉnh sửa", "EDIT", "Admin", "Vào quản trị" trên trang chủ để chuyển đến trang admin mà không làm mất query params của phiên dùng thử.

===================================================================
3. CƠ CHẾ EDIT TEMPLATE VÀ LƯU TRỮ ĐỐI VỚI 3 TRƯỜNG HỢP USER CỦA SHOP:
===================================================================
Shop mẹ (webcuaban.site) và Shop-Bridge.js vận hành dựa trên 3 phân loại người dùng:

* TRƯỜNG HỢP 1 (TH1: Khách vãng lai / Guest):
  - Nhận diện: Khách truy cập trực tiếp hoặc bấm "Xem thử" từ Shop mà chưa đăng nhập tài khoản.
  - Nạp dữ liệu: Lần đầu tiên nạp đúng 100% dữ liệu gốc mặc định (defaultData) của template.
  - Chỉnh sửa & Lưu: Mọi thay đổi lưu vào LocalStorage & IndexedDB riêng biệt của khách: \`guest_tpl_{templateId}\`. TUYỆT ĐỐI không ghi đè vào Supabase.
  - Giao diện: Tự động hiển thị thanh Header màu cam tím ở trên đỉnh kèm nút "MUA NGAY". Thanh Header TỰ ĐỘNG ẨN khi mở bất kỳ Modal/Popup/Drawer sửa thông tin nào.

* TRƯỜNG HỢP 2 (TH2: User đã đăng nhập Shop nhưng chưa mua bản quyền / Trial):
  - Nhận diện: User đăng nhập tài khoản trên Shop rồi bấm "Chỉnh sửa thử / Dùng thử" (URL có tham số: user={userId}&trial=true).
  - Nạp dữ liệu: Lần đầu tiên vào mở template hiển thị 100% dữ liệu gốc ban đầu của template (TUYỆT ĐỐI cách ly, không nạp dữ liệu của khách vãng lai TH1).
  - Chỉnh sửa & Lưu: Mọi thao tác lưu ghi vào LocalStorage & IndexedDB riêng biệt theo ID người dùng: \`user_{userId}_tpl_{templateId}\`. TUYỆT ĐỐI không ghi vào Supabase.
  - Giao diện: Tự động hiển thị thanh Header cam tím thông báo tài khoản đang dùng thử kèm nút "MUA NGAY". TỰ ĐỘNG ẨN khi mở Popup chỉnh sửa.

* TRƯỜNG HỢP 3 (TH3: User đã thanh toán mua bản quyền / Owner / Licensed):
  - Nhận diện: User đã mua template, mở template từ Dashboard cá nhân hoặc tên miền riêng (URL có: licensed=true&role=owner hoặc subdomain riêng).
  - Nạp dữ liệu: Tự động đọc 100% dữ liệu đã lưu từ Cloud Database Supabase PostgreSQL qua API Shop (/api/portfolios/:id) và Supabase REST trực tiếp.
  - Chỉnh sửa & Lưu: Mọi thao tác bấm "Lưu" sẽ đồng bộ 100% lên Cloud Database Supabase PostgreSQL qua API (/api/portfolios/:id/sync).
  - Giao diện: TỰ ĐỘNG ẨN 100% thanh Header dùng thử (không bao giờ hiển thị thanh cam tím làm phiền khách hàng trả phí).
  - Cơ chế bẫy thông minh: ShopBridge tự động bẫy (intercept) mọi lệnh \`localStorage.setItem\` của template con để tự động đẩy lên Supabase kể cả khi template con quên gọi hàm \`ShopBridge.saveData()\`.

===================================================================
4. CODE MẪU TÍCH HỢP TRONG CÁC FILE JS/HTML CỦA TEMPLATE CON:
===================================================================

A. Khi nạp dữ liệu ban đầu (Tại cả index.html và admin.html):
\`\`\`javascript
// Dữ liệu gốc mặc định của template con
const defaultTemplateData = {
  brand_name: "My Studio",
  hero_title: "Creative Filmmaker & Photographer",
  hero_description: "Chuyên sản xuất video điện ảnh...",
  accent_color: "#6366f1",
  projects: []
};

// Gọi ShopBridge.loadData: Tự động phân luồng nạp đúng dữ liệu TH1, TH2 hoặc TH3!
window.addEventListener('DOMContentLoaded', async () => {
  let currentData = defaultTemplateData;
  if (window.ShopBridge && typeof window.ShopBridge.loadData === 'function') {
    currentData = await window.ShopBridge.loadData(defaultTemplateData);
  }
  
  // Đổ dữ liệu currentData vào trang web (hoặc điền vào form admin)
  renderMyTemplate(currentData);
});
\`\`\`

B. Khi người dùng bấm nút "Lưu Thay Đổi" (Trong admin.html):
\`\`\`javascript
async function handleSavePortfolio(formData) {
  try {
    if (window.ShopBridge && typeof window.ShopBridge.saveData === 'function') {
      // Hàm này tự động phân phối: Lưu vào guest_tpl cho TH1, user_tpl cho TH2, và đẩy thẳng lên Supabase cho TH3!
      const result = await window.ShopBridge.saveData(formData);
      alert('Đã lưu thành công!');
    } else {
      localStorage.setItem('portfolio_data', JSON.stringify(formData));
    }
  } catch (error) {
    console.error('Lỗi lưu dữ liệu:', error);
    alert('Không thể lưu dữ liệu, vui lòng thử lại.');
  }
}
\`\`\`

C. Khi tải ảnh / video lên (Tránh phình bộ nhớ LocalStorage):
\`\`\`javascript
async function handleImageUpload(fileInput) {
  const file = fileInput.files[0];
  if (!file) return;

  if (window.ShopBridge && typeof window.ShopBridge.uploadMedia === 'function') {
    // Tự động nén Canvas và đẩy lên Cloudflare R2 / Server Shop, trả về URL siêu nhẹ
    const uploadedUrl = await window.ShopBridge.uploadMedia({ file: file, category: 'images' });
    return uploadedUrl;
  }
}
\`\`\`

D. Điều hướng giữa "Trang Chủ" và "Trang Admin" (Bảo toàn phiên dùng thử/bản quyền):
\`\`\`javascript
// Nút "Về trang chủ" trong admin.html:
homeLinkBtn.addEventListener('click', (e) => {
  e.preventDefault();
  if (window.ShopBridge && typeof window.ShopBridge.getHomeUrl === 'function') {
    window.location.href = window.ShopBridge.getHomeUrl();
  } else {
    window.location.href = 'index.html';
  }
});

// Nút "Vào trang quản trị" trong index.html (nếu có):
adminLinkBtn.addEventListener('click', (e) => {
  e.preventDefault();
  if (window.ShopBridge && typeof window.ShopBridge.getAdminUrl === 'function') {
    window.location.href = window.ShopBridge.getAdminUrl();
  } else {
    window.location.href = 'admin.html';
  }
});
\`\`\`

===================================================================
5. TRONG TRANG ADMIN HOẶC FOOTER CỦA TEMPLATE CON:
===================================================================
- Thêm 1 nút nhỏ hoặc mục "Kết Nối Shop Mẹ"
- Khi bấm vào hiển thị Popup chứa:
  + URL Manifest: (ví dụ: \`\${window.location.origin}/.well-known/shop-template-manifest.json\`) kèm nút "Copy URL".
  + Đoạn mã JSON Manifest đầy đủ kèm nút "Sao Chép JSON Cấu Hình".
- Thông báo cho người dùng: "Chỉ cần dán URL hoặc mã JSON này vào trang 'Kết nối Template Con' của Admin Shop mẹ là toàn bộ dữ liệu sẽ tự động đồng bộ 100%!".

Hãy tiến hành thực thi và cập nhật các file trên ngay lập tức!`;

  const copyPromptToClipboard = () => {
    navigator.clipboard.writeText(masterPromptText);
    toast.success('Đã sao chép toàn bộ Master Prompt V3 vào Clipboard!');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-20 top-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Chuẩn Hóa Hệ Thống AI Studio V2</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Cable className="w-8 h-8 text-indigo-400" />
              <span>Kết Nối Template Con (Template Bridge Hub)</span>
            </h1>
            <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
              Cơ chế đồng bộ hóa toàn diện đa dự án: Kéo tự động cấu hình từ URL hoặc dán JSON Manifest để matching dữ liệu, tích hợp Shop-Bridge.js 2 chiều, kích hoạt lưu ảnh vào Cloudflare R2 và đưa template lên Shop chỉ với 1 cú click.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setActiveTab('prompt')}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-2 active:scale-95"
            >
              <Copy className="w-4 h-4" />
              <span>Lấy Prompt Gửi Template Con</span>
            </button>
            <button
              onClick={() => navigate('/admin/templates')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-2"
            >
              <Layers className="w-4 h-4 text-slate-300" />
              <span>Danh Sách Template Shop</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center gap-2 sm:gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'import'
                ? 'bg-white text-slate-900 shadow-lg'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Kéo & Nhập Cấu Hình (Import)</span>
          </button>

          <button
            onClick={() => setActiveTab('sandbox')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'sandbox'
                ? 'bg-white text-slate-900 shadow-lg'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Radio className="w-4 h-4 text-indigo-500" />
            <span>Live Sandbox & Test Bridge</span>
          </button>

          <button
            onClick={() => setActiveTab('prompt')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'prompt'
                ? 'bg-white text-slate-900 shadow-lg'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Master Prompt Chuẩn Hóa V2</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: IMPORT & SYNC (PULL URL OR PASTE JSON)                 */}
      {/* ============================================================== */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          {/* Step 1: Input method selection card */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                  <span>Phương thức nạp cấu hình kết nối</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Chọn kéo tự động qua URL máy chủ của template con hoặc dán chuỗi JSON Manifest chuẩn
                </p>
              </div>

              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setImportMode('url')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    importMode === 'url'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ⚡ Kéo qua 1 URL (Khuyến nghị)
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('json')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    importMode === 'json'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📋 Dán JSON Manifest
                </button>
              </div>
            </div>

            {/* Mode A: URL Pull */}
            {importMode === 'url' ? (
              <div className="mt-5 space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Đường dẫn Live URL / Domain / AI Studio Preview của Template con
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <Globe className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      placeholder="https://photograph.webcuaban.site hoặc https://ais-preview-...run.app"
                      className="w-full h-12 pl-11 pr-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handlePullManifest}
                    disabled={isPulling}
                    className="h-12 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white text-sm font-bold shadow-md hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
                  >
                    {isPulling ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang Quét & Matching...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-amber-300" />
                        <span>Kéo & Matching Tự Động</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    Hệ thống sẽ tự động quét các endpoint chuẩn: <code className="font-mono text-indigo-600 font-bold">/.well-known/shop-template-manifest.json</code>, <code className="font-mono text-indigo-600 font-bold">/shop-template-manifest.json</code> và trích xuất cấu hình tự động.
                  </span>
                </div>
              </div>
            ) : (
              /* Mode B: Paste JSON */
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Dán nội dung JSON Manifest xuất ra từ Template con
                  </label>
                  <button
                    type="button"
                    onClick={handleLoadSampleJson}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
                  >
                    Tải mẫu JSON mẫu V2 để test thử
                  </button>
                </div>

                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  rows={8}
                  placeholder={`{\n  "id": "tpl-photograph-pro",\n  "name": "Photograph & Cinema 4K",\n  "slug": "photograph-cinema",\n  "price": 490000,\n  "originUrl": "https://photograph.webcuaban.site",\n  "editableFields": [...]\n}`}
                  className="w-full p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl border-2 border-slate-700 focus:border-indigo-500 focus:outline-none transition-all leading-relaxed"
                />

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const parsed = JSON.parse(jsonInput);
                        setJsonInput(JSON.stringify(parsed, null, 2));
                        toast.success('Đã định dạng JSON');
                      } catch (e: any) {
                        toast.error('JSON không hợp lệ: ' + e.message);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                  >
                    Định Dạng JSON
                  </button>
                  <button
                    type="button"
                    onClick={handleParseJson}
                    className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Kiểm Tra & Parse Dữ Liệu</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: 6-Step Health Diagnostic Matrix */}
          {diagnostics && (
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-sm space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                    <span>Bảng chẩn đoán sức khỏe kết nối (6 Tiêu chí V2)</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Nguồn phát hiện: <span className="font-semibold text-indigo-600">{detectedSource}</span> • Phản hồi ping: <span className="font-mono font-bold text-slate-700">{latencyMs}ms</span>
                  </p>
                </div>

                <div className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Sẵn sàng Matching</span>
                </div>
              </div>

              {/* 6 Diagnostic cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {/* 1. Manifest Syntax */}
                <div className={`p-4 rounded-xl border-2 flex items-start gap-3 ${
                  diagnostics.manifestValid 
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' 
                    : 'bg-red-50/60 border-red-200 text-red-900'
                }`}>
                  {diagnostics.manifestValid ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">1. Chuẩn Hóa Manifest</h4>
                    <p className="text-xs mt-0.5 opacity-90">
                      {diagnostics.manifestValid ? 'Cấu trúc trường chuẩn xác' : 'Thiếu trường nhận diện bắt buộc'}
                    </p>
                  </div>
                </div>

                {/* 2. Origin URL Reachability */}
                <div className={`p-4 rounded-xl border-2 flex items-start gap-3 ${
                  diagnostics.originReachable 
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' 
                    : 'bg-amber-50/60 border-amber-200 text-amber-900'
                }`}>
                  {diagnostics.originReachable ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">2. Phản Hồi Máy Chủ</h4>
                    <p className="text-xs mt-0.5 opacity-90">
                      {diagnostics.originReachable ? `HTTP 200 OK (${latencyMs}ms)` : 'Chưa thể kết nối Origin URL'}
                    </p>
                  </div>
                </div>

                {/* 3. Shop-Bridge.js Script */}
                <div className={`p-4 rounded-xl border-2 flex items-start gap-3 ${
                  diagnostics.bridgeDetected 
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' 
                    : 'bg-indigo-50/60 border-indigo-200 text-indigo-900'
                }`}>
                  {diagnostics.bridgeDetected ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <Workflow className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">3. Shop-Bridge.js Listener</h4>
                    <p className="text-xs mt-0.5 opacity-90">
                      {diagnostics.bridgeDetected ? 'Đã phát hiện Handshake postMessage' : 'Sử dụng cầu nối ảo hóa fallback'}
                    </p>
                  </div>
                </div>

                {/* 4. R2 Bucket Storage Gateway */}
                <div className={`p-4 rounded-xl border-2 flex items-start gap-3 ${
                  diagnostics.r2StorageReady 
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' 
                    : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}>
                  <HardDrive className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">4. Cloudflare R2 Upload</h4>
                    <p className="text-xs mt-0.5 opacity-90">
                      {diagnostics.r2StorageReady ? 'Sẵn sàng lưu file ảnh edit vào R2' : 'Dùng Storage mặc định của Shop'}
                    </p>
                  </div>
                </div>

                {/* 5. Schema Dynamic Fields */}
                <div className={`p-4 rounded-xl border-2 flex items-start gap-3 ${
                  diagnostics.schemaCompatible 
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' 
                    : 'bg-amber-50/60 border-amber-200 text-amber-900'
                }`}>
                  <Sliders className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">5. Schema Trường Động</h4>
                    <p className="text-xs mt-0.5 opacity-90">
                      {parsedTemplate?.editableFields?.length || 0} trường chỉnh sửa sẵn sàng
                    </p>
                  </div>
                </div>

                {/* 6. Subdomain & Edge Caching */}
                <div className="p-4 rounded-xl border-2 bg-emerald-50/60 border-emerald-200 text-emerald-900 flex items-start gap-3">
                  <Globe className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">6. Subdomain & Edge CDN</h4>
                    <p className="text-xs mt-0.5 opacity-90">
                      Sẵn sàng cấp phát wildcard cho khách mua
                    </p>
                  </div>
                </div>
              </div>

              {/* Diagnostic detail logs */}
              {diagnostics.details && diagnostics.details.length > 0 && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Nhật ký chẩn đoán chi tiết:</p>
                  {diagnostics.details.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Fine-Tune Form & Final Activation */}
          {parsedTemplate && (
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                    <span>Thông tin hoàn thiện & Kích hoạt vào Shop mẹ</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Các thông tin đã được tự động điền từ template con. Bạn có thể tinh chỉnh lại giá, danh mục và hình ảnh nếu muốn trước khi kích hoạt.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveAndActivate}
                  disabled={isSaving}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-extrabold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang Kích Hoạt...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 text-white" />
                      <span>LƯU & KÍCH HOẠT TEMPLATE VÀO SHOP</span>
                    </>
                  )}
                </button>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Tên Template */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Tên Template</label>
                  <input
                    type="text"
                    value={parsedTemplate.name || ''}
                    onChange={(e) => setParsedTemplate({ ...parsedTemplate, name: e.target.value })}
                    className="w-full h-11 px-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all"
                  />
                </div>

                {/* Slug định danh */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Mã Slug Định Danh</label>
                  <input
                    type="text"
                    value={parsedTemplate.slug || ''}
                    onChange={(e) => setParsedTemplate({ ...parsedTemplate, slug: e.target.value })}
                    className="w-full h-11 px-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-mono font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all"
                  />
                </div>

                {/* Danh mục */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Danh Mục Phù Hợp</label>
                  <select
                    value={parsedTemplate.categoryId || ''}
                    onChange={(e) => {
                      const selCat = categories.find(c => c.id === e.target.value);
                      setParsedTemplate({ 
                        ...parsedTemplate, 
                        categoryId: e.target.value,
                        categoryName: selCat?.name || parsedTemplate.categoryName 
                      });
                    }}
                    className="w-full h-11 px-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Giá bán VND */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Giá Bán Gốc (VND)</label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      value={parsedTemplate.price || ''}
                      onChange={(e) => setParsedTemplate({ ...parsedTemplate, price: Number(e.target.value) })}
                      className="w-full h-11 pl-9 pr-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Giá khuyến mãi */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Giá Khuyến Mãi (VND)</label>
                  <div className="relative">
                    <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      value={parsedTemplate.salePrice || ''}
                      onChange={(e) => setParsedTemplate({ ...parsedTemplate, salePrice: Number(e.target.value) })}
                      className="w-full h-11 pl-9 pr-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Huy hiệu Badge */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Huy Hiệu Hiển Thị</label>
                  <select
                    value={parsedTemplate.badge || 'new'}
                    onChange={(e) => setParsedTemplate({ 
                      ...parsedTemplate, 
                      badge: e.target.value,
                      isNew: e.target.value === 'new',
                      isPopular: e.target.value === 'popular'
                    })}
                    className="w-full h-11 px-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all"
                  >
                    <option value="new">Mới Ra Mắt (New)</option>
                    <option value="popular">Bán Chạy Nhất (Popular)</option>
                    <option value="featured">Nổi Bật (Featured)</option>
                    <option value="pro">Pro Cinema</option>
                  </select>
                </div>

                {/* Live Demo URL */}
                {/* Live Demo URL */}
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">Đường Dẫn Live Demo</label>
                    <span className="text-[11px] text-indigo-600 font-medium">Link trang chủ / xem trước</span>
                  </div>
                  <input
                    type="url"
                    value={parsedTemplate.demoUrl || ''}
                    onChange={(e) => handleDemoUrlChange(e.target.value)}
                    placeholder="https://photograph.webcuaban.site"
                    className="w-full h-11 px-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all"
                  />
                </div>

                {/* Origin URL */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">Origin URL (Nơi Chạy Ứng Dụng)</label>
                  </div>
                  <input
                    type="url"
                    value={parsedTemplate.originUrl || ''}
                    onChange={(e) => setParsedTemplate({ ...parsedTemplate, originUrl: e.target.value })}
                    className="w-full h-11 px-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all"
                  />
                </div>

                {/* Custom Admin URL */}
                <div className="lg:col-span-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">Custom Admin URL của Template con (Tùy chọn)</label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const autoAdmin = deriveAdminUrlFromDemo(parsedTemplate.demoUrl || '', 'html');
                          if (autoAdmin) {
                            setParsedTemplate(prev => ({ ...prev, adminUrl: autoAdmin }));
                            toast.success('Đã chuyển Admin URL sang dạng /admin.html!');
                          } else {
                            toast.error('Vui lòng điền Đường Dẫn Live Demo trước');
                          }
                        }}
                        className="text-[11px] font-semibold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-2 py-0.5 rounded-md border border-slate-200 transition-colors"
                        title="Tạo link admin dạng /admin.html"
                      >
                        Dạng /admin.html
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const autoAdmin = deriveAdminUrlFromDemo(parsedTemplate.demoUrl || '', 'spa');
                          if (autoAdmin) {
                            setParsedTemplate(prev => ({ ...prev, adminUrl: autoAdmin }));
                            toast.success('Đã chuyển Admin URL sang dạng /admin (SPA)!');
                          } else {
                            toast.error('Vui lòng điền Đường Dẫn Live Demo trước');
                          }
                        }}
                        className="text-[11px] font-semibold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-2 py-0.5 rounded-md border border-slate-200 transition-colors"
                        title="Tạo link admin dạng /admin cho React SPA"
                      >
                        Dạng /admin (SPA)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const autoAdmin = deriveAdminUrlFromDemo(parsedTemplate.demoUrl || '');
                          if (autoAdmin) {
                            setParsedTemplate(prev => ({ ...prev, adminUrl: autoAdmin }));
                            toast.success('Đã căn cứ vào Live Demo tạo link Admin URL thành công!');
                          } else {
                            toast.error('Vui lòng điền Đường Dẫn Live Demo trước');
                          }
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-0.5 rounded-lg border border-indigo-200 transition-colors"
                        title="Căn cứ vào Live Demo để tạo lại Admin URL"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-500" />
                        <span>Căn cứ Live Demo</span>
                      </button>
                    </div>
                  </div>
                  <input
                    type="url"
                    value={parsedTemplate.adminUrl || ''}
                    onChange={(e) => setParsedTemplate({ ...parsedTemplate, adminUrl: e.target.value })}
                    placeholder="https://photograph.webcuaban.site/admin.html"
                    className="w-full h-11 px-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all"
                  />
                  <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <p className="text-slate-500 flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                      <span>Tự động căn cứ vào <strong>Đường Dẫn Live Demo</strong> để tạo link admin tương ứng (hỗ trợ cả <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">/admin.html</code> và <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">/admin</code>).</span>
                    </p>
                    {parsedTemplate.demoUrl && (
                      <span className="font-mono text-[10px] text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                        Live Demo: {parsedTemplate.demoUrl}
                      </span>
                    )}
                  </div>
                </div>

                {/* Thumbnail Preview & URL */}
                <div className="lg:col-span-3 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">Ảnh Thumbnail Đại Diện</label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <input
                      type="url"
                      value={parsedTemplate.thumbnail || ''}
                      onChange={(e) => setParsedTemplate({ ...parsedTemplate, thumbnail: e.target.value })}
                      className="flex-1 h-11 px-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all"
                    />
                    {parsedTemplate.thumbnail && (
                      <div className="w-24 h-16 rounded-xl overflow-hidden border-2 border-slate-300 shrink-0 bg-slate-100 shadow-xs">
                        <img 
                          src={parsedTemplate.thumbnail} 
                          alt="Thumbnail Preview" 
                          className="w-full h-full object-cover"
                          onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800'; }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Mô tả */}
                <div className="lg:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Mô Tả Template</label>
                  <textarea
                    rows={3}
                    value={parsedTemplate.description || ''}
                    onChange={(e) => setParsedTemplate({ ...parsedTemplate, description: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all leading-relaxed"
                  />
                </div>
              </div>

              {/* R2 Cloudflare Bucket Gateway Box */}
              <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Cloudflare R2 Bucket Sync</h4>
                    <p className="text-xs text-slate-600">
                      Mọi file ảnh upload khi người dùng chỉnh sửa template con sẽ tự động lưu vào R2 Bucket Storage của Shop mẹ với tiền tố: <code className="font-mono text-indigo-700 font-bold">{bridgeConfig.storagePrefix}</code>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Đã Kích Hoạt Sẵn</span>
                </div>
              </div>

              {/* Bottom Final Submit */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('sandbox');
                    if (parsedTemplate.demoUrl) setSandboxUrl(parsedTemplate.demoUrl);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold transition-all flex items-center gap-2"
                >
                  <Eye className="w-4 h-4 text-slate-600" />
                  <span>Mở Sandbox Kiểm Tra 2 Chiều</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAndActivate}
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-extrabold shadow-md transition-all flex items-center gap-2 active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Xác Nhận & Đưa Vào Bán Ngay</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: LIVE SANDBOX & REAL-TIME BRIDGE TESTER                  */}
      {/* ============================================================== */}
      {activeTab === 'sandbox' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Radio className="w-5 h-5 text-indigo-600" />
                  <span>Live Sandbox & PostMessage Bridge Tester</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Nhúng trực tiếp giao diện Template con vào Iframe sandbox và kiểm tra các sự kiện 2 chiều (Handshake, R2 Upload, Save Data)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={sandboxUrl}
                  onChange={(e) => setSandboxUrl(e.target.value)}
                  placeholder="https://photograph.webcuaban.site"
                  className="h-10 px-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs sm:text-sm font-mono w-64 sm:w-80 focus:bg-white focus:border-indigo-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleRunBridgeTest}
                  disabled={isTestingBridge}
                  className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shrink-0 transition-all flex items-center gap-1.5"
                >
                  {isTestingBridge ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  <span>Test Ping</span>
                </button>
              </div>
            </div>

            {/* Test Results Banner */}
            {bridgeTestResult && (
              <div className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs space-y-2 border border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-bold">
                    ✓ Phản hồi: HTTP {bridgeTestResult.httpStatus} ({bridgeTestResult.statusText}) • Ping: {bridgeTestResult.latencyMs}ms
                  </span>
                  <span className={bridgeTestResult.allowsIframe ? 'text-emerald-400' : 'text-amber-400'}>
                    {bridgeTestResult.allowsIframe ? '✓ Iframe Cho Phép Nhúng' : '⚠️ Iframe có thể bị giới hạn bởi headers'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  <div>X-Frame-Options: <span className="text-white">{bridgeTestResult.headers?.xFrameOptions}</span></div>
                  <div>Server Type: <span className="text-white">{bridgeTestResult.headers?.server}</span></div>
                </div>
              </div>
            )}

            {/* Sandbox Action Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-600 mr-2">Gửi lệnh thử nghiệm:</span>
              <button
                type="button"
                onClick={() => sendSandboxEvent('PORTIO_PARENT_SYNC', { shopOrigin: window.location.origin, mode: 'preview' })}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-all flex items-center gap-1.5"
              >
                <Send className="w-3 h-3" />
                <span>Gửi Handshake (PORTIO_PARENT_SYNC)</span>
              </button>

              <button
                type="button"
                onClick={() => sendSandboxEvent('SAVE_CUSTOM_DATA', { hero_title: 'Tiêu Đề Thử Nghiệm Từ Shop Mẹ', timestamp: Date.now() })}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-all flex items-center gap-1.5"
              >
                <Sliders className="w-3 h-3" />
                <span>Gửi Dữ Liệu Lưu (SAVE_CUSTOM_DATA)</span>
              </button>

              <button
                type="button"
                onClick={() => sendSandboxEvent('UPLOAD_MEDIA_R2', { action: 'ping_r2_gateway', bucket: 'r2-bucket' })}
                className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200 transition-all flex items-center gap-1.5"
              >
                <HardDrive className="w-3 h-3" />
                <span>Test R2 Gateway Upload</span>
              </button>

              <button
                type="button"
                onClick={() => setSandboxLog([])}
                className="ml-auto text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Xóa Log
              </button>
            </div>
          </div>

          {/* Sandbox Split View: Iframe & Console Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Iframe Sandbox */}
            <div className="lg:col-span-2 bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm flex flex-col h-[650px]">
              <div className="h-10 bg-slate-900 px-4 flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="ml-2 font-mono text-[11px] text-slate-400 truncate max-w-sm">{sandboxUrl || 'Chưa có URL'}</span>
                </div>
                {sandboxUrl && (
                  <a href={sandboxUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[11px]">
                    <ExternalLink className="w-3 h-3" />
                    <span>Mở tab mới</span>
                  </a>
                )}
              </div>

              <div className="flex-1 bg-slate-100 relative">
                {sandboxUrl ? (
                  <iframe
                    ref={iframeRef}
                    src={sandboxUrl}
                    title="Child Template Sandbox"
                    className="w-full h-full border-none"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                    <Radio className="w-12 h-12 text-slate-300 mb-3" />
                    <p className="text-sm font-semibold text-slate-600">Chưa có URL kiểm tra Sandbox</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Nhập đường dẫn URL ở ô trên hoặc bấm "Kéo & Matching" ở Tab 1 để tự động tải giao diện template con vào đây.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Real-time Event Console Log */}
            <div className="bg-slate-950 rounded-2xl border-2 border-slate-800 p-4 shadow-sm flex flex-col h-[650px] font-mono">
              <div className="pb-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Real-time Bridge Event Log</span>
                </span>
                <span className="text-[11px] text-slate-500">{sandboxLog.length} tin</span>
              </div>

              <div className="flex-1 overflow-y-auto py-3 space-y-2 text-xs">
                {sandboxLog.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-600 text-center text-xs p-4">
                    Chưa có event nào phát sinh. Hãy bấm các nút "Gửi Handshake" hoặc thao tác trong Iframe để xem giao tiếp 2 chiều.
                  </div>
                ) : (
                  sandboxLog.map((log, idx) => (
                    <div 
                      key={idx} 
                      className={`p-2.5 rounded-lg border ${
                        log.direction === 'out' 
                          ? 'bg-indigo-950/40 border-indigo-900 text-indigo-300' 
                          : 'bg-emerald-950/40 border-emerald-900 text-emerald-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span className="font-bold">
                          {log.direction === 'out' ? '➡️ GỬI ĐI' : '⬅️ NHẬN ĐƯỢC'}: {log.type}
                        </span>
                        <span>{log.time}</span>
                      </div>
                      <pre className="text-[11px] overflow-x-auto whitespace-pre-wrap leading-tight text-slate-300">
                        {log.message}
                      </pre>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: MASTER PROMPT FOR CHILD TEMPLATES                        */}
      {/* ============================================================== */}
      {activeTab === 'prompt' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-indigo-600" />
                  <span>Bộ Master Prompt Chuẩn Hóa V3 Cho Mọi Template Con</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Quy trình 3 bước khép kín để kết nối bất kỳ dự án AI Studio template con nào vào Shop mẹ chỉ trong 30 giây.
                </p>
              </div>

              <button
                type="button"
                onClick={copyPromptToClipboard}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-2 active:scale-95 shrink-0"
              >
                <Copy className="w-4 h-4" />
                <span>Sao Chép Toàn Bộ Prompt</span>
              </button>
            </div>

            {/* 3 Step Workflow Graphic */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-200 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                  1
                </div>
                <h4 className="text-sm font-bold text-slate-900">Sao chép & Gửi cho Template con</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Bấm nút sao chép prompt bên dưới và dán vào AI Studio của bất kỳ project template con nào bạn tạo (Photo, CV, Portfolio, Video, Agency...).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-200 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                  2
                </div>
                <h4 className="text-sm font-bold text-slate-900">Template con tự tạo Manifest & Bridge</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Template con sẽ tự động tạo file <code className="font-mono text-indigo-700 font-bold">.well-known/shop-template-manifest.json</code> và tạo mục kết nối trong admin của nó.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-200 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
                  3
                </div>
                <h4 className="text-sm font-bold text-slate-900">Dán URL hoặc JSON vào Shop mẹ</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Quay lại trang này ở Admin Shop, dán URL hoặc JSON vào Tab 1, bấm &quot;Kéo &amp; Matching&quot; → Xong 100% tự động!
                </p>
              </div>
            </div>

            {/* Prompt Display Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600">
                <span>Nội dung Master Prompt V3:</span>
                <span className="text-indigo-600 font-mono">Đã tối ưu hóa cho AI Studio</span>
              </div>

              <div className="relative">
                <pre className="p-5 bg-slate-950 text-slate-200 rounded-2xl border-2 border-slate-800 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[500px]">
                  {masterPromptText}
                </pre>
                <button
                  type="button"
                  onClick={copyPromptToClipboard}
                  className="absolute right-4 top-4 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
