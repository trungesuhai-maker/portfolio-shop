import React, { useState, useEffect } from 'react';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Loading } from '@/src/components/ui/Loading';
import { api } from '@/src/services/api';
import { Category } from '@/src/types';
import { 
  Sparkles, 
  X, 
  Link as LinkIcon, 
  Globe, 
  CheckCircle2, 
  Zap, 
  Layers, 
  Edit3
} from 'lucide-react';
import { toast } from 'sonner';

interface AutoImportTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories?: Category[];
  onAutoCreateSuccess: () => Promise<void>;
  onOpenFullEditorWithData: (data: any) => void;
}

export const AutoImportTemplateModal: React.FC<AutoImportTemplateModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAutoCreateSuccess,
  onOpenFullEditorWithData
}) => {
  const [cloudRunUrl, setCloudRunUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [adminUrl, setAdminUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [inspectedData, setInspectedData] = useState<any | null>(null);

  const resetState = () => {
    setCloudRunUrl('');
    setDemoUrl('');
    setAdminUrl('');
    setInspectedData(null);
    setAnalyzing(false);
    setCreating(false);
  };

  // Reset form when modal is opened
  useEffect(() => {
    if (isOpen) {
      resetState();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = cloudRunUrl.trim();
    if (!trimmedUrl) {
      toast.error('Vui lòng nhập link Cloud Run / AI Studio URL');
      return;
    }

    setAnalyzing(true);
    setInspectedData(null);
    try {
      const result = await api.templates.autoInspect({
        url: trimmedUrl,
        demoUrl: demoUrl.trim() || undefined,
        adminUrl: adminUrl.trim() || undefined
      });

      if (adminUrl.trim()) {
        result.adminUrl = adminUrl.trim();
      } else if (result.adminUrl) {
        setAdminUrl(result.adminUrl);
      }

      setInspectedData(result);
      toast.success(`Đã phân tích thành công dự án "${result.name}"!`);
    } catch (err: any) {
      toast.error(err.message || 'Không thể phân tích URL. Vui lòng kiểm tra lại link Cloud Run');
    } finally {
      setAnalyzing(false);
    }
  };

  const handle1ClickCreate = async () => {
    if (!inspectedData) return;
    setCreating(true);
    try {
      // Format editable fields and defaultData
      const editableFields = inspectedData.schemaFields.map((sf: any, idx: number) => {
        const cleanKey = sf.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/(^_|_$)/g, '') || `field_${idx + 1}`;

        return {
          id: sf.id,
          key: cleanKey,
          label: sf.name,
          type: sf.name.toLowerCase().includes('màu') ? 'color' : sf.content.length > 50 ? 'text' : 'string',
          isRequired: false,
          defaultValue: sf.content,
          orderIndex: sf.order || (idx + 1)
        };
      });

      const defaultData: Record<string, any> = {};
      editableFields.forEach((f: any) => {
        defaultData[f.key] = f.defaultValue;
      });

      const payload = {
        name: inspectedData.name,
        slug: inspectedData.slug,
        description: inspectedData.description,
        categoryId: inspectedData.categoryId,
        categoryName: inspectedData.categoryName,
        price: Number(inspectedData.price) || 490000,
        salePrice: Number(inspectedData.salePrice) || 390000,
        currency: inspectedData.currency || 'VND',
        thumbnail: inspectedData.thumbnail,
        gallery: inspectedData.gallery || [inspectedData.thumbnail],
        demoUrl: inspectedData.demoUrl,
        originUrl: inspectedData.originUrl,
        adminUrl: adminUrl.trim() || inspectedData.adminUrl || undefined,
        status: 'published' as const,
        tags: inspectedData.tags ? inspectedData.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : ['AI Studio', 'React'],
        bgColorClass: inspectedData.bgColorClass || 'bg-slate-100',
        badge: 'new',
        isNew: true,
        isPopular: true,
        isFeatured: true,
        seo: inspectedData.seo || {
          titleTemplate: `%s | ${inspectedData.name}`,
          description: inspectedData.description
        },
        editableFields,
        defaultData
      };

      await api.templates.create(payload);
      toast.success(`Đã xuất bản template "${inspectedData.name}" vào Shop thành công!`);
      resetState();
      onClose();
      await onAutoCreateSuccess();
    } catch (err: any) {
      toast.error('Lỗi khi tạo template: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEditor = () => {
    if (!inspectedData) return;
    const dataToPass = { 
      ...inspectedData,
      adminUrl: adminUrl.trim() || inspectedData.adminUrl || ''
    };
    resetState();
    onOpenFullEditorWithData(dataToPass);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20 text-amber-300">
              <Zap className="w-5 h-5 fill-amber-300 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                Tự Động Nhập Template Từ Link AI Studio
              </h2>
              <p className="text-xs text-indigo-200">
                Dán link Cloud Run để hệ thống tự động trích xuất thông tin, hình ảnh, tính năng & schema.
              </p>
            </div>
          </div>
          <button 
            onClick={() => { resetState(); onClose(); }} 
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto overflow-x-hidden space-y-5">
          {/* Input Form */}
          <form onSubmit={handleAnalyze} className="space-y-4">
            {/* Cloud Run Link */}
            <div>
              <label className="block text-[12px] font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-indigo-900">
                  <LinkIcon className="w-3.5 h-3.5 text-indigo-600" />
                  LINK CLOUD RUN / AI STUDIO APP (ORIGIN URL) *
                </span>
                <span className="text-[11px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  Bắt buộc
                </span>
              </label>
              <Input 
                placeholder="https://videograph.webcuaban.site (hoặc link Cloud Run https://...run.app)"
                value={cloudRunUrl}
                onChange={(e) => setCloudRunUrl(e.target.value)}
                required
                className="text-[14px] placeholder:text-[14px] h-11 border-2 border-indigo-200 focus:border-indigo-600 bg-indigo-50/20 rounded-xl font-medium"
              />
              <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
                Dán đường dẫn tên miền chính hoặc link Cloud Run đã Deploy của dự án AI Studio template con (ví dụ: <strong className="text-indigo-600 font-bold">https://videograph.webcuaban.site</strong> hoặc <strong className="text-indigo-600 font-bold">https://developer.webcuaban.site</strong>).
              </p>
            </div>

            {/* Optional Demo URL */}
            <div>
              <label className="block text-[12px] font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                LINK XEM TRƯỚC DEMO (TÙY CHỌN)
              </label>
              <Input 
                placeholder="https://videograph.webcuaban.site (hoặc để trống nếu dùng chung Origin URL)"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                className="text-[14px] placeholder:text-[14px] h-11 border-2 border-slate-200 focus:border-indigo-500 rounded-xl font-medium"
              />
            </div>

            {/* ADMIN URL (ĐƯỜNG DẪN ADMIN CỦA TEMPLATE) - Kế thừa chính xác từ H1 */}
            <div className="bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[12px] font-bold text-indigo-950 uppercase tracking-wider">
                  ADMIN URL (ĐƯỜNG DẪN ADMIN CỦA TEMPLATE)
                </label>
                <span className="text-[11px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-200 shadow-xs">
                  Mở khi click EDIT
                </span>
              </div>
              <Input 
                placeholder="https://<slug-template>.webcuaban.site/admin.html (ví dụ: https://videograph.webcuaban.site/admin.html)" 
                value={adminUrl}
                onChange={(e) => setAdminUrl(e.target.value)}
                className="text-[14px] placeholder:text-[14px] rounded-xl border-2 border-indigo-200 bg-white shadow-none font-mono text-indigo-950 font-medium"
              />
              <p className="text-[12px] text-slate-600 mt-1.5 leading-relaxed">
                Nhập trực tiếp link trang admin của project AI Studio tương ứng (ví dụ: <strong className="text-indigo-600 font-bold">https://videograph.webcuaban.site/admin.html</strong> hoặc <strong className="text-indigo-600 font-bold">https://developer.webcuaban.site/admin.html</strong>). Khi để trống, hệ thống sẽ tự động ghép <code className="bg-white px-1 py-0.5 rounded border border-indigo-200 text-indigo-700 font-mono">/admin.html</code> từ Demo/Origin URL.
              </p>
            </div>

            {/* Action Analyze Button */}
            <Button 
              type="submit" 
              disabled={analyzing}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm sm:text-base rounded-xl shadow-md shadow-indigo-600/20 gap-2 border-2 border-indigo-600"
            >
              {analyzing ? (
                <>
                  <Loading /> Đang phân tích mã nguồn & dữ liệu Cloud Run...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" /> Phân Tích & Trích Xuất Dữ Liệu Tự Động
                </>
              )}
            </Button>
          </form>

          {/* Inspected Result Preview Card */}
          {inspectedData && (
            <div className="p-5 rounded-2xl bg-slate-50 border-2 border-indigo-200 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Đã trích xuất thành công
                </span>
                <span className="text-[12px] text-slate-500 font-bold">
                  Danh mục: <strong className="text-slate-800">{inspectedData.categoryName}</strong>
                </span>
              </div>

              {/* Summary Details */}
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="w-full sm:w-36 aspect-video sm:aspect-4/3 rounded-xl overflow-hidden border border-slate-300 bg-white shrink-0 shadow-xs">
                  <img 
                    src={inspectedData.thumbnail} 
                    alt="Preview" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                    {inspectedData.name}
                  </h3>
                  <p className="text-[14px] text-slate-600 line-clamp-2">
                    {inspectedData.description}
                  </p>
                  <p className="text-[12px] font-bold text-indigo-600 truncate">
                    /{inspectedData.slug}
                  </p>
                </div>
              </div>

              {/* Detected Tags (Tính Năng Chính) */}
              {inspectedData.tags && (
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                  <span className="text-[12px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    ⚡ TÍNH NĂNG CHÍNH TỰ ĐỘNG NHẬN DIỆN:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectedData.tags.split(',').map((t: string) => t.trim()).filter(Boolean).map((tag: string, i: number) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[12px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Extracted Schema Fields */}
              {inspectedData.schemaFields && inspectedData.schemaFields.length > 0 && (
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[12px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    5 TRƯỜNG TÙY BIẾN (SCHEMA) & DỮ LIỆU MẪU ĐÃ TẠO:
                  </span>
                  <div className="space-y-1">
                    {inspectedData.schemaFields.map((f: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-[12px] py-1 border-b border-slate-100 last:border-0">
                        <span className="font-bold text-slate-800">{f.name}:</span>
                        <span className="text-slate-700 max-w-xs truncate text-[12px] font-medium bg-slate-100 px-2 py-0.5 rounded">
                          {f.content}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Decision Action Buttons */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  onClick={handle1ClickCreate}
                  disabled={creating}
                  size="sm"
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-sm gap-1.5 border-2 border-emerald-600 px-3 overflow-hidden"
                >
                  {creating ? (
                    <>
                      <Loading size={14} /> <span className="truncate">Đang xuất bản...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
                      <span className="truncate">⚡ Xuất Bản Ngay (1-Click)</span>
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOpenEditor}
                  className="w-full h-11 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-black text-xs sm:text-sm rounded-xl gap-1.5 px-3 shadow-none overflow-hidden"
                >
                  <Edit3 className="w-4 h-4 shrink-0 text-indigo-600" />
                  <span className="truncate">Mở Form Tùy Chỉnh (4 Tabs)</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
