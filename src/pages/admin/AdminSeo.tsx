import { useState, useEffect } from 'react';
import { api } from '@/src/services/api';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Loading } from '@/src/components/ui/Loading';
import { MediaStorageModal } from '@/src/components/common/MediaStorageModal';
import { 
  Search, 
  Save, 
  Globe, 
  Share2, 
  Image as ImageIcon,
  ExternalLink,
  FileText,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSeo() {
  const [seo, setSeo] = useState({
    metaTitle: 'Portio — Chợ Portfolio Templates Đẳng Cấp cho Creators & Developers',
    metaDescription: 'Khám phá và khởi tạo portfolio đỉnh cao trong 60 giây với Cloudflare Edge Subdomains và AI Studio Integration. Tối ưu SEO, thiết kế đáp ứng và chuẩn quốc tế.',
    keywords: 'portfolio templates, ai studio portfolio, developer cv, designer website, edge portfolios, resume builder',
    ogImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&h=630&fit=crop',
    canonicalUrl: 'https://portfolio-shop.com',
    robotsIndexing: true,
    robotsCustom: 'User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: https://portfolio-shop.com/sitemap.xml',
    sitemapEnabled: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await api.admin.getSeo();
        if (data) {
          setSeo(prev => ({
            ...prev,
            ...data,
            metaTitle: data.metaTitle || data.siteTitle || prev.metaTitle
          }));
        }
      } catch (e) {
        // use defaults
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
      await api.admin.updateSeo(seo);
      toast.success('Đã lưu cấu hình SEO toàn cửa hàng thành công');
    } catch (e) {
      toast.error('Không thể lưu cấu hình SEO');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400">
        <Loading size={32} />
        <p className="text-xs font-medium mt-3">Đang đồng bộ cấu hình SEO...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Search className="w-7 h-7 text-indigo-600" />
            SEO & OpenGraph Social Sharing
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Tối ưu hóa chỉ mục công cụ tìm kiếm Google, xem trước thẻ OpenGraph và xuất bản sơ đồ trang web sitemap.xml.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/robots.txt"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-[12px] border-2 border-indigo-600 text-sm md:text-base font-bold text-indigo-600 hover:bg-indigo-50 bg-white shadow-none transition-all [&_svg]:text-indigo-600"
          >
            <FileText className="w-4 h-4 text-indigo-600" /> /robots.txt
          </a>
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-[12px] border-2 border-indigo-600 text-sm md:text-base font-bold text-indigo-600 hover:bg-indigo-50 bg-white shadow-none transition-all [&_svg]:text-indigo-600"
          >
            <Globe className="w-4 h-4 text-indigo-600" /> /sitemap.xml
          </a>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm md:text-base font-bold px-4 py-2.5 rounded-[12px] border-2 border-indigo-600 shadow-[0_2px_3px_0_rgba(0,0,0,0.25)] [&_svg]:text-white"
          >
            <Save className="w-4 h-4 text-white" />
            {saving ? 'Đang lưu...' : 'Lưu Cài Đặt SEO'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-6">
          <Card className="p-6 bg-white border-2 border-slate-200 shadow-none rounded-[12px] space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-600" /> Thẻ Meta Tìm Kiếm (Search Meta Tags)
            </h2>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-bold text-slate-700 uppercase">Meta Title (Tiêu Đề Trang)</label>
                <span className={`text-sm font-semibold ${seo.metaTitle.length > 60 ? 'text-amber-600' : 'text-slate-500'}`}>
                  {seo.metaTitle.length}/60 ký tự
                </span>
              </div>
              <Input
                value={seo.metaTitle}
                onChange={(e) => setSeo(prev => ({ ...prev, metaTitle: e.target.value }))}
                className="text-sm md:text-base font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-bold text-slate-700 uppercase">Meta Description (Mô Tả Tìm Kiếm)</label>
                <span className={`text-sm font-semibold ${seo.metaDescription.length > 160 ? 'text-amber-600' : 'text-slate-500'}`}>
                  {seo.metaDescription.length}/160 ký tự
                </span>
              </div>
              <textarea
                rows={3}
                value={seo.metaDescription}
                onChange={(e) => setSeo(prev => ({ ...prev, metaDescription: e.target.value }))}
                className="w-full p-3 bg-white border-2 border-slate-200 rounded-[12px] text-sm md:text-base font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 uppercase mb-1.5">Từ Khóa (Keywords)</label>
              <Input
                value={seo.keywords}
                onChange={(e) => setSeo(prev => ({ ...prev, keywords: e.target.value }))}
                placeholder="portfolio templates, react portfolios, ai studio..."
                className="text-sm md:text-base font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 uppercase mb-1.5">Đường Dẫn Chuẩn (Canonical URL)</label>
              <Input
                value={seo.canonicalUrl}
                onChange={(e) => setSeo(prev => ({ ...prev, canonicalUrl: e.target.value }))}
                className="text-sm md:text-base font-medium font-mono rounded-[12px] border-2 border-slate-200 shadow-none"
              />
            </div>

            {/* OG Image */}
            <div>
              <label className="block text-sm font-bold text-slate-700 uppercase mb-1.5">Ảnh Xem Trước Khi Chia Sẻ (OG Image)</label>
              <div className="flex gap-2.5">
                <Input
                  value={seo.ogImage}
                  onChange={(e) => setSeo(prev => ({ ...prev, ogImage: e.target.value }))}
                  className="text-sm md:text-base font-medium rounded-[12px] border-2 border-slate-200 shadow-none"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsMediaModalOpen(true)}
                  className="gap-1.5 whitespace-nowrap text-sm md:text-base font-bold text-indigo-600 rounded-[12px] border-2 border-indigo-600 bg-white hover:bg-indigo-50 shadow-none [&_svg]:text-indigo-600"
                >
                  <ImageIcon className="w-4 h-4 text-indigo-600" /> Chọn từ Storage
                </Button>
              </div>
            </div>

            {/* Robots Indexing */}
            <div className="pt-3 border-t-2 border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800">Robots Indexing (Cho phép Google Index)</p>
                <p className="text-sm text-slate-500">Tự động gắn thẻ meta name="robots" content="index, follow"</p>
              </div>
              <input
                type="checkbox"
                checked={seo.robotsIndexing}
                onChange={(e) => setSeo(prev => ({ ...prev, robotsIndexing: e.target.checked }))}
                className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            {/* Robots.txt Custom */}
            <div>
              <label className="block text-sm font-bold text-slate-700 uppercase mb-1.5">Tập tin robots.txt Tùy Biến</label>
              <textarea
                rows={4}
                value={seo.robotsCustom || ''}
                onChange={(e) => setSeo(prev => ({ ...prev, robotsCustom: e.target.value }))}
                className="w-full p-3 bg-slate-900 text-slate-100 font-mono text-sm md:text-base rounded-[12px] border-2 border-slate-800 outline-none shadow-none"
              />
            </div>
          </Card>
        </form>

        {/* Live Simulator Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Google SERP Simulator */}
          <Card className="p-5 bg-white border-2 border-slate-200 shadow-none rounded-[12px] space-y-3">
            <span className="text-sm font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-emerald-600" /> Mô phỏng Tìm kiếm Google (SERP Preview)
            </span>

            <div className="p-4 bg-white rounded-[12px] border-2 border-slate-200 space-y-1.5 shadow-none">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs">🌐</div>
                <span className="text-sm text-slate-800 font-medium">{seo.canonicalUrl || 'portfolio-shop.com'}</span>
              </div>
              <h3 className="text-base font-bold text-blue-700 hover:underline cursor-pointer mt-0.5 leading-snug">
                {seo.metaTitle}
              </h3>
              <p className="text-sm text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                {seo.metaDescription}
              </p>
            </div>
          </Card>

          {/* Social Sharing Card Simulator */}
          <Card className="p-5 bg-white border-2 border-slate-200 shadow-none rounded-[12px] space-y-3">
            <span className="text-sm font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-indigo-600" /> Thẻ Chia Sẻ OpenGraph (Facebook / X / LinkedIn)
            </span>

            <div className="rounded-[12px] border-2 border-slate-200 overflow-hidden bg-white shadow-none">
              <div className="aspect-video bg-slate-100 overflow-hidden relative border-b-2 border-slate-200">
                <img
                  src={seo.ogImage}
                  alt="OG Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 space-y-1.5 bg-slate-50/50">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                  {seo.canonicalUrl ? new URL(seo.canonicalUrl).hostname.toUpperCase() : 'PORTFOLIO-SHOP.COM'}
                </p>
                <h4 className="text-base font-bold text-slate-900 line-clamp-1">{seo.metaTitle}</h4>
                <p className="text-sm text-slate-500 line-clamp-2">{seo.metaDescription}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <MediaStorageModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        initialCategory="cover"
        onSelect={(url) => {
          setSeo(prev => ({ ...prev, ogImage: url }));
          setIsMediaModalOpen(false);
          toast.success('Đã chọn ảnh OG từ Storage');
        }}
      />
    </div>
  );
}
