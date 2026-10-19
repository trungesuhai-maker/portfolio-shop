import { useState, useEffect, useMemo } from 'react';
import { api } from '@/src/services/api';
import { Category, Template } from '@/src/types';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Loading } from '@/src/components/ui/Loading';
import { Plus, Trash2, FolderTree, Tag, Hash, X, Edit2, Search, Database, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state (create or edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', icon: 'FolderTree' });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, tpls] = await Promise.all([
        api.categories.list(),
        api.templates.list('all')
      ]);
      setCategories(cats);
      setTemplates(tpls);
    } catch (e) {
      toast.error('Không thể tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', slug: '', description: '', icon: 'FolderTree' });
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      icon: cat.icon || 'FolderTree'
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên danh mục');
      return;
    }

    setSaving(true);
    try {
      const slug = formData.slug.trim() || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      if (editingCategory) {
        // Update existing
        await api.categories.update(editingCategory.id, {
          name: formData.name.trim(),
          slug,
          description: formData.description.trim(),
          icon: formData.icon
        });
        toast.success(`Đã cập nhật danh mục "${formData.name}" (Đã lưu vĩnh viễn vào bộ nhớ)`);
      } else {
        // Create new
        await api.categories.create({
          name: formData.name.trim(),
          slug,
          description: formData.description.trim() || `Portfolio mẫu cho nhóm ${formData.name}`,
          icon: formData.icon
        });
        toast.success(`Đã tạo danh mục mới "${formData.name}" (Đã lưu vĩnh viễn vào hệ thống)`);
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Không thể lưu danh mục');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const attachedCount = templates.filter(t => t.categoryId === id).length;
    if (attachedCount > 0) {
      if (!window.confirm(`Cảnh báo: Có ${attachedCount} template đang thuộc danh mục này. Bạn vẫn muốn xóa danh mục "${name}"?`)) return;
    } else if (!window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${name}"?`)) {
      return;
    }

    try {
      await api.categories.delete(id);
      toast.success(`Đã xóa danh mục "${name}"`);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      toast.error('Không thể xóa danh mục');
    }
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.slug.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Phân loại Danh mục</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              Lưu trữ vĩnh viễn (Data Persistent)
            </span>
          </div>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Quản lý và tổ chức các danh mục Portfolio. Toàn bộ danh mục được lưu trữ bền vững trên ổ đĩa và Cloud, không bị mất khi khởi động lại máy chủ.
          </p>
        </div>
        <Button onClick={openCreateModal} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm md:text-base rounded-[12px] shadow-[0_2px_3px_0_rgba(0,0,0,0.25)] border-2 border-indigo-600 [&_svg]:text-white">
          <Plus className="w-4 h-4 text-white" /> Thêm Danh mục Mới
        </Button>
      </div>

      {/* SEARCH AND STATS BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-[12px] border-2 border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Tìm kiếm danh mục theo tên, slug, mô tả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-sm rounded-[10px] border-slate-200"
          />
        </div>
        <div className="text-xs font-bold text-slate-500 flex items-center gap-3 px-2">
          <span>Tổng số: <strong className="text-indigo-600 font-extrabold">{categories.length}</strong> danh mục</span>
          <span>•</span>
          <span>Tổng số mẫu: <strong className="text-indigo-600 font-extrabold">{templates.length}</strong> templates</span>
        </div>
      </div>

      <Card className="bg-white border-2 border-slate-200 shadow-none rounded-[12px] overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center"><Loading /></div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <FolderTree className="w-6 h-6" />
            </div>
            <p className="text-slate-600 font-bold text-base">Không tìm thấy danh mục nào</p>
            <p className="text-slate-400 text-sm mt-1">Thử đổi từ khóa tìm kiếm hoặc nhấn Thêm Danh mục</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-slate-100 bg-slate-50/50 text-slate-600 text-sm font-bold">
                  <th className="py-3.5 px-4">Tên Danh mục</th>
                  <th className="py-3.5 px-4">Đường dẫn (Slug)</th>
                  <th className="py-3.5 px-4">Mô tả</th>
                  <th className="py-3.5 px-4 text-center">Số Template</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCategories.map((cat) => {
                  const count = templates.filter(t => t.categoryId === cat.id).length;
                  return (
                    <tr key={cat.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                            <FolderTree className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-sm block">{cat.name}</span>
                            <span className="text-[11px] font-mono text-slate-400">ID: {cat.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-sm text-indigo-600 font-medium">
                        /{cat.slug}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-sm max-w-xs truncate" title={cat.description}>
                        {cat.description || <span className="text-slate-400 italic">Chưa có mô tả</span>}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                          {count} templates
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openEditModal(cat)}
                            className="p-2 rounded-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all inline-flex items-center justify-center"
                            title="Chỉnh sửa danh mục"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(cat.id, cat.name)}
                            className="p-2 rounded-[10px] bg-red-600 hover:bg-red-700 text-white border border-red-600 shadow-sm transition-all inline-flex items-center justify-center"
                            title="Xóa danh mục"
                          >
                            <Trash2 className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-[16px] border-2 border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b-2 border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {editingCategory ? `Chỉnh sửa Danh mục: ${editingCategory.name}` : 'Thêm Danh mục Mới'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase mb-1.5">Tên danh mục *</label>
                <Input 
                  placeholder="Ví dụ: Nghệ thuật & Nhiếp ảnh (Art & Photo)" 
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      name,
                      slug: editingCategory ? prev.slug : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                    }));
                  }}
                  required
                  className="text-sm md:text-base rounded-[12px] border-2 border-slate-200 shadow-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase mb-1.5">Đường dẫn tĩnh (Slug) *</label>
                <Input 
                  placeholder="vi-du: nghe-thuat-nhiep-anh" 
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  required
                  className="text-sm md:text-base rounded-[12px] border-2 border-slate-200 shadow-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase mb-1.5">Mô tả danh mục</label>
                <Input 
                  placeholder="Ví dụ: Bộ sưu tập template dành cho các nhiếp ảnh gia và nghệ sĩ thị giác..." 
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="text-sm md:text-base rounded-[12px] border-2 border-slate-200 shadow-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="text-indigo-600 font-bold text-sm md:text-base rounded-[12px] shadow-none border-2 border-indigo-600 bg-white hover:bg-indigo-50 [&_svg]:text-indigo-600">
                  Hủy
                </Button>
                <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm md:text-base rounded-[12px] shadow-[0_2px_3px_0_rgba(0,0,0,0.25)] border-2 border-indigo-600 [&_svg]:text-white">
                  {saving ? <Loading /> : (editingCategory ? 'Lưu Thay Đổi' : 'Tạo Danh Mục')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
