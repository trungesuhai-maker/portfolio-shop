import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '@/src/services/api';
import { PortfolioInstance, Template, CustomerPortfolioSeo, StorageCategory } from '@/src/types';
import { Button } from '@/src/components/ui/Button';
import { Loading } from '@/src/components/ui/Loading';
import { Input } from '@/src/components/ui/Input';
import { MediaStorageModal } from '@/src/components/common/MediaStorageModal';
import { 
  Save, 
  Globe, 
  Eye, 
  ArrowLeft, 
  RefreshCw, 
  LayoutTemplate, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Sparkles,
  Link as LinkIcon,
  Search,
  Image as ImageIcon,
  HardDrive,
  Copy,
  Plus,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

type EditorTab = 'content' | 'subdomain' | 'seo' | 'media';

export default function PortfolioEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const [portfolio, setPortfolio] = useState<PortfolioInstance | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  
  // Local state for the dynamic form
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [portfolioName, setPortfolioName] = useState('');

  // Subdomain editing state
  const [subdomainInput, setSubdomainInput] = useState('');
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  const [subdomainCheckResult, setSubdomainCheckResult] = useState<any>(null);
  const [savingSubdomain, setSavingSubdomain] = useState(false);

  // SEO editing state
  const [seoData, setSeoData] = useState<CustomerPortfolioSeo>({
    seoTitle: '',
    seoDescription: '',
    ogImage: '',
    favicon: '',
    canonical: ''
  });
  const [savingSeo, setSavingSeo] = useState(false);

  // Navigation tab
  const [activeSidebarTab, setActiveSidebarTab] = useState<EditorTab>('content');

  // Media Storage Picker Modal
  const [mediaPickerTarget, setMediaPickerTarget] = useState<string | null>(null);
  const [mediaPickerCategory, setMediaPickerCategory] = useState<StorageCategory>('avatar');

  useEffect(() => {
    if (id) {
      api.portfolios.getById(id).then(async (port) => {
        if (port) {
          setPortfolio(port);
          setPortfolioName(port.name || '');
          setSubdomainInput(port.subdomain || '');
          setFormData(port.custom_data || {});
          
          // Initial SEO state
          const canonicalUrl = `https://${port.subdomain}.portfolio-shop.com`;
          setSeoData({
            seoTitle: port.seo?.seoTitle || `${port.name} — Official Portfolio`,
            seoDescription: port.seo?.seoDescription || `Trang Portfolio cá nhân chính thức của ${port.name} được lưu trữ trên Cloudflare Edge.`,
            ogImage: port.seo?.ogImage || 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&h=630&fit=crop',
            favicon: port.seo?.favicon || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=64&h=64&fit=crop',
            canonical: port.seo?.canonical || canonicalUrl
          });

          // Fetch associated template
          const { MOCK_TEMPLATES } = await import('@/src/services/mockData');
          const foundTpl = MOCK_TEMPLATES.find(t => t.id === port.template_id);
          
          if (foundTpl) {
            setTemplate(foundTpl);
            if (!port.custom_data || Object.keys(port.custom_data).length === 0) {
              setFormData(foundTpl.defaultData || {});
            }
          }
        }
        setLoading(false);
      });
    }
  }, [id]);

  // Handle Hydration (Sending data to iframe)
  const syncWithIframe = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'HYDRATE_PORTFOLIO_DATA',
        payload: formData
      }, '*');
      toast.success('Đã đồng bộ giao diện xem trước');
    }
  };

  const handleFieldChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    if (!portfolio) return;
    setSaving(true);
    try {
      const updated = await api.portfolios.update(portfolio.id, {
        name: portfolioName,
        custom_data: formData,
        seo: seoData
      });
      setPortfolio(updated);
      toast.success('Đã lưu nội dung Portfolio và SEO thành công');
      syncWithIframe();
    } catch (e: any) {
      toast.error(e.message || 'Lỗi khi lưu Portfolio');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSeo = async () => {
    if (!portfolio) return;
    setSavingSeo(true);
    try {
      const updatedSeo = await api.portfolios.updateSeo(portfolio.id, seoData);
      setSeoData(updatedSeo);
      setPortfolio(prev => prev ? { ...prev, seo: updatedSeo } : null);
      toast.success('Đã cập nhật cấu hình SEO cho Portfolio');
    } catch (e: any) {
      toast.error(e.message || 'Lỗi khi cập nhật SEO');
    } finally {
      setSavingSeo(false);
    }
  };

  const handlePublish = async () => {
    if (!portfolio) return;
    setPublishing(true);
    try {
      const newStatus = portfolio.status === 'published' ? 'draft' : 'published';
      const updated = await api.portfolios.publish(portfolio.id, newStatus);
      setPortfolio(updated);
      if (newStatus === 'published') {
        toast.success(`Đã xuất bản Portfolio tại https://${updated.subdomain}.portfolio-shop.com!`);
      } else {
        toast.info('Đã chuyển Portfolio về Bản nháp (Draft)');
      }
    } catch (e: any) {
      toast.error(e.message || 'Không thể thay đổi trạng thái xuất bản');
    } finally {
      setPublishing(false);
    }
  };

  const handleApplySubdomain = async () => {
    if (!portfolio || !subdomainInput) return;
    setSavingSubdomain(true);
    try {
      const res = await api.subdomains.updateSubdomain(portfolio.id, subdomainInput);
      setPortfolio(res.portfolio);
      setSubdomainInput(res.portfolio.subdomain);
      const newCanonical = `https://${res.portfolio.subdomain}.portfolio-shop.com`;
      setSeoData(prev => ({ ...prev, canonical: newCanonical }));
      setSubdomainCheckResult({
        available: true,
        reason: `Subdomain của bạn hiện là: ${res.fullDomain}`
      });
      toast.success(`Đã cập nhật tên miền thành: ${res.fullDomain}`);
    } catch (err: any) {
      toast.error(err.error || 'Slug này đã tồn tại');
      if (err.suggestions) {
        setSubdomainCheckResult({
          available: false,
          reason: err.error,
          suggestions: err.suggestions
        });
      }
    } finally {
      setSavingSubdomain(false);
    }
  };

  const handleMediaPickerSelect = (url: string) => {
    if (!mediaPickerTarget) return;

    if (mediaPickerTarget === 'seo_ogImage') {
      setSeoData(prev => ({ ...prev, ogImage: url }));
    } else if (mediaPickerTarget === 'seo_favicon') {
      setSeoData(prev => ({ ...prev, favicon: url }));
    } else {
      // Dynamic form field key
      handleFieldChange(mediaPickerTarget, url);
    }

    setMediaPickerTarget(null);
    toast.success('Đã chọn ảnh từ Storage thành công');
  };

  if (loading) return <div className="pt-32 pb-20 flex justify-center"><Loading /></div>;
  if (!portfolio || !template) return <div className="p-8 text-center">Portfolio hoặc Template không tồn tại.</div>;

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50 overflow-hidden pt-16">
      {/* Editor Top Bar */}
      <div className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard/portfolios')} 
            className="p-2 -ml-2 text-slate-500 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
            title="Quay lại danh sách Portfolios"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-slate-900 flex items-center gap-2">
              {portfolio.name}
            </h1>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className={`w-2 h-2 rounded-full ${portfolio.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              <span>{portfolio.status === 'published' ? 'ĐÃ XUẤT BẢN' : 'BẢN NHÁP'}</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-indigo-600 font-bold">{portfolio.subdomain}.portfolio-shop.com</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link 
            to={`/p/${portfolio.subdomain}`} 
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Xem Trang Công Khai
          </Link>

          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={syncWithIframe}>
            <RefreshCw className="w-3.5 h-3.5" /> Đồng bộ
          </Button>

          <Button variant="secondary" size="sm" className="gap-1.5 text-xs font-bold" onClick={handleSave} disabled={saving}>
            <Save className="w-3.5 h-3.5" /> {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
          </Button>

          <Button 
            variant={portfolio.status === 'published' ? 'outline' : 'primary'} 
            size="sm" 
            className="gap-1.5 text-xs font-bold" 
            onClick={handlePublish} 
            disabled={publishing}
          >
            <Globe className="w-3.5 h-3.5" /> 
            {publishing 
              ? 'Đang xử lý...' 
              : portfolio.status === 'published' 
                ? 'Gỡ Xuất Bản (Về Draft)' 
                : 'Xuất Bản Subdomain'
            }
          </Button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: 4 Tabs */}
        <div className="w-[440px] bg-white border-r border-slate-200 overflow-y-auto shrink-0 flex flex-col">
          
          {/* Tabs header */}
          <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50 shrink-0 text-xs font-bold">
            <button
              onClick={() => setActiveSidebarTab('content')}
              className={`py-3 px-2 border-b-2 flex flex-col items-center gap-1 transition-colors ${
                activeSidebarTab === 'content'
                  ? 'border-indigo-600 text-indigo-600 bg-white shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutTemplate className="w-4 h-4" />
              <span>Nội Dung</span>
            </button>
            <button
              onClick={() => setActiveSidebarTab('subdomain')}
              className={`py-3 px-2 border-b-2 flex flex-col items-center gap-1 transition-colors ${
                activeSidebarTab === 'subdomain'
                  ? 'border-indigo-600 text-indigo-600 bg-white shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Tên Miền</span>
            </button>
            <button
              onClick={() => setActiveSidebarTab('seo')}
              className={`py-3 px-2 border-b-2 flex flex-col items-center gap-1 transition-colors ${
                activeSidebarTab === 'seo'
                  ? 'border-indigo-600 text-indigo-600 bg-white shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>SEO Meta</span>
            </button>
            <button
              onClick={() => setActiveSidebarTab('media')}
              className={`py-3 px-2 border-b-2 flex flex-col items-center gap-1 transition-colors ${
                activeSidebarTab === 'media'
                  ? 'border-indigo-600 text-indigo-600 bg-white shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              <span>Kho Media</span>
            </button>
          </div>
          
          {/* TAB 1: Template Content */}
          {activeSidebarTab === 'content' && (
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="block text-[12px] font-bold uppercase tracking-wider text-slate-700">
                  Tên Portfolio
                </label>
                <Input
                  value={portfolioName}
                  onChange={(e) => setPortfolioName(e.target.value)}
                  placeholder="ví dụ: John Doe Engineering"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                  Các Trường Dữ Liệu ({template.name})
                </h3>

                <div className="space-y-4">
                  {template.editableFields.map((field) => {
                    const isImageField = field.key.toLowerCase().includes('image') || 
                                         field.key.toLowerCase().includes('avatar') || 
                                         field.key.toLowerCase().includes('cover') ||
                                         field.key.toLowerCase().includes('photo');

                    return (
                      <div key={field.key} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-[12px] font-bold text-slate-900">
                            {field.label} {field.isRequired && <span className="text-red-500">*</span>}
                          </label>
                          {isImageField && (
                            <button
                              type="button"
                              onClick={() => {
                                setMediaPickerTarget(field.key);
                                setMediaPickerCategory(
                                  field.key.includes('avatar') ? 'avatar' :
                                  field.key.includes('cover') ? 'cover' :
                                  'customer_portfolio'
                                );
                              }}
                              className="text-[11px] text-indigo-600 hover:underline font-bold flex items-center gap-1"
                            >
                              <ImageIcon className="w-3.5 h-3.5" /> Chọn từ Storage
                            </button>
                          )}
                        </div>

                        {field.description && (
                          <p className="text-[11px] text-slate-400">{field.description}</p>
                        )}
                        
                        {field.type === 'text' ? (
                          <textarea 
                            className="w-full rounded-xl border border-slate-200 shadow-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-[14px] placeholder:text-[14px] resize-none h-24 p-3 font-sans"
                            value={formData[field.key] || ''}
                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          />
                        ) : (
                          <Input 
                            type="text" 
                            value={formData[field.key] || ''}
                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                            className="text-[14px] placeholder:text-[14px]"
                          />
                        )}
                      </div>
                    );
                  })}

                  <div className="space-y-1.5">
                    <label className="block text-[12px] font-bold text-slate-900">
                      Giới thiệu ngắn (About Bio)
                    </label>
                    <textarea 
                      className="w-full rounded-xl border border-slate-200 shadow-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-[14px] placeholder:text-[14px] resize-none h-20 p-3 font-sans"
                      value={formData['about_bio'] || ''}
                      onChange={(e) => handleFieldChange('about_bio', e.target.value)}
                      placeholder="Mô tả tóm tắt kinh nghiệm và kỹ năng nổi bật..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Subdomain Configuration */}
          {activeSidebarTab === 'subdomain' && (
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Cấu Hình Subdomain Cá Nhân</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Được cấp phát trên hệ thống wildcard <code>*.portfolio-shop.com</code> qua Cloudflare Worker.
                </p>
              </div>

              {/* Subdomain Input Form */}
              <div className="space-y-3">
                <label className="block text-[12px] font-bold text-slate-700 uppercase">
                  Tên miền phụ (Slug) *
                </label>

                <div className="flex items-center rounded-xl border border-slate-300 focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600 bg-white overflow-hidden shadow-xs">
                  <span className="pl-3 text-xs text-slate-400 font-mono select-none">https://</span>
                  <input
                    type="text"
                    value={subdomainInput}
                    onChange={(e) => {
                      setSubdomainInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                      setSubdomainCheckResult(null);
                    }}
                    placeholder="john"
                    className="flex-1 py-2 px-1 text-xs font-mono font-bold text-slate-900 focus:outline-none"
                  />
                  <span className="pr-3 text-xs text-slate-400 font-mono select-none">.portfolio-shop.com</span>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleApplySubdomain}
                    disabled={savingSubdomain || subdomainInput === portfolio.subdomain}
                    className="text-xs font-bold"
                  >
                    {savingSubdomain ? 'Đang cập nhật...' : 'Cập nhật Subdomain'}
                  </Button>
                </div>
              </div>

              {subdomainCheckResult && (
                <div className={`p-4 rounded-xl border text-xs ${
                  subdomainCheckResult.available 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <p className="font-bold flex items-center gap-1.5">
                    {subdomainCheckResult.available ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {subdomainCheckResult.reason}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SEO Configuration */}
          {activeSidebarTab === 'seo' && (
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">SEO Riêng Cho Portfolio</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tùy chỉnh thẻ meta, OG social share và favicon cho trang cá nhân của bạn.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleSaveSeo}
                  disabled={savingSeo}
                  className="gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                >
                  <Save className="w-3.5 h-3.5" /> {savingSeo ? 'Đang lưu...' : 'Lưu SEO'}
                </Button>
              </div>

              <div className="space-y-4">
                {/* SEO Title */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[12px] font-bold text-slate-700 uppercase">SEO Title</label>
                    <span className="text-[10px] text-slate-400">{(seoData.seoTitle || '').length}/60</span>
                  </div>
                  <Input
                    value={seoData.seoTitle || ''}
                    onChange={(e) => setSeoData(prev => ({ ...prev, seoTitle: e.target.value }))}
                    placeholder="VD: Nguyễn Văn A — Senior Fullstack Architect"
                    className="text-[14px] placeholder:text-[14px]"
                  />
                </div>

                {/* SEO Description */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[12px] font-bold text-slate-700 uppercase">SEO Description</label>
                    <span className="text-[10px] text-slate-400">{(seoData.seoDescription || '').length}/160</span>
                  </div>
                  <textarea
                    rows={3}
                    value={seoData.seoDescription || ''}
                    onChange={(e) => setSeoData(prev => ({ ...prev, seoDescription: e.target.value }))}
                    placeholder="Mô tả kỹ năng, dự án tiêu biểu và thông tin liên hệ..."
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-[14px] placeholder:text-[14px] font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* OG Image */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[12px] font-bold text-slate-700 uppercase">OG Image (Ảnh Chia Sẻ Mạng Xã Hội)</label>
                    <button
                      type="button"
                      onClick={() => {
                        setMediaPickerTarget('seo_ogImage');
                        setMediaPickerCategory('cover');
                      }}
                      className="text-[11px] text-indigo-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <ImageIcon className="w-3.5 h-3.5" /> Chọn từ Storage
                    </button>
                  </div>
                  <Input
                    value={seoData.ogImage}
                    onChange={(e) => setSeoData(prev => ({ ...prev, ogImage: e.target.value }))}
                    placeholder="https://..."
                    className="text-[14px] placeholder:text-[14px]"
                  />
                  {seoData.ogImage && (
                    <div className="mt-2 aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                      <img src={seoData.ogImage} alt="OG" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Favicon */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[12px] font-bold text-slate-700 uppercase">Favicon Cá Nhân (Icon Tab)</label>
                    <button
                      type="button"
                      onClick={() => {
                        setMediaPickerTarget('seo_favicon');
                        setMediaPickerCategory('avatar');
                      }}
                      className="text-[11px] text-indigo-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <ImageIcon className="w-3.5 h-3.5" /> Chọn từ Storage
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={seoData.favicon}
                      onChange={(e) => setSeoData(prev => ({ ...prev, favicon: e.target.value }))}
                      placeholder="https://..."
                      className="text-[14px] placeholder:text-[14px] flex-1"
                    />
                    {seoData.favicon && (
                      <img src={seoData.favicon} alt="Favicon" className="w-8 h-8 rounded-lg object-cover border border-slate-200" />
                    )}
                  </div>
                </div>

                {/* Canonical */}
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 uppercase mb-1">Canonical URL</label>
                  <Input
                    value={seoData.canonical}
                    onChange={(e) => setSeoData(prev => ({ ...prev, canonical: e.target.value }))}
                    className="text-[14px] placeholder:text-[14px]"
                  />
                </div>

                {/* Live SERP Preview */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Xem trước Google SERP</span>
                  <div className="mt-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                    <p className="text-[11px] font-mono text-emerald-700">{seoData.canonical}</p>
                    <p className="text-xs font-semibold text-blue-700 leading-snug line-clamp-1">{seoData.seoTitle || portfolio.name}</p>
                    <p className="text-[11px] text-slate-600 line-clamp-2">{seoData.seoDescription || 'Chưa có mô tả SEO'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Storage & Media */}
          {activeSidebarTab === 'media' && (
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Kho Lưu Trữ Media Cá Nhân</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Quản lý hình ảnh Avatar, Cover, Portfolio Screenshots & Dự án.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setMediaPickerTarget('media_general');
                    setMediaPickerCategory('avatar');
                  }}
                  className="text-xs font-bold bg-indigo-600 text-white"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Mở Storage
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div 
                  onClick={() => {
                    setMediaPickerTarget('avatar');
                    setMediaPickerCategory('avatar');
                  }}
                  className="p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/20 cursor-pointer transition-all flex flex-col items-center text-center space-y-1"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    👤
                  </div>
                  <span className="text-xs font-bold text-slate-800">Ảnh Avatar</span>
                  <span className="text-[10px] text-slate-400">Chân dung cá nhân</span>
                </div>

                <div 
                  onClick={() => {
                    setMediaPickerTarget('cover');
                    setMediaPickerCategory('cover');
                  }}
                  className="p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/20 cursor-pointer transition-all flex flex-col items-center text-center space-y-1"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    🖼️
                  </div>
                  <span className="text-xs font-bold text-slate-800">Ảnh Cover / Banner</span>
                  <span className="text-[10px] text-slate-400">Khổ rộng 16:9</span>
                </div>

                <div 
                  onClick={() => {
                    setMediaPickerTarget('project_image');
                    setMediaPickerCategory('project_images');
                  }}
                  className="p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/20 cursor-pointer transition-all flex flex-col items-center text-center space-y-1"
                >
                  <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold">
                    📦
                  </div>
                  <span className="text-xs font-bold text-slate-800">Project Images</span>
                  <span className="text-[10px] text-slate-400">Ảnh dự án & Case study</span>
                </div>

                <div 
                  onClick={() => {
                    setMediaPickerTarget('customer_portfolio');
                    setMediaPickerCategory('customer_portfolio');
                  }}
                  className="p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/20 cursor-pointer transition-all flex flex-col items-center text-center space-y-1"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    💻
                  </div>
                  <span className="text-xs font-bold text-slate-800">Portfolio Shots</span>
                  <span className="text-[10px] text-slate-400">Ảnh toàn cảnh trang</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Panel: Live Preview Canvas */}
        <div className="flex-1 bg-slate-100/50 p-4 sm:p-8 flex flex-col items-center justify-center relative">
          
          {/* Browser Chrome for Preview */}
          <div className="w-full max-w-5xl h-full bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="h-12 bg-slate-100 border-b border-slate-200 flex items-center px-4 gap-4 shrink-0">
               <div className="flex gap-1.5">
                 <div className="w-3 h-3 rounded-full bg-red-400"></div>
                 <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                 <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
               </div>
               <div className="flex-1 max-w-md mx-auto h-7 bg-white rounded-md border border-slate-200 flex items-center justify-center text-xs font-mono text-slate-600 truncate px-4">
                 https://{portfolio.subdomain}.portfolio-shop.com
               </div>
               <div className="text-[11px] text-slate-400 font-medium">
                 {portfolio.status === 'published' ? 'Live on Edge' : 'Draft Preview'}
               </div>
            </div>
            
            <div className="flex-1 relative bg-slate-950 text-white overflow-y-auto">
               <div className="max-w-3xl mx-auto py-20 px-8 text-center space-y-6">
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1 rounded-full">
                    {template.name} • {portfolio.subdomain}.portfolio-shop.com
                  </div>

                  <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-white">
                    {formData['hero_title'] || portfolioName || 'Tiêu Đề Portfolio'}
                  </h1>

                  <p className="text-lg sm:text-xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
                    {formData['hero_subtitle'] || 'Chào mừng bạn đến với Portfolio của tôi'}
                  </p>

                  {formData['about_bio'] && (
                    <div className="pt-4 max-w-xl mx-auto text-sm text-slate-300 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                      {formData['about_bio']}
                    </div>
                  )}

                  <div className="pt-6 flex justify-center gap-3">
                    <button className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/30">
                      Liên hệ Hợp tác
                    </button>
                    <button className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-semibold text-xs">
                      Xem Dự án
                    </button>
                  </div>
               </div>
            </div>
          </div>

        </div>
      </div>

      {/* Media Storage Modal Picker */}
      <MediaStorageModal
        isOpen={mediaPickerTarget !== null}
        onClose={() => setMediaPickerTarget(null)}
        onSelect={handleMediaPickerSelect}
        initialCategory={mediaPickerCategory}
        title={`Chọn tệp từ Storage: ${mediaPickerTarget?.toUpperCase()}`}
        allowedCategories={[
          'customer_portfolio',
          'avatar',
          'cover',
          'project_images',
          'template_thumbnails',
          'template_gallery'
        ]}
      />
    </div>
  );
}
