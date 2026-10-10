import { useState, useEffect, useRef } from 'react';
import { 
  Image as ImageIcon, 
  UploadCloud, 
  X, 
  Check, 
  Trash2, 
  Copy, 
  Search, 
  Filter, 
  ExternalLink,
  Plus,
  Layers,
  Sparkles,
  HardDrive,
  Film,
  Zap,
  Cloud,
  Play,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { api } from '@/src/services/api';
import { StorageFile, StorageCategory } from '@/src/types';
import { Button } from '@/src/components/ui/Button';
import { Loading } from '@/src/components/ui/Loading';
import { compressImage, processVideo, formatBytes, CompressedMediaResult } from '@/src/lib/mediaCompressor';
import { toast } from 'sonner';

export interface MediaStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (url: string, file?: StorageFile) => void;
  initialCategory?: StorageCategory | 'all';
  title?: string;
  allowedCategories?: StorageCategory[];
}

const CATEGORY_LABELS: Record<StorageCategory, { label: string; description: string; badgeColor: string }> = {
  template_thumbnails: { 
    label: 'Template Thumbnails', 
    description: 'Ảnh đại diện chính của các mẫu Portfolio Master',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' 
  },
  template_gallery: { 
    label: 'Template Gallery', 
    description: 'Bộ sưu tập ảnh chi tiết giao diện Template',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200' 
  },
  customer_portfolio: { 
    label: 'Customer Portfolio', 
    description: 'Ảnh chụp màn hình & showcase portfolio của khách hàng',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' 
  },
  avatar: { 
    label: 'Avatar / Chân dung', 
    description: 'Ảnh đại diện cá nhân của chủ sở hữu portfolio',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200' 
  },
  cover: { 
    label: 'Cover / Banner', 
    description: 'Ảnh bìa banner khổ ngang cho header portfolio',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' 
  },
  project_images: { 
    label: 'Project Images', 
    description: 'Hình ảnh dự án, sản phẩm case study của khách hàng',
    badgeColor: 'bg-pink-50 text-pink-700 border-pink-200' 
  },
};

export function MediaStorageModal({
  isOpen,
  onClose,
  onSelect,
  initialCategory = 'all',
  title = 'Thư viện Media & Cloudflare R2 Storage',
  allowedCategories
}: MediaStorageModalProps) {
  const [activeCategory, setActiveCategory] = useState<StorageCategory | 'all'>(initialCategory);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<StorageFile | null>(null);
  
  // Upload form state
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadMode, setUploadMode] = useState<'preset' | 'file' | 'url'>('file');
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState<StorageCategory>('avatar');
  const [uploadUrl, setUploadUrl] = useState('');
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [compressionResult, setCompressionResult] = useState<CompressedMediaResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadFiles();
      if (initialCategory !== 'all') {
        setActiveCategory(initialCategory);
        setUploadCategory(initialCategory);
      }
    }
  }, [isOpen, activeCategory]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const data = await api.storage.listFiles(activeCategory, searchQuery);
      setFiles(data);
      if (data.length > 0 && !selectedFile) {
        setSelectedFile(data[0]);
      }
    } catch (err: any) {
      toast.error('Không thể tải danh sách tệp từ Storage');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadFiles();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!uploadName) {
      setUploadName(file.name.replace(/\.[^/.]+$/, ''));
    }

    try {
      setIsCompressing(true);
      if (file.type.startsWith('video/')) {
        toast.info('Đang xử lý tối ưu video và tạo poster snapshot...');
        const result = await processVideo(file);
        setCompressionResult(result);
        setPreviewDataUrl(result.posterDataUrl || result.dataUrl);
        toast.success(`Đã chuẩn bị video ${file.name} (${formatBytes(result.originalSize)})`);
      } else {
        toast.info('Đang nén ảnh với độ nét 100%...');
        const result = await compressImage(file, file.name, {
          maxDimension: 2560,
          quality: 0.90,
          outputFormat: 'image/webp'
        });
        setCompressionResult(result);
        setPreviewDataUrl(result.dataUrl);
        toast.success(`⚡ Nén thành công: ${formatBytes(result.originalSize)} ➔ ${formatBytes(result.compressedSize)} (-${result.reductionPercentage}%)`);
      }
    } catch (err: any) {
      console.error("Compression error:", err);
      toast.error('Lỗi khi nén tệp. Đang tải bản gốc dự phòng.');
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewDataUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName.trim()) {
      toast.error('Vui lòng nhập tên tệp');
      return;
    }

    const finalUrl = uploadMode === 'url' ? uploadUrl : (compressionResult?.dataUrl || previewDataUrl);
    if (!finalUrl && uploadMode !== 'preset') {
      toast.error('Vui lòng chọn tệp ảnh/video hoặc nhập URL hợp lệ');
      return;
    }

    try {
      setIsUploading(true);
      const newFile = await api.storage.upload({
        name: uploadName.trim(),
        category: uploadCategory,
        dataUrl: (compressionResult?.dataUrl || previewDataUrl) || undefined,
        url: uploadMode === 'url' ? uploadUrl : undefined,
        mimeType: compressionResult?.mimeType,
        originalSize: compressionResult?.originalSize,
        compressedSize: compressionResult?.compressedSize,
        savedBytes: compressionResult?.savedBytes,
        reductionPercentage: compressionResult?.reductionPercentage,
        isVideo: compressionResult?.isVideo,
        posterDataUrl: compressionResult?.posterDataUrl,
        duration: compressionResult?.duration,
        uploadedBy: 'admin'
      });

      toast.success(`Đã lưu "${newFile.name}" lên Cloudflare R2 Bucket!`);
      setFiles(prev => [newFile, ...prev]);
      setSelectedFile(newFile);
      
      // Reset upload inputs
      setUploadName('');
      setUploadUrl('');
      setPreviewDataUrl(null);
      setCompressionResult(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Switch back to files list
      setUploadMode('file');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tải tệp lên Cloudflare R2');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tệp "${name}" khỏi Cloudflare R2 Storage?`)) return;
    try {
      await api.storage.delete(id);
      toast.success('Đã xóa tệp thành công');
      setFiles(prev => prev.filter(f => f.id !== id));
      if (selectedFile?.id === id) {
        setSelectedFile(null);
      }
    } catch (e) {
      toast.error('Không thể xóa tệp');
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Đã sao chép URL vào clipboard!');
  };

  const handleConfirmSelect = () => {
    if (!selectedFile) return;
    if (onSelect) {
      onSelect(selectedFile.url, selectedFile);
    }
    onClose();
  };

  const categoriesToDisplay = allowedCategories || (Object.keys(CATEGORY_LABELS) as StorageCategory[]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-[16px] border-2 border-slate-200 shadow-2xl w-full max-w-5xl h-[90vh] max-h-[850px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b-2 border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[12px] bg-indigo-600 text-white flex items-center justify-center border-2 border-indigo-600 shadow-sm">
              <HardDrive className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                {title}
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <Cloud className="w-3 h-3" /> R2 Bucket Active
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">Tự động nén không giảm chất lượng và lưu trữ trên Cloudflare R2 CDN</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-[12px] border-2 border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="px-4 py-2.5 border-b-2 border-slate-200 bg-slate-50 shrink-0 overflow-x-auto">
          <div className="bg-slate-200/70 p-1 rounded-[12px] inline-flex items-center gap-1">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-[12px] whitespace-nowrap transition-all text-xs md:text-sm font-bold ${
                activeCategory === 'all'
                  ? 'bg-white text-slate-900 border-2 border-white shadow-[0_2px_3px_0_rgba(0,0,0,0.25)]'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 border-2 border-transparent'
              }`}
            >
              Tất cả ({files.length})
            </button>
            {categoriesToDisplay.map((catKey) => {
              const info = CATEGORY_LABELS[catKey];
              const isActive = activeCategory === catKey;
              return (
                <button
                  key={catKey}
                  onClick={() => {
                    setActiveCategory(catKey);
                    setUploadCategory(catKey);
                  }}
                  className={`px-3 py-1.5 rounded-[12px] whitespace-nowrap transition-all flex items-center gap-1.5 text-xs md:text-sm font-bold ${
                    isActive
                      ? 'bg-white text-indigo-600 border-2 border-white shadow-[0_2px_3px_0_rgba(0,0,0,0.25)]'
                      : 'bg-transparent text-slate-600 hover:text-slate-900 border-2 border-transparent'
                  }`}
                >
                  <span>{info.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Main Gallery Area */}
          <div className="md:col-span-8 flex flex-col border-r-2 border-slate-200 overflow-hidden bg-white">
            {/* Search & Upload Action Bar */}
            <div className="p-4 border-b-2 border-slate-200 flex items-center justify-between gap-3 bg-white">
              <form onSubmit={handleSearch} className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm tệp theo tên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs md:text-sm font-medium bg-white border-2 border-slate-200 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-none"
                />
              </form>
              <button
                type="button"
                onClick={() => {
                  setUploadMode('file');
                  if (fileInputRef.current) fileInputRef.current.click();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[12px] bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm font-bold border-2 border-indigo-600 shadow-[0_2px_3px_0_rgba(0,0,0,0.25)] transition-colors cursor-pointer [&_svg]:text-white"
              >
                <UploadCloud className="w-4 h-4 text-white" />
                <span>Tải ảnh/video lên</span>
              </button>
            </div>

            {/* Grid of Files */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loading size={24} />
                  <span className="text-sm font-medium">Đang tải kho tệp Cloudflare R2...</span>
                </div>
              ) : files.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-center p-6 border-2 border-dashed border-slate-200 rounded-[12px]">
                  <ImageIcon className="w-10 h-10 text-slate-300 mb-2" />
                  <p className="text-sm font-bold text-slate-700">Chưa có tệp nào trong mục này</p>
                  <p className="text-xs md:text-sm text-slate-400 mt-1">
                    Hãy chọn "Tải ảnh/video lên" để nén tự động và lưu trữ trên Cloudflare R2.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {files.map((file) => {
                    const isSelected = selectedFile?.id === file.id;
                    const catInfo = CATEGORY_LABELS[file.category] || CATEGORY_LABELS.avatar;
                    const isVideo = file.isVideo || file.mimeType.startsWith('video/');
                    return (
                      <div
                        key={file.id}
                        onClick={() => setSelectedFile(file)}
                        className={`group relative rounded-[12px] border-2 transition-all cursor-pointer overflow-hidden flex flex-col shadow-none ${
                          isSelected 
                            ? 'border-indigo-600 ring-2 ring-indigo-600/20' 
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Thumbnail / Video */}
                        <div className="aspect-video bg-slate-100 relative overflow-hidden border-b-2 border-slate-200">
                          {isVideo ? (
                            file.posterUrl ? (
                              <img src={file.posterUrl} alt={file.name} className="w-full h-full object-cover" />
                            ) : (
                              <video src={file.url} className="w-full h-full object-cover" muted playsInline />
                            )
                          ) : (
                            <img
                              src={file.url}
                              alt={file.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          )}

                          {isVideo && (
                            <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1">
                              <Film className="w-3 h-3 text-white" /> Video
                            </div>
                          )}

                          {file.storageProvider === 'cloudflare_r2' && (
                            <div className="absolute top-2 right-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-sm">
                              <Cloud className="w-2.5 h-2.5" /> R2
                            </div>
                          )}

                          {isSelected && (
                            <div className="absolute bottom-2 right-2 w-6 h-6 rounded-[12px] bg-indigo-600 text-white flex items-center justify-center shadow-[0_2px_3px_0_rgba(0,0,0,0.25)] border-2 border-indigo-600">
                              <Check className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Info Footer */}
                        <div className="p-2.5 bg-white flex flex-col justify-between flex-1">
                          <p className="text-xs md:text-sm font-bold text-slate-800 truncate" title={file.name}>
                            {file.name}
                          </p>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className={`text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded border ${catInfo.badgeColor}`}>
                              {catInfo.label.split('/')[0]}
                            </span>
                            <span className="text-[10px] md:text-xs font-medium text-slate-500">
                              {(file.size / 1024).toFixed(0)} KB
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Details & Fast Upload Panel */}
          <div className="md:col-span-4 bg-slate-50 p-5 flex flex-col justify-between overflow-y-auto border-t md:border-t-0 border-slate-200">
            {/* Quick Upload Form */}
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-[12px] border-2 border-slate-200 shadow-none space-y-3">
                <h3 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-indigo-600" /> Tải lên Cloudflare R2
                </h3>

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*,video/*" 
                  className="hidden" 
                  onChange={handleFileChange} 
                />

                <div className="space-y-1.5">
                  <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider">Tên mô tả tệp</label>
                  <input
                    type="text"
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    placeholder="VD: Designer Portfolio Hero..."
                    className="w-full px-3 py-2 text-[14px] placeholder:text-[14px] bg-white border-2 border-slate-200 rounded-[12px] outline-none focus:border-indigo-500 shadow-none font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[12px] font-bold text-slate-600 uppercase tracking-wider">Nhóm Lưu Trữ (Category)</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as StorageCategory)}
                    className="w-full px-3 py-2 text-[14px] bg-white border-2 border-slate-200 rounded-[12px] outline-none font-medium text-slate-800 shadow-none"
                  >
                    {categoriesToDisplay.map((k) => (
                      <option key={k} value={k}>{CATEGORY_LABELS[k].label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 text-xs md:text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setUploadMode('file');
                      fileInputRef.current?.click();
                    }}
                    className={`flex-1 py-1.5 rounded-[12px] border-2 text-center font-bold transition-colors ${
                      uploadMode === 'file' ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-white text-indigo-600 border-indigo-600 hover:bg-indigo-50 shadow-none'
                    }`}
                  >
                    Chọn từ máy
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('url')}
                    className={`flex-1 py-1.5 rounded-[12px] border-2 text-center font-bold transition-colors ${
                      uploadMode === 'url' ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-white text-indigo-600 border-indigo-600 hover:bg-indigo-50 shadow-none'
                    }`}
                  >
                    Nhập URL ngoài
                  </button>
                </div>

                {uploadMode === 'url' ? (
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={uploadUrl}
                    onChange={(e) => setUploadUrl(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs md:text-sm bg-white border-2 border-slate-200 rounded-[12px] outline-none shadow-none"
                  />
                ) : (
                  previewDataUrl && (
                    <div className="space-y-2">
                      <div className="relative rounded-[12px] overflow-hidden aspect-video border-2 border-slate-200 bg-slate-100">
                        {compressionResult?.isVideo ? (
                          <video src={compressionResult.dataUrl} className="w-full h-full object-cover" controls muted />
                        ) : (
                          <img src={previewDataUrl} alt="Preview" className="w-full h-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewDataUrl(null);
                            setCompressionResult(null);
                          }}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-[12px] border-2 border-red-600 shadow-sm hover:bg-red-700"
                        >
                          <X className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>

                      {/* Compression Summary Badge */}
                      {compressionResult && compressionResult.reductionPercentage > 0 && (
                        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                          <div className="flex items-center justify-between font-bold text-emerald-800">
                            <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-emerald-600" /> Tối ưu nén</span>
                            <span className="bg-emerald-200/80 px-1.5 py-0.5 rounded text-[10px]">Giảm {compressionResult.reductionPercentage}%</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-emerald-700 font-medium">
                            <span>Gốc: {formatBytes(compressionResult.originalSize)}</span>
                            <span>➔ Đã nén: {formatBytes(compressionResult.compressedSize)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                )}

                <Button 
                  onClick={handleUploadSubmit} 
                  disabled={isUploading || isCompressing} 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm md:text-base rounded-[12px] border-2 border-indigo-600 shadow-sm py-2.5"
                >
                  {isCompressing ? 'Đang nén...' : (isUploading ? 'Đang lưu lên Cloudflare R2...' : 'Lưu vào R2 Bucket')}
                </Button>
              </div>

              {/* Selected File Details */}
              {selectedFile ? (
                <div className="bg-white p-4 rounded-[12px] border-2 border-slate-200 shadow-none space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm font-bold text-slate-900">Chi tiết tệp đang chọn</span>
                    <button
                      onClick={() => handleDelete(selectedFile.id, selectedFile.name)}
                      className="px-2.5 py-1 bg-red-600 text-white rounded-[12px] border-2 border-red-600 shadow-sm hover:bg-red-700 font-bold inline-flex items-center gap-1 text-xs md:text-sm [&_svg]:text-white"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-white" /> Xóa
                    </button>
                  </div>

                  <div className="aspect-video rounded-[12px] overflow-hidden bg-slate-100 border-2 border-slate-200 relative">
                    {selectedFile.isVideo || selectedFile.mimeType.startsWith('video/') ? (
                      <video src={selectedFile.url} controls className="w-full h-full object-contain" />
                    ) : (
                      <img src={selectedFile.url} alt={selectedFile.name} className="w-full h-full object-cover" />
                    )}
                  </div>

                  <div className="space-y-1 text-xs md:text-sm">
                    <p className="font-bold text-slate-800">{selectedFile.name}</p>
                    <p className="text-slate-500">Dung lượng: {(selectedFile.size / 1024).toFixed(1)} KB {selectedFile.originalSize ? `(Gốc: ${(selectedFile.originalSize / 1024).toFixed(1)} KB)` : ''}</p>
                    <p className="text-slate-500">MIME: {selectedFile.mimeType}</p>
                    <p className="text-slate-500">Vị trí: <span className="font-mono text-indigo-600 font-bold">{selectedFile.storageProvider === 'cloudflare_r2' ? 'Cloudflare R2 Bucket' : 'Local'}</span></p>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(selectedFile.url)}
                      className="flex-1 py-2 px-2.5 rounded-[12px] border-2 border-indigo-600 bg-white hover:bg-indigo-50 text-indigo-600 text-xs md:text-sm font-bold flex items-center justify-center gap-1 shadow-none [&_svg]:text-indigo-600"
                    >
                      <Copy className="w-3.5 h-3.5 text-indigo-600" /> Copy CDN URL
                    </button>
                    <a
                      href={selectedFile.url}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2 px-2.5 rounded-[12px] border-2 border-indigo-600 bg-white hover:bg-indigo-50 text-indigo-600 text-xs md:text-sm font-bold flex items-center justify-center shadow-none [&_svg]:text-indigo-600"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                    </a>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Confirm Select Action Footer */}
            {onSelect && (
              <div className="pt-4 border-t-2 border-slate-200 mt-4">
                <Button
                  onClick={handleConfirmSelect}
                  disabled={!selectedFile}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-[12px] border-2 border-slate-900 shadow-sm flex items-center justify-center gap-2 text-sm md:text-base [&_svg]:text-white"
                >
                  <Check className="w-4 h-4 text-white" />
                  Sử dụng tệp này
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
