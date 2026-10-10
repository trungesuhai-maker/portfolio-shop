import { useState, useEffect } from 'react';
import { api } from '@/src/services/api';
import { DEFAULT_SETTINGS } from '@/src/services/defaultSettings';
import { ShopSettings } from '@/src/types';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Loading } from '@/src/components/ui/Loading';
import { MediaStorageModal } from '@/src/components/common/MediaStorageModal';
import { 
  Sliders, 
  Palette, 
  LayoutTemplate, 
  Share2, 
  Search, 
  BarChart3, 
  AlertOctagon, 
  Save, 
  Image as ImageIcon,
  ExternalLink, 
  Check,
  ShieldAlert,
  Globe,
  Plus,
  Trash2,
  HelpCircle,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

type TabKey = 'branding' | 'homepage' | 'contact_social' | 'footer' | 'seo_social' | 'analytics' | 'maintenance';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<TabKey>('branding');
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SETTINGS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Storage Modal picker control
  const [mediaPickerField, setMediaPickerField] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await api.admin.getSettings();
        if (data) {
          setSettings(prev => ({
            ...prev,
            ...data,
            logoStyle: { ...prev.logoStyle, ...(data.logoStyle || {}) },
            contact: { ...prev.contact, ...(data.contact || {}) },
            socialLinks: { ...prev.socialLinks, ...(data.socialLinks || {}) },
            footer: { ...prev.footer, ...(data.footer || {}) },
            brandColors: { ...prev.brandColors, ...(data.brandColors || {}) },
            homepage: { ...prev.homepage, ...(data.homepage || {}) },
            seo: { ...prev.seo, ...(data.seo || {}) },
            analytics: { ...prev.analytics, ...(data.analytics || {}) },
            maintenance: { ...prev.maintenance, ...(data.maintenance || {}) }
          }));
        }
      } catch (e) {
        // Defaults already defined
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.admin.updateSettings(settings);
      toast.success('Đã lưu cấu hình Shop Settings thành công không cần sửa code!');
    } catch (e) {
      toast.error('Không thể cập nhật cài đặt');
    } finally {
      setSaving(false);
    }
  };

  const handleMediaSelected = (url: string) => {
    if (!mediaPickerField) return;

    if (mediaPickerField === 'logo') {
      setSettings(prev => ({ ...prev, logo: url }));
    } else if (mediaPickerField === 'favicon') {
      setSettings(prev => ({ ...prev, favicon: url }));
    } else if (mediaPickerField === 'heroImage') {
      setSettings(prev => ({ ...prev, homepage: { ...prev.homepage, heroImage: url } }));
    } else if (mediaPickerField === 'ogImage') {
      setSettings(prev => ({ ...prev, seo: { ...prev.seo, ogImage: url } }));
    }

    setMediaPickerField(null);
    toast.success('Đã gắn tệp từ Storage vào cài đặt');
  };

  const addFooterLink = () => {
    setSettings(prev => ({
      ...prev,
      footer: {
        ...prev.footer,
        links: [...(prev.footer.links || []), { label: 'Liên kết mới', url: '/' }]
      }
    }));
  };

  const removeFooterLink = (index: number) => {
    setSettings(prev => ({
      ...prev,
      footer: {
        ...prev.footer,
        links: prev.footer.links.filter((_, i) => i !== index)
      }
    }));
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400">
        <Loading size={32} />
        <p className="text-xs font-medium mt-3">Đang tải cấu hình Cửa hàng...</p>
      </div>
    );
  }

  const tabs: Array<{ id: TabKey; label: string; icon: any }> = [
    { id: 'branding', label: 'Thương hiệu & Màu sắc', icon: Palette },
    { id: 'homepage', label: 'Trang chủ, Hero & CTA', icon: LayoutTemplate },
    { id: 'contact_social', label: 'Liên hệ & Mạng xã hội', icon: Share2 },
    { id: 'footer', label: 'Chân trang (Footer)', icon: Sliders },
    { id: 'seo_social', label: 'SEO & Social Cards', icon: Search },
    { id: 'analytics', label: 'Mã đo lường (Analytics)', icon: BarChart3 },
    { id: 'maintenance', label: 'Chế độ bảo trì', icon: AlertOctagon },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Sliders className="w-7 h-7 text-indigo-600" />
            Cấu Hình Cửa Hàng (Shop Settings)
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Quản trị viên có thể tùy biến toàn bộ nhận diện, nội dung trang chủ, SEO, liên hệ và chế độ bảo trì mà không cần sửa code.
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm md:text-base px-4 py-2.5 rounded-[12px] border-2 border-indigo-600 shadow-[0_2px_3px_0_rgba(0,0,0,0.25)] [&_svg]:text-white"
        >
          <Save className="w-4 h-4 text-white" />
          {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
        </Button>
      </div>

      {/* Tabs Navigation Bar (Image 2 style) */}
      <div className="bg-slate-100/90 p-1.5 rounded-[16px] border-2 border-slate-200/80 inline-flex flex-wrap items-center gap-1.5 w-full">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-[12px] transition-all whitespace-nowrap text-sm md:text-base font-bold ${
                isActive
                  ? 'bg-white text-indigo-600 border-2 border-white shadow-[0_2px_3px_0_rgba(0,0,0,0.25)]'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 border-2 border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 1: BRANDING & COLORS */}
        {activeTab === 'branding' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <Card className="p-6 bg-white border-2 border-slate-200 shadow-none rounded-[12px] space-y-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-indigo-600" /> Nhận diện Thương hiệu & Logo
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">Tên Cửa hàng (Shop Name)</label>
                    <Input
                      value={settings.shopName}
                      onChange={(e) => setSettings(prev => ({ ...prev, shopName: e.target.value }))}
                      className="text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">Khẩu hiệu / Slogan</label>
                    <Input
                      value={settings.tagline || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, tagline: e.target.value }))}
                      placeholder="VD: Nền tảng Portfolio AI Studio..."
                      className="text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                    />
                  </div>
                </div>

                {/* Logo Customizer: Upload (File/SVG) or URL + Alignment Controls */}
                <div className="p-4 bg-slate-50/80 rounded-[12px] border-2 border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="block text-[12px] font-bold text-slate-800 uppercase tracking-wider">
                        Logo Cửa Hàng (Ảnh PNG, JPG, WebP hoặc Vector SVG)
                      </label>
                      <p className="text-[12px] text-slate-500">Tải tệp từ thiết bị, chọn từ Storage hoặc dán URL trực tiếp.</p>
                    </div>
                  </div>

                  {/* Upload Actions & URL Input */}
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-sm transition-all">
                        <ImageIcon className="w-4 h-4 text-white" />
                        <span>Tải tệp từ Thiết Bị (Ảnh / SVG)</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              toast.info('Đang xử lý tệp logo...');
                              if (file.type === 'image/svg+xml') {
                                const reader = new FileReader();
                                reader.onload = async (evt) => {
                                  const content = evt.target?.result as string;
                                  setSettings(prev => ({ ...prev, logo: content }));
                                  toast.success('Đã tải lên tệp Vector SVG!');
                                };
                                reader.readAsDataURL(file);
                              } else {
                                const uploadRes = await api.storage.upload({
                                  name: `Logo - ${settings.shopName || 'Portio'}`,
                                  category: 'cover',
                                  dataUrl: await new Promise<string>((resolve) => {
                                    const reader = new FileReader();
                                    reader.onload = (evt) => resolve(evt.target?.result as string);
                                    reader.readAsDataURL(file);
                                  }),
                                  mimeType: file.type,
                                  originalSize: file.size,
                                  compressedSize: file.size,
                                  savedBytes: 0,
                                  reductionPercentage: 0,
                                  uploadedBy: 'admin'
                                });
                                setSettings(prev => ({ ...prev, logo: uploadRes.url }));
                                toast.success('Đã tải logo lên Cloudflare R2 Storage!');
                              }
                            } catch (err: any) {
                              toast.error(err.message || 'Lỗi khi tải logo');
                            }
                          }}
                        />
                      </label>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setMediaPickerField('logo')}
                        className="gap-1.5 whitespace-nowrap text-xs sm:text-sm font-bold text-indigo-600 rounded-[12px] border-2 border-indigo-600 bg-white hover:bg-indigo-50 shadow-none [&_svg]:text-indigo-600"
                      >
                        <ImageIcon className="w-4 h-4 text-indigo-600" /> Chọn từ Storage
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        value={settings.logo}
                        onChange={(e) => setSettings(prev => ({ ...prev, logo: e.target.value }))}
                        placeholder="Hoặc dán URL logo (https://...)"
                        className="text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                      />
                    </div>
                  </div>

                  {/* Logo Alignment & Display Controls */}
                  <div className="pt-3 border-t border-slate-200 grid sm:grid-cols-3 gap-3.5">
                    {/* Căn chỉnh vị trí (Position) */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Căn chỉnh vị trí (Position)
                      </label>
                      <select
                        value={settings.logoStyle?.position || 'center'}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          logoStyle: { ...prev.logoStyle, position: e.target.value as any }
                        }))}
                        className="w-full p-2 bg-white border-2 border-slate-200 rounded-[10px] text-xs font-bold text-slate-800 outline-none focus:border-indigo-600"
                      >
                        <option value="center">Giữa (Center)</option>
                        <option value="left">Căn Trái (Left)</option>
                        <option value="right">Căn Phải (Right)</option>
                        <option value="top">Căn Trên (Top)</option>
                        <option value="bottom">Căn Dưới (Bottom)</option>
                      </select>
                    </div>

                    {/* Cách co giãn (Object Fit) */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Hiển thị ảnh (Object Fit)
                      </label>
                      <select
                        value={settings.logoStyle?.fit || 'contain'}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          logoStyle: { ...prev.logoStyle, fit: e.target.value as any }
                        }))}
                        className="w-full p-2 bg-white border-2 border-slate-200 rounded-[10px] text-xs font-bold text-slate-800 outline-none focus:border-indigo-600"
                      >
                        <option value="contain">Vừa khung (Contain - Giữ tỷ lệ)</option>
                        <option value="cover">Phủ đầy (Cover - Cắt tràn viền)</option>
                        <option value="fill">Lấp đầy (Fill - Kéo dãn)</option>
                      </select>
                    </div>

                    {/* Chiều cao logo (Height) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-slate-600 uppercase">
                          Kích thước Logo
                        </label>
                        <span className="text-[11px] font-mono font-bold text-indigo-600">
                          {settings.logoStyle?.height || 36}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="80"
                        step="2"
                        value={settings.logoStyle?.height || 36}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          logoStyle: { ...prev.logoStyle, height: Number(e.target.value) }
                        }))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Live Header & Component Preview Sandbox */}
                  <div className="pt-3 border-t border-slate-200 space-y-3">
                    <span className="text-[12px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-indigo-600" />
                      Khung mô phỏng hiển thị thực tế trên Header & các vị trí
                    </span>

                    {/* 1. Header Bar Simulation */}
                    <div className="p-3.5 bg-white border-2 border-slate-200 rounded-[12px] shadow-xs space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                        <span>1. THANH HEADER CHÍNH (MAIN NAVBAR)</span>
                        <span className="text-indigo-600 font-mono">So sánh tỉ lệ với Tên App</span>
                      </div>
                      
                      <div className="h-16 px-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between overflow-hidden">
                        <div className="flex items-center gap-3">
                          <div 
                            className="flex items-center rounded-xl bg-white border border-slate-200 p-0.5 overflow-hidden transition-all shadow-xs"
                            style={{
                              height: `${settings.logoStyle?.height || 36}px`,
                              minWidth: `${settings.logoStyle?.height || 36}px`,
                              justifyContent: settings.logoStyle?.position === 'left' ? 'flex-start' : settings.logoStyle?.position === 'right' ? 'flex-end' : 'center',
                              alignItems: settings.logoStyle?.position === 'top' ? 'flex-start' : settings.logoStyle?.position === 'bottom' ? 'flex-end' : 'center',
                            }}
                          >
                            <img 
                              src={settings.logo} 
                              alt="Logo Header Preview" 
                              style={{
                                height: `${settings.logoStyle?.height || 36}px`,
                                objectFit: settings.logoStyle?.fit || 'contain',
                                objectPosition: settings.logoStyle?.position || 'center'
                              }}
                              className="max-h-full max-w-full"
                              onError={(e: any) => { e.target.src = 'https://via.placeholder.com/36'; }}
                            />
                          </div>
                          <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-slate-900 truncate">
                            {settings.shopName || 'Portio — AI Studio Portfolio Shop'}
                          </span>
                        </div>

                        <div className="hidden sm:flex items-center gap-3 text-xs font-bold text-slate-500">
                          <span className="text-indigo-600 font-extrabold">Trang chủ</span>
                          <span>Shop giao diện</span>
                          <span className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs">Đăng nhập</span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Dark Sidebar Simulation */}
                    <div className="p-3.5 bg-slate-900 border-2 border-slate-800 rounded-[12px] shadow-xs space-y-2 text-white">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                        <span>2. MENU QUẢN TRỊ ADMIN (DARK SIDEBAR)</span>
                        <span className="text-emerald-400 font-mono">Chế độ tối (Dark Mode)</span>
                      </div>
                      
                      <div className="h-14 px-4 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center gap-3 overflow-hidden">
                        <div 
                          className="flex items-center rounded-xl bg-white/10 p-0.5 overflow-hidden transition-all"
                          style={{
                            height: `${Math.min(settings.logoStyle?.height || 36, 40)}px`,
                            minWidth: `${Math.min(settings.logoStyle?.height || 36, 40)}px`,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <img 
                            src={settings.logo} 
                            alt="Admin Logo Preview" 
                            style={{
                              height: `${Math.min(settings.logoStyle?.height || 36, 40)}px`,
                              objectFit: settings.logoStyle?.fit || 'contain',
                            }}
                            className="max-h-full max-w-full"
                            onError={(e: any) => { e.target.src = 'https://via.placeholder.com/32'; }}
                          />
                        </div>
                        <span className="font-extrabold text-base text-white truncate">
                          {settings.shopName || 'Portio Admin'}
                        </span>
                      </div>
                    </div>

                    {/* 3. Footer Simulation */}
                    <div className="p-3.5 bg-slate-100 border-2 border-slate-200 rounded-[12px] shadow-xs space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                        <span>3. CHÂN TRANG (FOOTER)</span>
                        <span className="text-slate-500 font-mono">Cuối trang web</span>
                      </div>
                      
                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-3 overflow-hidden">
                        <div 
                          className="flex items-center rounded-lg bg-slate-50 border border-slate-100 p-0.5 overflow-hidden transition-all"
                          style={{
                            height: '32px',
                            minWidth: '32px',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <img 
                            src={settings.logo} 
                            alt="Footer Logo Preview" 
                            style={{
                              height: '32px',
                              objectFit: settings.logoStyle?.fit || 'contain',
                            }}
                            className="max-h-full max-w-full"
                            onError={(e: any) => { e.target.src = 'https://via.placeholder.com/32'; }}
                          />
                        </div>
                        <div>
                          <span className="font-extrabold text-base text-slate-900 block leading-tight">
                            {settings.shopName}
                          </span>
                          <span className="text-xs text-slate-500 block">
                            {settings.tagline || 'Khởi tạo Portfolio chuẩn quốc tế'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Favicon URL & Picker */}
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">Favicon URL (Icon Tab Trình Duyệt)</label>
                  <div className="flex gap-2.5">
                    <Input
                      value={settings.favicon}
                      onChange={(e) => setSettings(prev => ({ ...prev, favicon: e.target.value }))}
                      placeholder="https://..."
                      className="text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setMediaPickerField('favicon')}
                      className="gap-1.5 whitespace-nowrap text-sm md:text-base font-bold text-indigo-600 rounded-[12px] border-2 border-indigo-600 bg-white hover:bg-indigo-50 shadow-none [&_svg]:text-indigo-600"
                    >
                      <ImageIcon className="w-4 h-4 text-indigo-600" /> Chọn từ Storage
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Brand Colors */}
              <Card className="p-6 bg-white border-2 border-slate-200 shadow-none rounded-[12px] space-y-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-indigo-600" /> Bảng Màu Thương Hiệu (Brand Colors)
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">Màu Chủ Đạo (Primary Color)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.brandColors.primary}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          brandColors: { ...prev.brandColors, primary: e.target.value }
                        }))}
                        className="w-10 h-10 rounded-[12px] border-2 border-slate-200 cursor-pointer p-0.5"
                      />
                      <Input
                        value={settings.brandColors.primary}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          brandColors: { ...prev.brandColors, primary: e.target.value }
                        }))}
                        className="font-mono uppercase text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">Màu Nhấn (Accent Color)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.brandColors.accent}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          brandColors: { ...prev.brandColors, accent: e.target.value }
                        }))}
                        className="w-10 h-10 rounded-[12px] border-2 border-slate-200 cursor-pointer p-0.5"
                      />
                      <Input
                        value={settings.brandColors.accent}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          brandColors: { ...prev.brandColors, accent: e.target.value }
                        }))}
                        className="font-mono uppercase text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">Màu Nền (Background Neutral)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.brandColors.background}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          brandColors: { ...prev.brandColors, background: e.target.value }
                        }))}
                        className="w-10 h-10 rounded-[12px] border-2 border-slate-200 cursor-pointer p-0.5"
                      />
                      <Input
                        value={settings.brandColors.background}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          brandColors: { ...prev.brandColors, background: e.target.value }
                        }))}
                        className="font-mono uppercase text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">Màu Chữ Chính (Text Color)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.brandColors.text}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          brandColors: { ...prev.brandColors, text: e.target.value }
                        }))}
                        className="w-10 h-10 rounded-[12px] border-2 border-slate-200 cursor-pointer p-0.5"
                      />
                      <Input
                        value={settings.brandColors.text}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          brandColors: { ...prev.brandColors, text: e.target.value }
                        }))}
                        className="font-mono uppercase text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Live Visual Preview Card */}
            <div className="lg:col-span-4 space-y-4">
              <Card className="p-5 bg-white border-2 border-slate-200 shadow-none rounded-[12px] space-y-3">
                <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">Xem trước Nhận diện (Preview)</span>
                <div 
                  className="p-5 rounded-[12px] border-2 border-slate-200 space-y-4 transition-all"
                  style={{ backgroundColor: settings.brandColors.background, color: settings.brandColors.text }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="overflow-hidden flex items-center border-2 border-slate-200 rounded-[12px] bg-white"
                      style={{
                        height: `${settings.logoStyle?.height || 36}px`,
                        minWidth: `${settings.logoStyle?.height || 36}px`,
                        justifyContent: settings.logoStyle?.position === 'left' ? 'flex-start' : settings.logoStyle?.position === 'right' ? 'flex-end' : 'center',
                        alignItems: settings.logoStyle?.position === 'top' ? 'flex-start' : settings.logoStyle?.position === 'bottom' ? 'flex-end' : 'center',
                      }}
                    >
                      <img 
                        src={settings.logo} 
                        alt="Logo Preview" 
                        style={{
                          height: `${settings.logoStyle?.height || 36}px`,
                          objectFit: settings.logoStyle?.fit || 'contain',
                          objectPosition: settings.logoStyle?.position || 'center'
                        }}
                        className="max-h-full max-w-full"
                        onError={(e: any) => { e.target.src = 'https://via.placeholder.com/40'; }}
                      />
                    </div>
                    <div>
                      <p className="font-extrabold text-base leading-tight">{settings.shopName}</p>
                      <p className="text-sm opacity-70 truncate max-w-[170px]">{settings.tagline}</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      style={{ backgroundColor: settings.brandColors.primary }}
                      className="w-full py-2.5 rounded-[12px] text-white text-sm md:text-base font-bold shadow-[0_2px_3px_0_rgba(0,0,0,0.25)] hover:opacity-90 transition-opacity"
                    >
                      Nút Thử Nghiệm Primary
                    </button>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-[12px] border-2 border-slate-200 text-sm space-y-1.5 text-slate-600">
                  <p className="font-bold text-slate-800">Favicon xem trước:</p>
                  <div className="flex items-center gap-2">
                    <img src={settings.favicon} alt="Favicon" className="w-5 h-5 rounded-md object-cover border border-slate-300" />
                    <span className="text-sm text-slate-500 truncate">{settings.favicon}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: HOMEPAGE, HERO & CTA */}
        {activeTab === 'homepage' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <Card className="p-6 bg-white border-2 border-slate-200 shadow-none rounded-[12px] space-y-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <LayoutTemplate className="w-4 h-4 text-indigo-600" /> Nội dung Phần Hero Trang Chủ
                </h2>

                <div>
                  <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">Hero Badge Nhỏ</label>
                  <Input
                    value={settings.homepage.heroBadge}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      homepage: { ...prev.homepage, heroBadge: e.target.value }
                    }))}
                    placeholder="VD: Hạ tầng Edge Mới Nhất..."
                    className="text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">Tiêu đề Hero Chính (Heading)</label>
                  <Input
                    value={settings.homepage.heroTitle}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      homepage: { ...prev.homepage, heroTitle: e.target.value }
                    }))}
                    className="text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">Mô tả Hero Phụ (Subtitle)</label>
                  <textarea
                    rows={3}
                    value={settings.homepage.heroSubtitle}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      homepage: { ...prev.homepage, heroSubtitle: e.target.value }
                    }))}
                    className="w-full p-3 bg-white border-2 border-slate-200 rounded-[12px] text-sm md:text-base font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-none"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">Ảnh Minh Họa Hero Banner</label>
                  <div className="flex gap-2.5">
                    <Input
                      value={settings.homepage.heroImage}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        homepage: { ...prev.homepage, heroImage: e.target.value }
                      }))}
                      className="text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setMediaPickerField('heroImage')}
                      className="gap-1.5 whitespace-nowrap text-sm md:text-base font-bold text-indigo-600 rounded-[12px] border-2 border-indigo-600 bg-white hover:bg-indigo-50 shadow-none [&_svg]:text-indigo-600"
                    >
                      <ImageIcon className="w-4 h-4 text-indigo-600" /> Chọn từ Storage
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Call-to-Action (CTA) */}
              <Card className="p-6 bg-white border-2 border-slate-200 shadow-none rounded-[12px] space-y-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-indigo-600" /> Khối Kêu Gọi Hành Động (Call to Action - CTA)
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">Tiêu đề CTA</label>
                    <Input
                      value={settings.homepage.ctaHeading}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        homepage: { ...prev.homepage, ctaHeading: e.target.value }
                      }))}
                      className="text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">Chữ trên Nút CTA</label>
                    <Input
                      value={settings.homepage.ctaButtonText}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        homepage: { ...prev.homepage, ctaButtonText: e.target.value }
                      }))}
                      className="text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">Mô tả phụ CTA</label>
                  <Input
                    value={settings.homepage.ctaSubtitle}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      homepage: { ...prev.homepage, ctaSubtitle: e.target.value }
                    }))}
                    className="text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">Đường dẫn Nút CTA</label>
                  <Input
                    value={settings.homepage.ctaButtonLink}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      homepage: { ...prev.homepage, ctaButtonLink: e.target.value }
                    }))}
                    className="text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                  />
                </div>
              </Card>
            </div>

            {/* Preview Banner */}
            <div className="lg:col-span-4 space-y-4">
              <Card className="p-5 bg-white border-2 border-slate-200 shadow-none rounded-[12px] space-y-3">
                <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">Xem trước Hero Banner</span>
                <div className="aspect-video rounded-[12px] overflow-hidden bg-slate-100 border-2 border-slate-200 relative">
                  <img 
                    src={settings.homepage.heroImage} 
                    alt="Hero" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end text-white">
                    <span className="text-xs font-bold uppercase tracking-wider bg-indigo-600 px-2.5 py-1 rounded-full w-fit mb-1.5">
                      {settings.homepage.heroBadge}
                    </span>
                    <p className="font-extrabold text-base leading-tight line-clamp-2">{settings.homepage.heroTitle}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 3: CONTACT & SOCIAL */}
        {activeTab === 'contact_social' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Information */}
            <Card className="p-6 bg-white border-2 border-slate-200 shadow-none rounded-[12px] space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-600" /> Thông Tin Liên Hệ & Hỗ Trợ
              </h2>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">Email Hỗ Trợ (Support Email)</label>
                <Input
                  type="email"
                  value={settings.contact.email}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    contact: { ...prev.contact, email: e.target.value }
                  }))}
                  className="text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">Số Điện Thoại Hotline</label>
                <Input
                  value={settings.contact.phone}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    contact: { ...prev.contact, phone: e.target.value }
                  }))}
                  className="text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">Địa Chỉ Trụ Sở</label>
                <Input
                  value={settings.contact.address}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    contact: { ...prev.contact, address: e.target.value }
                  }))}
                  className="text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">Giờ Làm Việc</label>
                <Input
                  value={settings.contact.workingHours}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    contact: { ...prev.contact, workingHours: e.target.value }
                  }))}
                  className="text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                />
              </div>
            </Card>

            {/* Social Links */}
            <Card className="p-6 bg-white border-2 border-slate-200 shadow-none rounded-[12px] space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-600" /> Mạng Xã Hội (Social Links)
              </h2>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">Twitter / X URL</label>
                <Input
                  value={settings.socialLinks.twitter || ''}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                  }))}
                  placeholder="https://x.com/..."
                  className="text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">GitHub URL</label>
                <Input
                  value={settings.socialLinks.github || ''}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, github: e.target.value }
                  }))}
                  placeholder="https://github.com/..."
                  className="text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">LinkedIn URL</label>
                <Input
                  value={settings.socialLinks.linkedin || ''}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                  }))}
                  placeholder="https://linkedin.com/..."
                  className="text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">Discord Community</label>
                <Input
                  value={settings.socialLinks.discord || ''}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, discord: e.target.value }
                  }))}
                  placeholder="https://discord.gg/..."
                  className="text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">Facebook Page</label>
                <Input
                  value={settings.socialLinks.facebook || ''}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, facebook: e.target.value }
                  }))}
                  placeholder="https://facebook.com/..."
                  className="text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">YouTube Channel</label>
                <Input
                  value={settings.socialLinks.youtube || ''}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, youtube: e.target.value }
                  }))}
                  placeholder="https://youtube.com/..."
                  className="text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                />
              </div>
            </Card>
          </div>
        )}

        {/* TAB 4: FOOTER */}
        {activeTab === 'footer' && (
          <div className="space-y-6 max-w-4xl">
            <Card className="p-6 bg-white border-2 border-slate-200 shadow-none rounded-[12px] space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" /> Cấu hình Nội dung Chân Trang (Footer)
              </h2>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">Dòng Bản Quyền (Copyright Text)</label>
                <Input
                  value={settings.footer.copyright}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    footer: { ...prev.footer, copyright: e.target.value }
                  }))}
                  className="text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">Giới Thiệu Ngắn (About Portio Text)</label>
                <textarea
                  rows={3}
                  value={settings.footer.aboutText}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    footer: { ...prev.footer, aboutText: e.target.value }
                  }))}
                  className="w-full p-3 bg-white border-2 border-slate-200 rounded-[12px] text-sm md:text-base font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[12px] font-bold text-slate-700 uppercase">Danh sách Liên kết Footer</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addFooterLink}
                    className="text-sm md:text-base font-bold gap-1 text-indigo-600 rounded-[12px] border-2 border-indigo-600 bg-white hover:bg-indigo-50 shadow-none [&_svg]:text-indigo-600"
                  >
                    <Plus className="w-4 h-4 text-indigo-600" /> Thêm liên kết
                  </Button>
                </div>

                <div className="space-y-2">
                  {settings.footer.links.map((link, idx) => (
                    <div key={idx} className="flex items-center gap-2.5">
                      <Input
                        value={link.label}
                        onChange={(e) => {
                          const updated = [...settings.footer.links];
                          updated[idx].label = e.target.value;
                          setSettings(prev => ({ ...prev, footer: { ...prev.footer, links: updated } }));
                        }}
                        placeholder="Tên nhãn (VD: Về chúng tôi)"
                        className="flex-1 text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                      />
                      <Input
                        value={link.url}
                        onChange={(e) => {
                          const updated = [...settings.footer.links];
                          updated[idx].url = e.target.value;
                          setSettings(prev => ({ ...prev, footer: { ...prev.footer, links: updated } }));
                        }}
                        placeholder="/about hoặc https://..."
                        className="flex-1 text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeFooterLink(idx)}
                        className="p-2.5 bg-red-600 text-white rounded-[12px] border-2 border-red-600 shadow-[0_2px_3px_0_rgba(0,0,0,0.25)] hover:bg-red-700 transition [&_svg]:text-white"
                        title="Xóa liên kết"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 5: SEO & SOCIAL CARDS */}
        {activeTab === 'seo_social' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
              <Card className="p-6 bg-white border-2 border-slate-200 shadow-none rounded-[12px] space-y-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Search className="w-4 h-4 text-indigo-600" /> Cấu hình Thẻ Meta SEO Toàn Cửa Hàng
                </h2>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[12px] font-bold text-slate-700 uppercase">Meta Title (Tiêu Đề Trang)</label>
                    <span className="text-sm font-semibold text-slate-500">
                      {settings.seo.metaTitle.length}/60 ký tự
                    </span>
                  </div>
                  <Input
                    value={settings.seo.metaTitle}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      seo: { ...prev.seo, metaTitle: e.target.value }
                    }))}
                    className="text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[12px] font-bold text-slate-700 uppercase">Meta Description (Thẻ Mô Tả)</label>
                    <span className="text-sm font-semibold text-slate-500">
                      {settings.seo.metaDescription.length}/160 ký tự
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={settings.seo.metaDescription}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      seo: { ...prev.seo, metaDescription: e.target.value }
                    }))}
                    className="w-full p-3 bg-white border-2 border-slate-200 rounded-[12px] text-sm md:text-base font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">Keywords (Từ Khóa Cách Nhau Bằng Dấu Phẩy)</label>
                  <Input
                    value={settings.seo.keywords}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      seo: { ...prev.seo, keywords: e.target.value }
                    }))}
                    className="text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">Canonical URL Chuẩn Hóa</label>
                  <Input
                    value={settings.seo.canonicalUrl}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      seo: { ...prev.seo, canonicalUrl: e.target.value }
                    }))}
                    className="text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                  />
                </div>

                {/* Social Sharing OG Image */}
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">OG Image (Ảnh Khi Chia Sẻ Facebook/Twitter)</label>
                  <div className="flex gap-2.5">
                    <Input
                      value={settings.seo.ogImage}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        seo: { ...prev.seo, ogImage: e.target.value }
                      }))}
                      className="text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setMediaPickerField('ogImage')}
                      className="gap-1.5 whitespace-nowrap text-sm md:text-base font-bold text-indigo-600 rounded-[12px] border-2 border-indigo-600 bg-white hover:bg-indigo-50 shadow-none [&_svg]:text-indigo-600"
                    >
                      <ImageIcon className="w-4 h-4 text-indigo-600" /> Chọn từ Storage
                    </Button>
                  </div>
                </div>

                {/* Robots & Sitemap */}
                <div className="pt-3 border-t-2 border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Cho phép công cụ tìm kiếm Index (Robots Indexing)</p>
                      <p className="text-sm text-slate-500">Bật/tắt thẻ meta robots 'index, follow' cho toàn bộ cửa hàng.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.seo.robotsIndexing}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        seo: { ...prev.seo, robotsIndexing: e.target.checked }
                      }))}
                      className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">Tùy biến robots.txt</label>
                    <textarea
                      rows={3}
                      value={settings.seo.robotsCustom || ''}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        seo: { ...prev.seo, robotsCustom: e.target.value }
                      }))}
                      className="w-full p-3 bg-slate-900 text-slate-100 font-mono text-[14px] placeholder:text-[14px] rounded-[12px] border-2 border-slate-800 outline-none shadow-none"
                    />
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <a
                      href="/robots.txt"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] border-2 border-indigo-600 text-sm md:text-base font-bold text-indigo-600 hover:bg-indigo-50 bg-white shadow-none transition-all [&_svg]:text-indigo-600"
                    >
                      <ExternalLink className="w-4 h-4 text-indigo-600" /> Kiểm tra /robots.txt
                    </a>
                    <a
                      href="/sitemap.xml"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] border-2 border-indigo-600 text-sm md:text-base font-bold text-indigo-600 hover:bg-indigo-50 bg-white shadow-none transition-all [&_svg]:text-indigo-600"
                    >
                      <ExternalLink className="w-4 h-4 text-indigo-600" /> Xem XML /sitemap.xml
                    </a>
                  </div>
                </div>
              </Card>
            </div>

            {/* Live Social Sharing Card Preview */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="p-5 bg-white border-2 border-slate-200 shadow-none rounded-[12px] space-y-3">
                <span className="text-sm font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-indigo-600" /> Xem trước Thẻ Chia Sẻ (OG Preview)
                </span>

                <div className="rounded-[12px] border-2 border-slate-200 overflow-hidden bg-slate-50 shadow-none">
                  <div className="aspect-video bg-slate-200 overflow-hidden relative border-b-2 border-slate-200">
                    <img
                      src={settings.seo.ogImage}
                      alt="OG Card"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 bg-white space-y-1.5">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">PORTFOLIO-SHOP.COM</p>
                    <p className="text-base font-bold text-slate-900 leading-snug line-clamp-1">{settings.seo.metaTitle}</p>
                    <p className="text-sm text-slate-500 line-clamp-2">{settings.seo.metaDescription}</p>
                  </div>
                </div>

                {/* Google SERP Simulator */}
                <div className="p-4 bg-white rounded-[12px] border-2 border-slate-200 space-y-1.5 shadow-none">
                  <span className="text-xs font-bold text-slate-500 uppercase">Google SERP Snippet Preview</span>
                  <div className="pt-1">
                    <div className="flex items-center gap-1.5 text-sm text-slate-700">
                      <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-xs">🌐</div>
                      <span className="text-sm text-slate-800 font-medium">portfolio-shop.com</span>
                    </div>
                    <p className="text-blue-700 font-bold text-base hover:underline cursor-pointer mt-0.5">
                      {settings.seo.metaTitle}
                    </p>
                    <p className="text-sm text-slate-600 line-clamp-2 mt-0.5">
                      {settings.seo.metaDescription}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 6: ANALYTICS PLACEHOLDERS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 w-full">
            <Card className="p-6 bg-white border-2 border-slate-200 shadow-none rounded-[12px] space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" /> Mã Đo Lường & Tiếp Thị (Analytics Placeholders)
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                Điền các mã định danh của Google hoặc Facebook để tự động nhúng vào thẻ &lt;head&gt; toàn hệ thống.
              </p>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">Google Analytics 4 ID (GA4)</label>
                <Input
                  value={settings.analytics.googleAnalyticsId || ''}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    analytics: { ...prev.analytics, googleAnalyticsId: e.target.value }
                  }))}
                  placeholder="G-XXXXXXXXXX"
                  className="font-mono text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">Google Tag Manager ID (GTM)</label>
                <Input
                  value={settings.analytics.googleTagManagerId || ''}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    analytics: { ...prev.analytics, googleTagManagerId: e.target.value }
                  }))}
                  placeholder="GTM-XXXXXXX"
                  className="font-mono text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">Facebook Pixel ID</label>
                <Input
                  value={settings.analytics.facebookPixelId || ''}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    analytics: { ...prev.analytics, facebookPixelId: e.target.value }
                  }))}
                  placeholder="FP-XXXXXXXXXX"
                  className="font-mono text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">Custom Head HTML / Script Placeholder</label>
                <textarea
                  rows={4}
                  value={settings.analytics.customHeadScript || ''}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    analytics: { ...prev.analytics, customHeadScript: e.target.value }
                  }))}
                  placeholder="<!-- Thêm mã theo dõi tùy biến tại đây -->"
                  className="w-full p-3 bg-slate-900 text-emerald-400 font-mono text-[14px] placeholder:text-[14px] rounded-[12px] border-2 border-slate-800 outline-none shadow-none"
                />
              </div>
            </Card>
          </div>
        )}

        {/* TAB 7: MAINTENANCE MODE */}
        {activeTab === 'maintenance' && (
          <div className="space-y-6 w-full">
            <Card className="p-6 bg-white border-2 border-slate-200 shadow-none rounded-[12px] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 text-amber-500" /> Kích Hoạt Chế Độ Bảo Trì (Maintenance Mode)
                  </h2>
                  <p className="text-sm text-slate-500 font-medium mt-1">
                    Khi bật, khách vãng lai sẽ thấy màn hình thông báo bảo trì. robots.txt sẽ tự động chặn các bot tìm kiếm.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.maintenance.enabled}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    maintenance: { ...prev.maintenance, enabled: e.target.checked }
                  }))}
                  className="w-6 h-6 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                />
              </div>

              {settings.maintenance.enabled && (
                <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-[12px] text-sm text-amber-800 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertOctagon className="w-4 h-4" /> Hệ thống đang trong trạng thái bảo trì!
                  </p>
                  <p>Mọi lượt truy cập công khai sẽ hiển thị màn hình bảo trì định kỳ.</p>
                </div>
              )}

              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">Tiêu Đề Thông Báo Bảo Trì</label>
                <Input
                  value={settings.maintenance.title}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    maintenance: { ...prev.maintenance, title: e.target.value }
                  }))}
                  className="text-[14px] placeholder:text-[14px] font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1.5">Nội Dung Chi Tiết Thông Báo</label>
                <textarea
                  rows={3}
                  value={settings.maintenance.message}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    maintenance: { ...prev.maintenance, message: e.target.value }
                  }))}
                  className="w-full p-3 bg-white border-2 border-slate-200 rounded-[12px] text-sm md:text-base font-medium text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-sm font-bold text-slate-800">Cho Phép Admin Xem Trước (Admin Bypass)</p>
                  <p className="text-sm text-slate-500">Tài khoản quản trị viên đăng nhập vẫn có thể truy cập cửa hàng bình thường.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.maintenance.allowAdminBypass}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    maintenance: { ...prev.maintenance, allowAdminBypass: e.target.checked }
                  }))}
                  className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            </Card>
          </div>
        )}
      </form>

      {/* Reusable Media Storage Modal Picker */}
      <MediaStorageModal
        isOpen={mediaPickerField !== null}
        onClose={() => setMediaPickerField(null)}
        onSelect={handleMediaSelected}
        initialCategory={
          mediaPickerField === 'heroImage' ? 'cover' :
          mediaPickerField === 'ogImage' ? 'cover' :
          'template_thumbnails'
        }
        title={`Chọn tệp từ Storage cho: ${mediaPickerField?.toUpperCase()}`}
      />
    </div>
  );
}
