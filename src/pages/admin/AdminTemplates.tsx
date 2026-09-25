import React, { useEffect, useState, useRef } from 'react';
import { api } from '@/src/services/api';
import { Template, Category, TemplateField } from '@/src/types';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Loading } from '@/src/components/ui/Loading';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  Globe, 
  Settings2, 
  Upload, 
  Image as ImageIcon, 
  Zap, 
  ShieldCheck,
  Tag,
  DollarSign,
  HelpCircle,
  FileCode2,
  Sparkles,
  ArrowUpDown,
  ChevronDown,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { AutoImportTemplateModal } from '@/src/components/admin/AutoImportTemplateModal';
import { compressImage, formatBytes } from '@/src/lib/mediaCompressor';

type TemplateModalTab = 'info_deploy' | 'pricing' | 'schema' | 'seo';

interface SimpleSchemaField {
  id: string;
  name: string; // Tên tính năng (Label)
  content: string; // Nội dung mặc định
  order: number; // Số thứ tự sắp xếp
}

interface CustomSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

function CustomDropdown({
  value,
  onChange,
  options,
  placeholder = 'Chọn một mục...',
  className = ''
}: {
  value: string;
  onChange: (val: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = options.find(o => o.value === value) || options[0];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full h-11 px-3.5 bg-white border-2 rounded-xl text-[14px] font-bold text-slate-800 flex items-center justify-between gap-2 transition-all shadow-xs outline-none ${
          open ? 'border-indigo-600 ring-2 ring-indigo-500/10' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          {selected?.icon}
          <span className="truncate text-[14px] font-bold">{selected?.label || placeholder}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-indigo-600' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border-2 border-slate-200 rounded-xl shadow-2xl p-1.5 max-h-60 overflow-y-auto space-y-1 animate-in fade-in zoom-in-95 duration-100">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full px-3 py-2.5 rounded-lg text-left text-[14px] font-bold flex items-center justify-between gap-2 transition-all ${
                  isSelected 
                    ? 'bg-indigo-50 text-indigo-700 font-extrabold border border-indigo-200/60' 
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  {opt.icon}
                  <span className="truncate text-[14px]">{opt.label}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Helpers for formatted price inputs
const formatDisplayNumber = (val: number | string | undefined, currency: 'USD' | 'VND'): string => {
  if (val === '' || val === undefined || val === null) return '';
  const num = Number(val);
  if (isNaN(num)) return '';
  if (num === 0) return '0';
  if (currency === 'VND') {
    return num.toLocaleString('de-DE'); // dot separator: 69.000, 1.500.000
  } else {
    return num.toLocaleString('en-US'); // comma separator: 49, 1,200
  }
};

const parseInputToNumber = (inputStr: string): number => {
  const cleanStr = inputStr.replace(/[^0-9]/g, '');
  if (!cleanStr) return 0;
  return parseInt(cleanStr, 10);
};

export default function AdminTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAutoImportModalOpen, setIsAutoImportModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [activeTab, setActiveTab] = useState<TemplateModalTab>('info_deploy');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleOpenFullEditorWithData = (data: any) => {
    setEditingTemplate(null);
    setFormData({
      name: data.name || '',
      slug: data.slug || '',
      description: data.description || '',
      categoryId: data.categoryId || (categories[0]?.id || 'c1'),
      price: data.price || 490000,
      salePrice: data.salePrice || 390000,
      currency: data.currency || 'VND',
      thumbnail: data.thumbnail || 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
      gallery: data.gallery || (data.thumbnail ? [data.thumbnail] : []),
      demoUrl: data.demoUrl || data.originUrl || '',
      originUrl: data.originUrl || '',
      status: 'published',
      tags: data.tags || 'AI Studio, React, Responsive',
      bgColorClass: data.bgColorClass || 'bg-slate-100',
      badge: data.badge || 'new',
      titleTemplate: data.seo?.titleTemplate || `%s | ${data.name}`,
      seoDescription: data.seo?.description || data.description || '',
      schemaFields: data.schemaFields || [
        { id: 'f1', name: 'Tiêu đề chính (Hero Title)', content: data.name || 'Hello, World!', order: 1 }
      ]
    });
    setActiveTab('info_deploy');
    setIsModalOpen(true);
  };

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    categoryId: 'c1',
    price: 490000,
    salePrice: 0,
    currency: 'VND' as 'USD' | 'VND',
    thumbnail: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
    gallery: [] as string[],
    demoUrl: 'https://portfolio-preview.run.app',
    originUrl: 'https://my-ai-studio-portfolio.run.app',
    status: 'published' as 'published' | 'draft' | 'archived',
    tags: 'React, Tailwind, AI Studio',
    bgColorClass: 'bg-slate-100',
    badge: 'none' as string,
    titleTemplate: '%s | AI Portfolio',
    seoDescription: 'High performance modern portfolio template',
    schemaFields: [
      { id: 'f1', name: 'Tiêu đề chính (Hero Title)', content: 'Hello, I am a Creator', order: 1 },
      { id: 'f2', name: 'Mô tả ngắn (Hero Subtitle)', content: 'Building intuitive web experiences', order: 2 },
      { id: 'f3', name: 'Màu sắc chủ đạo (Accent Color)', content: '#4f46e5', order: 3 },
    ] as SimpleSchemaField[]
  });

  // Quick Category Creation Modal State
  const [isQuickCategoryModalOpen, setIsQuickCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const handleQuickCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      toast.error('Vui lòng nhập tên danh mục');
      return;
    }
    setIsCreatingCategory(true);
    try {
      const slug = trimmed
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') || `cat-${Date.now()}`;

      const created = await api.categories.create({
        name: trimmed,
        slug,
        description: newCategoryDesc.trim() || `Danh mục portfolio ${trimmed}`,
        icon: 'Sparkles'
      });

      setCategories(prev => {
        const exists = prev.find(c => c.id === created.id || c.name.toLowerCase() === created.name.toLowerCase());
        if (exists) return prev;
        return [...prev, created];
      });

      setFormData(prev => ({ ...prev, categoryId: created.id }));
      setIsQuickCategoryModalOpen(false);
      setNewCategoryName('');
      setNewCategoryDesc('');
      toast.success(`Đã thêm danh mục "${created.name}" và tự động chọn cho template!`);
    } catch (err: any) {
      toast.error('Không thể tạo danh mục: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [tpls, cats] = await Promise.all([
        api.templates.list('all'),
        api.categories.list()
      ]);
      setTemplates(tpls);
      setCategories(cats);
    } catch (err) {
      toast.error('Không thể tải danh sách template');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      categoryId: categories[0]?.id || 'c1',
      price: 490000,
      salePrice: 0,
      currency: 'VND',
      thumbnail: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
      gallery: [
        'bg-gradient-to-br from-indigo-500 to-purple-600',
        'bg-gradient-to-br from-slate-900 to-slate-800'
      ],
      demoUrl: 'https://portfolio-preview.run.app',
      originUrl: 'https://my-ai-studio-portfolio.run.app',
      status: 'published',
      tags: 'Modern, AI Studio, Fast',
      bgColorClass: 'bg-slate-100',
      badge: 'new',
      titleTemplate: '%s | Portfolio',
      seoDescription: 'Modern portfolio created with AI Studio',
      schemaFields: [
        { id: 'f1', name: 'Tiêu đề chính (Hero Title)', content: 'Hello, World!', order: 1 },
        { id: 'f2', name: 'Mô tả công việc (Job Subtitle)', content: 'Full Stack Engineer & UI Designer', order: 2 },
        { id: 'f3', name: 'Màu nhấn thương hiệu (Accent Color)', content: '#6366f1', order: 3 }
      ]
    });
    setActiveTab('info_deploy');
    setIsModalOpen(true);
  };

  const openEditModal = (tpl: Template) => {
    setEditingTemplate(tpl);

    // Convert existing editable fields to simple schema list
    const convertedFields: SimpleSchemaField[] = (tpl.editableFields && tpl.editableFields.length > 0)
      ? tpl.editableFields.map((f, idx) => {
          let rawVal = f.defaultValue ?? (tpl.defaultData?.[f.key] ?? '');
          let contentStr = '';
          if (typeof rawVal === 'object' && rawVal !== null) {
            try {
              if (Array.isArray(rawVal)) {
                contentStr = rawVal.map(item => {
                  if (typeof item === 'object' && item !== null) {
                    return item.title || item.name || item.label || JSON.stringify(item);
                  }
                  return String(item);
                }).join(', ');
              } else {
                contentStr = JSON.stringify(rawVal);
              }
            } catch {
              contentStr = '';
            }
          } else {
            contentStr = String(rawVal ?? '');
          }

          return {
            id: f.id || `f_${idx + 1}`,
            name: f.label || f.key,
            content: contentStr,
            order: f.orderIndex ?? (idx + 1)
          };
        })
      : [
          { id: 'f1', name: 'Tiêu đề chính (Hero Title)', content: tpl.defaultData?.hero_title || 'Hello, I am a Creator', order: 1 },
          { id: 'f2', name: 'Mô tả ngắn (Hero Subtitle)', content: tpl.defaultData?.hero_subtitle || 'Building intuitive web experiences', order: 2 },
          { id: 'f3', name: 'Màu nhấn thương hiệu', content: tpl.defaultData?.primary_color || '#4f46e5', order: 3 },
        ];

    // Determine badge from existing flags
    let initialBadge = tpl.badge || 'none';
    if (!tpl.badge) {
      if (tpl.isPopular) initialBadge = 'banchay';
      else if (tpl.isNew) initialBadge = 'new';
      else if (tpl.isFeatured) initialBadge = 'hot';
    }

    const currency = tpl.currency || 'VND';
    let price = tpl.price;
    let salePrice = tpl.salePrice || 0;
    if (currency === 'VND' && price < 1000 && !tpl.currency) {
      price = price * 25000;
      if (salePrice > 0) salePrice = salePrice * 25000;
    }

    setFormData({
      name: tpl.name,
      slug: tpl.slug,
      description: tpl.description,
      categoryId: tpl.categoryId,
      price,
      salePrice,
      currency,
      thumbnail: tpl.thumbnail,
      gallery: tpl.gallery || [],
      demoUrl: tpl.demoUrl,
      originUrl: tpl.originUrl,
      status: tpl.status,
      tags: (tpl.tags || []).join(', '),
      bgColorClass: tpl.bgColorClass || 'bg-slate-100',
      badge: initialBadge,
      titleTemplate: tpl.seo?.titleTemplate || `%s | ${tpl.name}`,
      seoDescription: tpl.seo?.description || tpl.description,
      schemaFields: convertedFields.sort((a, b) => a.order - b.order)
    });
    setActiveTab('info_deploy');
    setIsModalOpen(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const generatedSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setFormData(prev => ({
      ...prev,
      name: val,
      slug: prev.slug && editingTemplate ? prev.slug : generatedSlug
    }));
  };

  // Image Upload Handler with High-Fidelity Compression & Cloudflare R2 Upload
  const [isUploadingThumb, setIsUploadingThumb] = useState(false);
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingThumb(true);
      toast.info('Đang nén tối ưu ảnh và tải lên Cloudflare R2...');

      // 1. High-fidelity compression (near-lossless quality, 80%+ size reduction)
      const compressed = await compressImage(file, file.name || 'template-thumbnail', {
        maxDimension: 2560,
        quality: 0.90,
        outputFormat: 'image/webp'
      });

      // 2. Direct upload to Cloudflare R2 Bucket
      const uploadRes = await api.storage.upload({
        name: `Template Thumbnail - ${formData.name || 'Untitled'}`,
        category: 'template_thumbnails',
        dataUrl: compressed.dataUrl,
        mimeType: compressed.mimeType,
        originalSize: compressed.originalSize,
        compressedSize: compressed.compressedSize,
        savedBytes: compressed.savedBytes,
        reductionPercentage: compressed.reductionPercentage,
        uploadedBy: 'admin'
      });

      setFormData(prev => ({
        ...prev,
        thumbnail: uploadRes.url
      }));

      const origText = formatBytes(compressed.originalSize);
      const compText = formatBytes(compressed.compressedSize);
      toast.success(
        `⚡ Đã nén (${origText} ➔ ${compText}, -${compressed.reductionPercentage}%) và lưu vào Cloudflare R2 Bucket!`
      );
    } catch (err: any) {
      console.error('Error compressing and uploading image:', err);
      toast.error(err.message || 'Lỗi khi nén hoặc tải ảnh lên Cloudflare R2');
    } finally {
      setIsUploadingThumb(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Schema field handlers
  const handleAddSchemaField = () => {
    const nextOrder = formData.schemaFields.length + 1;
    const newField: SimpleSchemaField = {
      id: `f_${Date.now()}`,
      name: `Tính năng mới ${nextOrder}`,
      content: '',
      order: nextOrder
    };
    setFormData(prev => ({
      ...prev,
      schemaFields: [...prev.schemaFields, newField]
    }));
  };

  const handleRemoveSchemaField = (id: string) => {
    setFormData(prev => ({
      ...prev,
      schemaFields: prev.schemaFields.filter(f => f.id !== id)
    }));
  };

  const handleSchemaFieldChange = (id: string, prop: keyof SimpleSchemaField, val: any) => {
    setFormData(prev => ({
      ...prev,
      schemaFields: prev.schemaFields.map(f => f.id === id ? { ...f, [prop]: val } : f)
    }));
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Vui lòng nhập Tên Template');
      return;
    }

    setSaving(true);
    try {
      const selectedCategory = categories.find(c => c.id === formData.categoryId);

      // Convert simple schema fields back to TemplateField & defaultData
      const sortedFields = [...formData.schemaFields].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
      const editableFields: TemplateField[] = sortedFields.map((sf, index) => {
        const cleanKey = sf.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/(^_|_$)/g, '') || `field_${index + 1}`;

        return {
          id: sf.id,
          key: cleanKey,
          label: sf.name,
          type: sf.name.toLowerCase().includes('màu') ? 'color' : sf.content.length > 50 ? 'text' : 'string',
          isRequired: false,
          defaultValue: sf.content,
          orderIndex: Number(sf.order) || (index + 1)
        };
      });

      const defaultData: Record<string, any> = {};
      editableFields.forEach(f => {
        defaultData[f.key] = f.defaultValue;
      });

      // Map badge to flags
      const isPopular = formData.badge === 'banchay' || formData.badge === 'hot';
      const isNew = formData.badge === 'new';
      const isFeatured = formData.badge === 'hot' || formData.badge === 'docquyen' || formData.badge === 'vip';

      const payload: Partial<Template> = {
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description,
        categoryId: formData.categoryId,
        categoryName: selectedCategory?.name || 'General',
        price: Number(formData.price),
        salePrice: Number(formData.salePrice) > 0 ? Number(formData.salePrice) : undefined,
        currency: formData.currency,
        thumbnail: formData.thumbnail,
        gallery: formData.gallery.length > 0 ? formData.gallery : [formData.thumbnail],
        demoUrl: formData.demoUrl,
        originUrl: formData.originUrl,
        version: editingTemplate?.version || '1.0.0',
        schemaVersion: editingTemplate?.schemaVersion || '1.0.0',
        status: formData.status,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        bgColorClass: formData.bgColorClass,
        badge: formData.badge,
        isNew,
        isPopular,
        isFeatured,
        seo: {
          titleTemplate: formData.titleTemplate,
          description: formData.seoDescription
        },
        editableFields,
        defaultData
      };

      if (editingTemplate) {
        await api.templates.update(editingTemplate.id, payload);
        toast.success(`Đã cập nhật template "${formData.name}" thành công!`);
      } else {
        await api.templates.create(payload);
        toast.success(`Đã đăng ký template "${formData.name}" vào Shop!`);
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi lưu template');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (tpl: Template) => {
    const newStatus = tpl.status === 'published' ? 'draft' : 'published';
    try {
      await api.templates.toggleStatus(tpl.id, newStatus);
      toast.success(`Đã chuyển trạng thái template sang: ${newStatus === 'published' ? 'Xuất bản' : 'Bản nháp'}`);
      setTemplates(prev => prev.map(t => t.id === tpl.id ? { ...t, status: newStatus } : t));
    } catch (err) {
      toast.error('Không thể đổi trạng thái');
    }
  };

  const handleDeleteTemplate = async (tpl: Template) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa template "${tpl.name}"?`)) return;
    try {
      await api.templates.delete(tpl.id);
      toast.success(`Đã xóa template "${tpl.name}"`);
      setTemplates(prev => prev.filter(t => t.id !== tpl.id));
    } catch (err) {
      toast.error('Không thể xóa template');
    }
  };

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'all' || t.categoryId === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Quản lý Template & AI Studio Projects</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Nhập tự động bằng link Cloud Run AI Studio hoặc tạo & cấu hình thủ công template cho Shop.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button 
            onClick={() => setIsAutoImportModalOpen(true)} 
            className="gap-2 font-black text-sm md:text-base bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-indigo-600 rounded-[12px] shadow-md shadow-indigo-600/20 [&_svg]:text-amber-300"
          >
            <Zap className="w-4 h-4 fill-amber-300 text-amber-300" /> ⚡ Nhập Tự Động từ Cloud Run
          </Button>

          <Button 
            onClick={openCreateModal} 
            variant="outline" 
            className="gap-2 font-bold text-sm md:text-base border-2 border-slate-300 text-slate-800 bg-white hover:bg-slate-50 rounded-[12px] shadow-none [&_svg]:text-indigo-600"
          >
            <Plus className="w-4 h-4 text-indigo-600" /> Thêm Thủ Công
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-white border-2 border-slate-200 shadow-none rounded-[12px] flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input 
            placeholder="Tìm theo tên template, slug, từ khóa..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11 w-full text-sm md:text-base rounded-[12px] border-2 border-slate-200 shadow-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-11 px-3 bg-white border-2 border-slate-200 rounded-[12px] text-sm md:text-base font-medium text-slate-700 outline-none shadow-none focus:border-indigo-500"
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <span className="text-sm font-bold text-slate-500 whitespace-nowrap">
            {filteredTemplates.length} template
          </span>
        </div>
      </Card>

      {/* Templates Table */}
      <Card className="bg-white border-2 border-slate-200 shadow-none rounded-[12px] overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center"><Loading /></div>
        ) : filteredTemplates.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-slate-400 text-sm font-medium">Không tìm thấy template nào phù hợp.</p>
            <Button onClick={openCreateModal} variant="outline" size="sm" className="mt-4 gap-2 text-sm md:text-base font-bold rounded-[12px] shadow-none border-2 border-indigo-600 bg-white hover:bg-indigo-50 text-indigo-600 [&_svg]:text-indigo-600">
              <Plus className="w-4 h-4 text-indigo-600" /> Đăng ký Template Đầu Tiên
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-slate-100 bg-slate-50/50 text-slate-600 text-sm font-bold">
                  <th className="py-3.5 px-4">Template</th>
                  <th className="py-3.5 px-4">Danh mục</th>
                  <th className="py-3.5 px-4">Giá bán</th>
                  <th className="py-3.5 px-4">Origin AI Studio</th>
                  <th className="py-3.5 px-4">Huy hiệu</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTemplates.map((tpl) => (
                  <tr key={tpl.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Thumbnail & Title */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-[12px] overflow-hidden bg-slate-100 border-2 border-slate-200 flex-shrink-0">
                          {tpl.thumbnail && tpl.thumbnail.startsWith('http') ? (
                            <img src={tpl.thumbnail} alt={tpl.name} className="w-full h-full object-cover" />
                          ) : tpl.thumbnail && tpl.thumbnail.startsWith('data:image') ? (
                            <img src={tpl.thumbnail} alt={tpl.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className={`w-full h-full ${tpl.thumbnail || 'bg-brand-500'}`} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-sm truncate">{tpl.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {tpl.id.startsWith('project-') && (
                              <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                AI Studio Độc Lập
                              </span>
                            )}
                            <span className="text-xs text-slate-500 font-mono truncate max-w-[140px]">/{tpl.slug}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 font-medium text-slate-700 text-sm">
                      {tpl.categoryName || 'Chung'}
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-black text-slate-900 text-sm">
                          {tpl.currency === 'VND' ? `${(tpl.salePrice || tpl.price).toLocaleString()} ₫` : `$${tpl.salePrice || tpl.price}`}
                        </span>
                        {tpl.salePrice && (
                          <span className="text-xs text-slate-400 line-through">
                            {tpl.currency === 'VND' ? `${tpl.price.toLocaleString()} ₫` : `$${tpl.price}`}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* AI Studio Origin URL */}
                    <td className="py-3.5 px-4">
                      <a 
                        href={tpl.originUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium truncate max-w-[180px]"
                      >
                        <Globe className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{tpl.originUrl.replace('https://', '')}</span>
                      </a>
                    </td>

                    {/* Badge */}
                    <td className="py-3.5 px-4">
                      {tpl.badge === 'banchay' || tpl.isPopular ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          🔥 Bán chạy
                        </span>
                      ) : tpl.badge === 'new' || tpl.isNew ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
                          ✨ Mới
                        </span>
                      ) : tpl.badge === 'hot' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          ⚡ HOT
                        </span>
                      ) : tpl.badge === 'tietkiem' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          🏷️ Tiết Kiệm
                        </span>
                      ) : tpl.badge === 'docquyen' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
                          👑 Độc Quyền
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Không có</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        tpl.status === 'published' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${tpl.status === 'published' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {tpl.status === 'published' ? 'Đang bán' : 'Bản nháp'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleTogglePublish(tpl)}
                          className={`p-2 rounded-[10px] border-2 transition-all ${
                            tpl.status === 'published'
                              ? 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
                          }`}
                          title={tpl.status === 'published' ? 'Ẩn template' : 'Xuất bản template'}
                        >
                          {tpl.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={() => openEditModal(tpl)}
                          className="p-2 rounded-[10px] bg-white hover:bg-indigo-50 text-indigo-600 border-2 border-indigo-200 hover:border-indigo-600 transition-all"
                          title="Chỉnh sửa template"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteTemplate(tpl)}
                          className="p-2 rounded-[10px] bg-white hover:bg-red-50 text-red-600 border-2 border-red-200 hover:border-red-600 transition-all"
                          title="Xóa template"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* POPUP MODAL: WIDE CONTAINER & RESPONSIVE HEIGHT (Up to 950px on desktop, adaptive for tablet & mobile) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-2xl w-full max-w-5xl my-auto overflow-hidden flex flex-col h-[92vh] md:h-[840px] lg:h-[950px] max-h-[96vh]">
            
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-4 border-b-2 border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div>
                <h2 className="text-base sm:text-xl font-black text-slate-900">
                  {editingTemplate ? `Chỉnh sửa Template: ${editingTemplate.name}` : 'Đăng ký Template AI Studio Mới'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Cấu hình điểm cuối deployment, trường tùy biến, giá bán và SEO.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-200/70 hover:bg-slate-300 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all shrink-0 ml-2"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Navigation Tabs - GUARANTEED 1 ROW (4 tabs) with SMOOTH TRANSITION */}
            <div className="p-3 sm:p-4 bg-slate-50/60 border-b-2 border-slate-100 shrink-0">
              <div className="bg-slate-200/70 p-1 rounded-xl border border-slate-300/60 grid grid-cols-2 sm:grid-cols-4 gap-1 w-full relative">
                {[
                  { id: 'info_deploy' as const, label: 'Thông tin & Deploy', icon: Globe },
                  { id: 'pricing' as const, label: 'Giá & Hình ảnh', icon: DollarSign },
                  { id: 'schema' as const, label: 'Trường Schema', icon: FileCode2 },
                  { id: 'seo' as const, label: 'SEO & Nhãn', icon: Tag },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-colors text-center whitespace-nowrap flex items-center justify-center gap-1.5 z-10 ${
                        isActive ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeModalTabIndicator"
                          className="absolute inset-0 bg-white rounded-lg shadow-sm border border-slate-200/80 -z-10"
                          transition={{ type: "spring", stiffness: 450, damping: 35 }}
                        />
                      )}
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSaveTemplate} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8, scale: 0.995 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.995 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="space-y-6"
                  >
              
              {/* TAB 1: THÔNG TIN & DEPLOY (Gộp hình 1 + hình 2, loại bỏ banner & version) */}
              {activeTab === 'info_deploy' && (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Tên Template *
                      </label>
                      <Input 
                        placeholder="Ví dụ: Project A: Designer Portfolio" 
                        value={formData.name}
                        onChange={handleNameChange}
                        required
                        className="text-[14px] placeholder:text-[14px] rounded-xl border-2 border-slate-200 shadow-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Đường dẫn tĩnh (Slug) *
                      </label>
                      <Input 
                        placeholder="Ví dụ: project-a-designer" 
                        value={formData.slug}
                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                        required
                        className="text-[14px] placeholder:text-[14px] rounded-xl border-2 border-slate-200 shadow-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider">
                        Danh mục *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setNewCategoryName('');
                          setNewCategoryDesc('');
                          setIsQuickCategoryModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 text-[12px] font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2.5 py-1 rounded-lg transition-colors border border-indigo-200 bg-white shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Thêm danh mục</span>
                      </button>
                    </div>
                    <CustomDropdown
                      value={formData.categoryId}
                      onChange={(val) => setFormData(prev => ({ ...prev, categoryId: val }))}
                      options={categories.map(c => ({
                        value: c.id,
                        label: c.name,
                        icon: <Tag className="w-4 h-4 text-indigo-500 shrink-0" />
                      }))}
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Mô tả giới thiệu
                    </label>
                    <textarea 
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Chuyên biệt cho UI/UX Designer, Art Director & Visual Creator với canvas tương tác và bento showcase."
                      className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-[14px] placeholder:text-[14px] font-medium text-slate-800 outline-none shadow-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="pt-2 border-t-2 border-slate-100 space-y-4">
                    <div>
                      <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Origin URL (Link ứng dụng AI Studio đã Deploy) *
                      </label>
                      <Input 
                        placeholder="https://designer-portfolio.ai.studio.run.app" 
                        value={formData.originUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, originUrl: e.target.value }))}
                        required
                        className="text-[14px] placeholder:text-[14px] rounded-xl border-2 border-slate-200 shadow-none"
                      />
                      <p className="text-[12px] text-slate-500 mt-1">Đường dẫn container gốc chạy mã nguồn render portfolio thực tế.</p>
                    </div>

                    <div>
                      <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Demo URL (Link xem trước trực tiếp) *
                      </label>
                      <Input 
                        placeholder="https://designer-demo.portfolio-shop.com" 
                        value={formData.demoUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, demoUrl: e.target.value }))}
                        required
                        className="text-[14px] placeholder:text-[14px] rounded-xl border-2 border-slate-200 shadow-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: GIÁ & HÌNH ẢNH (Hình 3 updates) */}
              {activeTab === 'pricing' && (
                <div className="space-y-5">
                  {/* Currency Selector */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-indigo-50/70 border-2 border-indigo-100">
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-indigo-950 uppercase tracking-wider block">
                        Đơn vị tiền tệ hiển thị
                      </span>
                      <span className="text-xs text-indigo-600">Mặc định: ₫ VNĐ (áp dụng phân cách hàng nghìn bằng dấu chấm)</span>
                    </div>
                    <div className="inline-flex p-1 bg-white rounded-xl border border-indigo-200 shadow-xs">
                      <button
                        type="button"
                        onClick={() => {
                          if (formData.currency !== 'VND') {
                            const newPrice = formData.price < 1000 ? formData.price * 25000 : formData.price;
                            const newSalePrice = formData.salePrice > 0 ? (formData.salePrice < 1000 ? formData.salePrice * 25000 : formData.salePrice) : 0;
                            setFormData(prev => ({ ...prev, currency: 'VND', price: newPrice, salePrice: newSalePrice }));
                          }
                        }}
                        className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                          formData.currency === 'VND'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        ₫ VNĐ
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (formData.currency !== 'USD') {
                            const newPrice = Math.round(formData.price / 25000) || 49;
                            const newSalePrice = formData.salePrice > 0 ? Math.round(formData.salePrice / 25000) : 0;
                            setFormData(prev => ({ ...prev, currency: 'USD', price: newPrice, salePrice: newSalePrice }));
                          }
                        }}
                        className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                          formData.currency === 'USD'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        $ USD
                      </button>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-black text-slate-800 uppercase tracking-wider mb-1.5">
                        GIÁ CHƯA GIẢM *
                      </label>
                      <div className="relative">
                        <input 
                          type="text" 
                          inputMode="numeric"
                          placeholder={formData.currency === 'VND' ? '690.000' : '49'}
                          value={formatDisplayNumber(formData.price, formData.currency)}
                          onChange={(e) => {
                            const num = parseInputToNumber(e.target.value);
                            setFormData(prev => ({ ...prev, price: num }));
                          }}
                          required
                          className="w-full h-11 px-3.5 bg-white border-2 border-slate-200 focus:border-indigo-600 rounded-xl text-[14px] placeholder:text-[14px] font-bold text-slate-900 outline-none pr-14 shadow-none"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] font-bold text-slate-500 pointer-events-none bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {formData.currency === 'VND' ? 'VNĐ' : 'USD'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[12px] font-black text-slate-800 uppercase tracking-wider mb-1.5">
                        GIÁ ĐÃ GIẢM
                      </label>
                      <div className="relative">
                        <input 
                          type="text" 
                          inputMode="numeric"
                          placeholder={formData.currency === 'VND' ? 'Để trống nếu không giảm giá' : '0'}
                          value={formData.salePrice > 0 ? formatDisplayNumber(formData.salePrice, formData.currency) : ''}
                          onChange={(e) => {
                            const num = parseInputToNumber(e.target.value);
                            setFormData(prev => ({ ...prev, salePrice: num }));
                          }}
                          className="w-full h-11 px-3.5 bg-white border-2 border-slate-200 focus:border-indigo-600 rounded-xl text-[14px] placeholder:text-[14px] font-bold text-emerald-600 outline-none pr-14 shadow-none"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] font-bold text-slate-500 pointer-events-none bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {formData.currency === 'VND' ? 'VNĐ' : 'USD'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Thumbnail Image with Device Upload Button */}
                  <div className="space-y-2 pt-2 border-t-2 border-slate-100">
                    <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider">
                      ĐƯỜNG DẪN ẢNH THUMBNAIL *
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <Input 
                        placeholder="https://images.unsplash.com/... hoặc tải ảnh lên" 
                        value={formData.thumbnail}
                        onChange={(e) => setFormData(prev => ({ ...prev, thumbnail: e.target.value }))}
                        required
                        className="text-[14px] placeholder:text-[14px] rounded-xl border-2 border-slate-200 shadow-none flex-1"
                      />

                      {/* Upload from device button */}
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload} 
                      />
                      <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        className="gap-2 border-2 border-indigo-600 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 font-bold rounded-xl shrink-0 text-[14px]"
                      >
                        <Upload className="w-4 h-4 text-indigo-600" />
                        Tải ảnh từ máy
                      </Button>
                    </div>

                    {/* Image Preview Box */}
                    {formData.thumbnail && (
                      <div className="mt-3 flex items-start gap-4 p-3 rounded-xl bg-slate-50 border-2 border-slate-200">
                        <div className="w-40 h-24 rounded-lg overflow-hidden border border-slate-300 bg-white shrink-0 shadow-sm">
                          <img 
                            src={formData.thumbnail} 
                            alt="Preview Thumbnail" 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div className="space-y-1 text-xs text-slate-500 py-1">
                          <p className="font-bold text-slate-800 text-[14px]">Xem trước ảnh bìa</p>
                          <p className="text-[12px]">Tỷ lệ hiển thị khuyến nghị: 16:9 hoặc 4:3 (Tối thiểu 800x450px).</p>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, thumbnail: '' }))}
                            className="text-red-500 hover:text-red-700 font-semibold underline mt-1 text-[12px]"
                          >
                            Xóa ảnh
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Màu nền card hiển thị
                    </label>
                    <CustomDropdown
                      value={formData.bgColorClass}
                      onChange={(val) => setFormData(prev => ({ ...prev, bgColorClass: val }))}
                      options={[
                        { value: 'bg-slate-100', label: 'Xám nhạt (bg-slate-100)', icon: <span className="w-3.5 h-3.5 rounded-full bg-slate-200 border border-slate-400/60 inline-block shrink-0" /> },
                        { value: 'bg-indigo-50', label: 'Tím nhẹ (bg-indigo-50)', icon: <span className="w-3.5 h-3.5 rounded-full bg-indigo-100 border border-indigo-300 inline-block shrink-0" /> },
                        { value: 'bg-emerald-50', label: 'Xanh ngọc (bg-emerald-50)', icon: <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 border border-emerald-300 inline-block shrink-0" /> },
                        { value: 'bg-amber-50', label: 'Vàng kem ấm (bg-amber-50)', icon: <span className="w-3.5 h-3.5 rounded-full bg-amber-100 border border-amber-300 inline-block shrink-0" /> },
                        { value: 'bg-rose-50', label: 'Hồng phấn (bg-rose-50)', icon: <span className="w-3.5 h-3.5 rounded-full bg-rose-100 border border-rose-300 inline-block shrink-0" /> },
                        { value: 'bg-slate-900', label: 'Tương phản tối (bg-slate-900)', icon: <span className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-700 inline-block shrink-0" /> }
                      ]}
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: TRƯỜNG SCHEMA & TÍNH NĂNG */}
              {activeTab === 'schema' && (
                <div className="space-y-6">
                  {/* PHẦN 1: TÍNH NĂNG CHÍNH (TAGS / FEATURES) */}
                  <div className="p-4 rounded-xl bg-amber-50/60 border-2 border-amber-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                            ⚡ Tính Năng Chính (Key Features / Tags) *
                          </h3>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Hiển thị trực tiếp tại mục <strong>"⚡ Tính năng chính"</strong> ở trang chi tiết sản phẩm ngoài Shop.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Input 
                        placeholder="Ví dụ: Designer, UI/UX, Figma, Interactive, Bento" 
                        value={formData.tags}
                        onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                        className="text-[14px] placeholder:text-[14px] rounded-xl border-2 border-amber-200 shadow-none font-medium bg-white"
                      />
                      <p className="text-[12px] text-slate-500 mt-1">
                        Nhập các tính năng nổi bật ngăn cách nhau bởi dấu phẩy (Ví dụ: <code>Designer, UI/UX, Figma, Interactive, Bento</code>).
                      </p>
                    </div>

                    {/* Live Preview Chips */}
                    {formData.tags.trim() && (
                      <div className="pt-2 border-t border-amber-200/60 flex flex-wrap items-center gap-2">
                        <span className="text-[12px] font-bold text-slate-500">Xem trước tính năng:</span>
                        {formData.tags.split(',').map(t => t.trim()).filter(Boolean).map((tag, idx) => (
                          <span 
                            key={idx} 
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-bold bg-white text-slate-800 border border-amber-300 shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* PHẦN 2: CẤU HÌNH CÁC TRƯỜNG TÙY BIẾN & DỮ LIỆU MẶC ĐỊNH */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-indigo-50/70 border-2 border-indigo-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-600" />
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                            Cấu hình các trường tùy biến ({formData.schemaFields.length})
                          </h3>
                        </div>
                        <p className="text-[12px] text-slate-600 mt-1">
                          • <strong>Tên trường:</strong> Hiển thị ở danh sách <em>"Phần có thể chỉnh sửa"</em> ngoài Shop.<br/>
                          • <strong>Nội dung mặc định:</strong> Dữ liệu mẫu ban đầu được nạp sẵn khi khách bấm <em>"Chỉnh Sửa Thử"</em> hoặc mua tùy biến Portfolio.
                        </p>
                      </div>
                      <Button 
                        type="button" 
                        size="sm" 
                        onClick={handleAddSchemaField} 
                        className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[12px] sm:text-[14px] rounded-xl shrink-0"
                      >
                        <Plus className="w-4 h-4 text-white" /> Thêm Trường Tùy Biến
                      </Button>
                    </div>

                    {/* Schema fields table list */}
                    <div className="space-y-3">
                      {/* Header Columns */}
                      <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-3 text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                        <div className="col-span-4">Tên Tính Năng / Trường</div>
                        <div className="col-span-6">Nội Dung Mặc Định</div>
                        <div className="col-span-1 text-center">Thứ Tự</div>
                        <div className="col-span-1 text-right">Xóa</div>
                      </div>

                      {formData.schemaFields.map((field) => (
                        <div 
                          key={field.id} 
                          className="p-3.5 rounded-xl border-2 border-slate-200 bg-slate-50/80 hover:bg-white hover:border-indigo-200 transition-all space-y-2 sm:space-y-0"
                        >
                          <div className="grid sm:grid-cols-12 gap-3 items-center">
                            {/* 1. Feature Name */}
                            <div className="sm:col-span-4">
                              <label className="block sm:hidden text-[12px] font-bold text-slate-600 mb-1">Tên tính năng:</label>
                              <Input 
                                placeholder="Ví dụ: Tiêu đề chính, Họ và Tên..." 
                                value={field.name}
                                onChange={(e) => handleSchemaFieldChange(field.id, 'name', e.target.value)}
                                className="h-10 text-[14px] placeholder:text-[14px] font-bold text-slate-900 rounded-xl border-2 border-slate-200 shadow-none bg-white"
                              />
                            </div>

                            {/* 2. Default Content */}
                            <div className="sm:col-span-6">
                              <label className="block sm:hidden text-[12px] font-bold text-slate-600 mb-1">Nội dung mặc định:</label>
                              <Input 
                                placeholder="Ví dụ: Elena Rostova, Senior UI/UX Designer..." 
                                value={field.content}
                                onChange={(e) => handleSchemaFieldChange(field.id, 'content', e.target.value)}
                                className="h-10 text-[14px] placeholder:text-[14px] font-medium text-slate-800 rounded-xl border-2 border-slate-200 shadow-none bg-white"
                              />
                            </div>

                            {/* 3. Order Index */}
                            <div className="sm:col-span-1">
                              <label className="block sm:hidden text-[12px] font-bold text-slate-600 mb-1">Thứ tự sắp xếp:</label>
                              <Input 
                                type="number"
                                min="1"
                                placeholder="1" 
                                value={field.order}
                                onChange={(e) => handleSchemaFieldChange(field.id, 'order', Number(e.target.value))}
                                className="h-10 text-center text-[14px] placeholder:text-[14px] font-bold rounded-xl border-2 border-slate-200 shadow-none bg-white"
                              />
                            </div>

                            {/* 4. Delete Action */}
                            <div className="sm:col-span-1 flex justify-end">
                              <button 
                                type="button" 
                                onClick={() => handleRemoveSchemaField(field.id)}
                                className="p-2 rounded-xl bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 transition-all inline-flex items-center justify-center"
                                title="Xóa trường này"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SEO & NHÃN (Hình 5: Dropdown chọn huy hiệu) */}
              {activeTab === 'seo' && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Mẫu Tiêu đề SEO (Title Template)
                    </label>
                    <Input 
                      placeholder="%s | Portfolio Cá Nhân Đẹp" 
                      value={formData.titleTemplate}
                      onChange={(e) => setFormData(prev => ({ ...prev, titleTemplate: e.target.value }))}
                      className="text-[14px] placeholder:text-[14px] rounded-xl border-2 border-slate-200 shadow-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Mô tả SEO (Meta Description)
                    </label>
                    <textarea 
                      rows={3}
                      value={formData.seoDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                      className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-[14px] placeholder:text-[14px] font-medium text-slate-800 outline-none shadow-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="pt-3 border-t-2 border-slate-100 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Badge Dropdown Selector */}
                      <div>
                        <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Chọn Loại Huy Hiệu Nổi Bật (Badge)
                        </label>
                        <CustomDropdown
                          value={formData.badge}
                          onChange={(val) => setFormData(prev => ({ ...prev, badge: val }))}
                          options={[
                            { value: 'none', label: 'Không dùng huy hiệu', icon: <span className="text-slate-400">❌</span> },
                            { value: 'banchay', label: 'Bán chạy nhất (Best Seller)', icon: <span>🔥</span> },
                            { value: 'new', label: 'Mới ra mắt (New Arrival)', icon: <span>✨</span> },
                            { value: 'hot', label: 'HOT / Thịnh hành (Trending)', icon: <span>⚡</span> },
                            { value: 'tietkiem', label: 'Siêu Tiết Kiệm (Best Deal)', icon: <span>🏷️</span> },
                            { value: 'docquyen', label: 'Độc Quyền (Exclusive)', icon: <span>👑</span> },
                            { value: 'khuyendung', label: 'Khuyên Dùng (Recommended)', icon: <span>👍</span> },
                            { value: 'vip', label: 'Bản Cao Cấp (VIP Pro)', icon: <span>💎</span> },
                            { value: 'mienphi', label: 'Miễn Phí (Free Template)', icon: <span>🎁</span> }
                          ]}
                        />
                      </div>

                      {/* Status Checkbox */}
                      <div className="flex items-end">
                        <label className="flex items-center gap-3 p-3.5 rounded-xl border-2 border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer w-full h-12 transition-all">
                          <input 
                            type="checkbox" 
                            checked={formData.status === 'published'}
                            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.checked ? 'published' : 'draft' }))}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                          />
                          <span className="text-[14px] font-bold text-slate-800">
                            Hiển thị mở bán trong Cửa hàng
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Modal Footer - PINNED AT BOTTOM */}
              <div className="px-6 py-4 border-t-2 border-slate-100 flex items-center justify-end gap-3 bg-slate-50/70 shrink-0">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)} 
                  className="text-slate-600 font-bold text-xs sm:text-sm rounded-xl shadow-none border-2 border-slate-300 hover:bg-slate-100"
                >
                  Hủy
                </Button>
                <Button 
                  type="submit" 
                  disabled={saving} 
                  className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 text-xs sm:text-sm rounded-xl shadow-md border-2 border-indigo-600"
                >
                  {saving ? <Loading size={18} /> : <Check className="w-4 h-4 text-white" />}
                  {saving ? 'Đang lưu...' : editingTemplate ? 'Cập nhật Template' : 'Lưu Đăng ký Template'}
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Auto Import AI Studio / Cloud Run Template Modal */}
      <AutoImportTemplateModal
        isOpen={isAutoImportModalOpen}
        onClose={() => setIsAutoImportModalOpen(false)}
        categories={categories}
        onAutoCreateSuccess={async () => {
          await loadData();
        }}
        onOpenFullEditorWithData={handleOpenFullEditorWithData}
      />

      {/* QUICK CATEGORY CREATION POPUP MODAL */}
      {isQuickCategoryModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-2xl w-full max-w-md my-auto overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b-2 border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Thêm Danh Mục Mới</h3>
                  <p className="text-xs text-slate-500">Tạo danh mục để phân loại template portfolio</p>
                </div>
              </div>
              <button 
                onClick={() => setIsQuickCategoryModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-200/70 hover:bg-slate-300 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickCreateCategory} className="p-5 space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tên danh mục *
                </label>
                <Input
                  placeholder="Ví dụ: Fashion Designer, AI Engineer, 3D Artist..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  autoFocus
                  required
                  className="rounded-xl border-2 border-slate-200 shadow-none font-bold text-[14px] placeholder:text-[14px]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mô tả danh mục (tùy chọn)
                </label>
                <textarea
                  rows={2}
                  placeholder="Mô tả phong cách hoặc đối tượng ngành nghề..."
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  className="w-full p-2.5 bg-white border-2 border-slate-200 rounded-xl text-[14px] placeholder:text-[14px] font-medium text-slate-800 outline-none shadow-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsQuickCategoryModalOpen(false)}
                  className="text-slate-600 font-bold text-xs rounded-xl border-2 border-slate-300 hover:bg-slate-100"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isCreatingCategory || !newCategoryName.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl gap-1.5 shadow-md border-2 border-indigo-600"
                >
                  {isCreatingCategory ? <Loading size={14} /> : <Check className="w-3.5 h-3.5 text-white" />}
                  {isCreatingCategory ? 'Đang tạo...' : 'Lưu Danh Mục'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
