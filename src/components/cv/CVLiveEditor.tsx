import { useState, useRef, useEffect } from 'react';
import { 
  Download, 
  Printer, 
  Globe, 
  ArrowUpDown, 
  Plus, 
  Trash2, 
  Camera, 
  Check, 
  Sparkles, 
  Save, 
  RotateCcw, 
  ChevronUp, 
  ChevronDown, 
  X, 
  Layers, 
  Upload, 
  Briefcase, 
  GraduationCap, 
  Wrench, 
  Languages as LangIcon, 
  Award, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Link as LinkIcon, 
  FolderGit2, 
  Maximize2, 
  Minimize2,
  HelpCircle
} from 'lucide-react';
import { CVDocument, ToolItem, SkillItem, ExperienceItem, EducationItem, ProjectItem, LanguageItem, CertificationItem } from '@/src/types/cv';
import { POPULAR_TOOLS, PopularToolDef } from '@/src/data/popularTools';
import { SUPPORTED_LANGUAGES, translateCV } from '@/src/utils/cvTranslator';
import { downloadCVHTML } from '@/src/utils/cvExporter';
import { toast } from 'sonner';

interface CVLiveEditorProps {
  initialCv: CVDocument;
  onSave?: (updatedCv: CVDocument) => void;
  onClose?: () => void;
}

export function CVLiveEditor({ initialCv, onSave, onClose }: CVLiveEditorProps) {
  const [cv, setCv] = useState<CVDocument>(() => {
    // deep clone to avoid modifying parent prematurely
    return JSON.parse(JSON.stringify(initialCv));
  });

  const [selectedLang, setSelectedLang] = useState<string>('vi');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [showToolModal, setShowToolModal] = useState<boolean>(false);
  const [toolModalTab, setToolModalTab] = useState<'preset' | 'custom'>('preset');
  const [toolSearch, setToolSearch] = useState<string>('');
  const [selectedToolCategory, setSelectedToolCategory] = useState<string>('all');
  const [customToolName, setCustomToolName] = useState<string>('');
  const [customToolLogoUrl, setCustomToolLogoUrl] = useState<string>('');
  const [customToolLevel, setCustomToolLevel] = useState<string>('Thành thạo');
  const [showLayoutModal, setShowLayoutModal] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showAvatarModal, setShowAvatarModal] = useState<boolean>(false);
  const [avatarInputUrl, setAvatarInputUrl] = useState<string>('');
  const [avatarUploadLoading, setAvatarUploadLoading] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const toolLogoInputRef = useRef<HTMLInputElement>(null);

  // Sync when initialCv changes
  useEffect(() => {
    if (initialCv) {
      setCv(JSON.parse(JSON.stringify(initialCv)));
    }
  }, [initialCv]);

  // Handle generic text change
  const updatePersonalInfo = (field: keyof CVDocument['personalInfo'], val: string) => {
    setCv(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: val
      }
    }));
  };

  const updateSectionTitle = (sectionKey: keyof CVDocument['sectionTitles'], newTitle: string) => {
    setCv(prev => ({
      ...prev,
      sectionTitles: {
        ...prev.sectionTitles,
        [sectionKey]: newTitle
      }
    }));
  };

  // REORDERING
  const moveSidebarSection = (index: number, direction: 'up' | 'down') => {
    setCv(prev => {
      const list = [...prev.layoutOrder.sidebar];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= list.length) return prev;
      const temp = list[index];
      list[index] = list[targetIndex];
      list[targetIndex] = temp;
      return {
        ...prev,
        layoutOrder: {
          ...prev.layoutOrder,
          sidebar: list
        }
      };
    });
    toast.success('Đã cập nhật vị trí phần hiển thị');
  };

  const moveMainSection = (index: number, direction: 'up' | 'down') => {
    setCv(prev => {
      const list = [...prev.layoutOrder.main];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= list.length) return prev;
      const temp = list[index];
      list[index] = list[targetIndex];
      list[targetIndex] = temp;
      return {
        ...prev,
        layoutOrder: {
          ...prev.layoutOrder,
          main: list
        }
      };
    });
    toast.success('Đã cập nhật vị trí phần hiển thị');
  };

  // TRANSLATION
  const handleTranslate = (langCode: string) => {
    setIsTranslating(true);
    try {
      const translated = translateCV(cv, langCode);
      setCv(translated);
      setSelectedLang(langCode);
      const langObj = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
      toast.success(`Đã dịch CV sang ${langObj ? langObj.name : langCode} thành công!`);
    } catch {
      toast.error('Lỗi khi chuyển ngữ CV');
    } finally {
      setIsTranslating(false);
    }
  };

  // AVATAR UPLOAD
  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn tệp hình ảnh (PNG, JPG, WebP)');
      return;
    }

    setAvatarUploadLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      try {
        // Try uploading to server
        const res = await fetch('/api/storage/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileData: base64Data,
            fileType: file.type,
            uploadedBy: 'admin-cv'
          })
        });

        if (res.ok) {
          const data = await res.json();
          updatePersonalInfo('avatar', data.url || base64Data);
          toast.success('Đã tải ảnh đại diện lên thành công!');
        } else {
          // Fallback to local base64
          updatePersonalInfo('avatar', base64Data);
          toast.success('Đã cập nhật ảnh đại diện!');
        }
      } catch {
        updatePersonalInfo('avatar', base64Data);
        toast.success('Đã cập nhật ảnh đại diện!');
      } finally {
        setAvatarUploadLoading(false);
        setShowAvatarModal(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // CUSTOM TOOL LOGO UPLOAD
  const handleToolLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCustomToolLogoUrl(reader.result as string);
      toast.success('Đã tải logo công cụ!');
    };
    reader.readAsDataURL(file);
  };

  // ADD TOOL FROM PRESET
  const handleAddPresetTool = (preset: PopularToolDef) => {
    const alreadyExists = cv.tools.some(t => t.name.toLowerCase() === preset.name.toLowerCase());
    if (alreadyExists) {
      toast.error(`Công cụ ${preset.name} đã có trong CV`);
      return;
    }

    const newTool: ToolItem = {
      id: `tool-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: preset.name,
      iconName: preset.id,
      category: preset.category,
      level: 'Thành thạo'
    };

    setCv(prev => ({
      ...prev,
      tools: [...prev.tools, newTool]
    }));
    toast.success(`Đã thêm ${preset.name} vào CV!`);
  };

  // ADD CUSTOM TOOL
  const handleAddCustomTool = () => {
    if (!customToolName.trim()) {
      toast.error('Vui lòng nhập tên công cụ / phần mềm');
      return;
    }

    const newTool: ToolItem = {
      id: `tool-custom-${Date.now()}`,
      name: customToolName.trim(),
      logoUrl: customToolLogoUrl || undefined,
      category: 'custom',
      level: customToolLevel
    };

    setCv(prev => ({
      ...prev,
      tools: [...prev.tools, newTool]
    }));

    setCustomToolName('');
    setCustomToolLogoUrl('');
    setShowToolModal(false);
    toast.success(`Đã thêm công cụ "${newTool.name}" vào CV!`);
  };

  // DELETE TOOL
  const handleDeleteTool = (toolId: string) => {
    setCv(prev => ({
      ...prev,
      tools: prev.tools.filter(t => t.id !== toolId)
    }));
    toast.success('Đã xóa công cụ');
  };

  // SAVE CV
  const handleSaveCV = () => {
    const updated = {
      ...cv,
      updatedAt: new Date().toLocaleDateString('vi-VN')
    };
    setCv(updated);
    if (onSave) {
      onSave(updated);
    }
    // Also backup to localStorage
    try {
      localStorage.setItem(`cv_item_${cv.id}`, JSON.stringify(updated));
    } catch {
      // ignore storage error
    }
    toast.success('Đã lưu mọi thay đổi của CV thành công!');
  };

  // PRINT / EXPORT PDF
  const handlePrintPDF = () => {
    window.print();
  };

  // DOWNLOAD HTML
  const handleDownloadHTML = () => {
    downloadCVHTML(cv);
    toast.success('Đã xuất và tải xuống tệp HTML của CV thành công!');
  };

  // Filter preset tools
  const filteredPresetTools = POPULAR_TOOLS.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(toolSearch.toLowerCase());
    const matchesCat = selectedToolCategory === 'all' || tool.category === selectedToolCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className={`flex flex-col bg-slate-900 text-slate-100 min-h-screen ${isFullscreen ? 'fixed inset-0 z-50 overflow-y-auto' : ''}`}>
      {/* TOP CONTROLS & ACTION BAR */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left info & Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-xl">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base">Studio Biên Tập & Tạo CV Chuẩn 100%</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                  Chỉnh Sửa Trực Tiếp
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Nhấp chuột vào bất kỳ chữ, tiêu đề hoặc ảnh nào để sửa trực tiếp • Tự động giữ layout hoàn hảo
              </p>
            </div>
          </div>

          {/* Center: Language Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl p-1 shadow-inner">
            <div className="flex items-center gap-1 px-2 text-xs text-slate-400 font-medium">
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>Dịch sang:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {SUPPORTED_LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => handleTranslate(lang.code)}
                  disabled={isTranslating}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    selectedLang === lang.code
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title={`Dịch toàn bộ CV sang ${lang.name}`}
                >
                  <span>{lang.flag}</span>
                  <span className="hidden sm:inline">{lang.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Reorder Layout Button */}
            <button
              onClick={() => setShowLayoutModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
              title="Sắp xếp thứ tự các mục"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
              <span>Bố cục</span>
            </button>

            {/* Print / PDF Button */}
            <button
              onClick={handlePrintPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
              title="In hoặc Lưu PDF"
            >
              <Printer className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">In / PDF</span>
            </button>

            {/* DOWNLOAD HTML (Crucial user request!) */}
            <button
              onClick={handleDownloadHTML}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg shadow-md shadow-emerald-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Tải xuống tệp HTML đầy đủ"
            >
              <Download className="w-4 h-4" />
              <span>Tải HTML</span>
            </button>

            {/* Save Button */}
            <button
              onClick={handleSaveCV}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-lg shadow-md shadow-sky-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              <span>Lưu CV</span>
            </button>

            {/* Fullscreen toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1"
                title="Đóng trình biên tập"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* WORKSPACE PREVIEW CONTAINER */}
      <div className="flex-1 p-4 md:p-8 bg-slate-950 flex justify-center items-start overflow-x-auto">
        {/* CV PAPER CONTAINER (A4 standard proportion) */}
        <div 
          id="cv-printable-document"
          className="w-full max-w-[920px] bg-white text-slate-900 shadow-2xl rounded-xl overflow-hidden flex flex-col md:flex-row min-h-[1250px] border border-slate-200 transition-all"
        >
          {/* ========================================================= */}
          {/* LEFT SIDEBAR COLUMN (DARK NAVY / SLATE #0f172a) */}
          {/* ========================================================= */}
          <aside className="w-full md:w-[36%] bg-[#0f172a] text-slate-200 p-6 md:p-8 flex flex-col gap-6 relative select-text border-r border-slate-800">
            {/* AVATAR WRAPPER WITH DIRECT UPLOAD ON CLICK */}
            <div className="relative group text-center flex flex-col items-center">
              <div className="relative inline-block">
                <img
                  src={cv.personalInfo.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face'}
                  alt={cv.personalInfo.fullName}
                  className="w-36 h-36 rounded-full object-cover border-4 border-slate-700 shadow-xl transition-transform group-hover:scale-[1.02]"
                />
                <button
                  onClick={() => setShowAvatarModal(true)}
                  className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 backdrop-blur-xs cursor-pointer"
                  title="Thay đổi ảnh đại diện"
                >
                  <Camera className="w-6 h-6 text-sky-400" />
                  <span className="text-[11px] font-semibold">Đổi ảnh</span>
                </button>
              </div>

              {/* Quick candidate name in sidebar for mobile */}
              <div className="md:hidden mt-3 text-center">
                <h1 className="text-xl font-bold text-white uppercase">{cv.personalInfo.fullName}</h1>
                <p className="text-xs text-sky-400 font-semibold tracking-wider">{cv.personalInfo.jobTitle}</p>
              </div>
            </div>

            {/* DYNAMIC SIDEBAR SECTIONS ACCORDING TO layoutOrder.sidebar */}
            {cv.layoutOrder.sidebar.map((sectionKey, sectionIdx) => {
              if (sectionKey === 'contact') {
                return (
                  <div key="contact" className="group/section relative flex flex-col gap-3">
                    {/* Reorder Buttons & Editable Title */}
                    <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
                      <input
                        type="text"
                        value={cv.sectionTitles.contact}
                        onChange={(e) => updateSectionTitle('contact', e.target.value)}
                        className="bg-transparent text-xs font-bold uppercase tracking-wider text-sky-400 hover:bg-slate-800/60 focus:bg-slate-800 focus:ring-1 focus:ring-sky-500 rounded px-1.5 py-0.5 transition-colors w-full outline-hidden"
                        title="Nhấp để đổi tiêu đề"
                      />
                      <div className="opacity-0 group-hover/section:opacity-100 flex items-center gap-0.5 transition-opacity">
                        <button
                          onClick={() => moveSidebarSection(sectionIdx, 'up')}
                          disabled={sectionIdx === 0}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800"
                          title="Di chuyển lên"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveSidebarSection(sectionIdx, 'down')}
                          disabled={sectionIdx === cv.layoutOrder.sidebar.length - 1}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800"
                          title="Di chuyển xuống"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Contact fields - editable */}
                    <div className="flex flex-col gap-2.5 text-xs text-slate-300">
                      {/* Email */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-sky-400 shrink-0">
                          <Mail className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type="text"
                          value={cv.personalInfo.email}
                          onChange={(e) => updatePersonalInfo('email', e.target.value)}
                          className="bg-transparent hover:bg-slate-800/60 focus:bg-slate-800 focus:ring-1 focus:ring-sky-500 rounded px-1.5 py-0.5 w-full outline-hidden text-slate-200"
                          placeholder="email@example.com"
                        />
                      </div>

                      {/* Phone */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-sky-400 shrink-0">
                          <Phone className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type="text"
                          value={cv.personalInfo.phone}
                          onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                          className="bg-transparent hover:bg-slate-800/60 focus:bg-slate-800 focus:ring-1 focus:ring-sky-500 rounded px-1.5 py-0.5 w-full outline-hidden text-slate-200"
                          placeholder="0912 345 678"
                        />
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-sky-400 shrink-0">
                          <MapPin className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type="text"
                          value={cv.personalInfo.location}
                          onChange={(e) => updatePersonalInfo('location', e.target.value)}
                          className="bg-transparent hover:bg-slate-800/60 focus:bg-slate-800 focus:ring-1 focus:ring-sky-500 rounded px-1.5 py-0.5 w-full outline-hidden text-slate-200"
                          placeholder="Hà Nội, Việt Nam"
                        />
                      </div>

                      {/* Website */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-sky-400 shrink-0">
                          <LinkIcon className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type="text"
                          value={cv.personalInfo.website}
                          onChange={(e) => updatePersonalInfo('website', e.target.value)}
                          className="bg-transparent hover:bg-slate-800/60 focus:bg-slate-800 focus:ring-1 focus:ring-sky-500 rounded px-1.5 py-0.5 w-full outline-hidden text-slate-200"
                          placeholder="portfolio.me"
                        />
                      </div>

                      {/* LinkedIn */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-sky-400 shrink-0 font-bold text-[10px]">
                          in
                        </div>
                        <input
                          type="text"
                          value={cv.personalInfo.linkedin || ''}
                          onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                          className="bg-transparent hover:bg-slate-800/60 focus:bg-slate-800 focus:ring-1 focus:ring-sky-500 rounded px-1.5 py-0.5 w-full outline-hidden text-slate-200"
                          placeholder="linkedin.com/in/username"
                        />
                      </div>
                    </div>
                  </div>
                );
              }

              if (sectionKey === 'profile') {
                return (
                  <div key="profile" className="group/section relative flex flex-col gap-2">
                    <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
                      <input
                        type="text"
                        value={cv.sectionTitles.profile}
                        onChange={(e) => updateSectionTitle('profile', e.target.value)}
                        className="bg-transparent text-xs font-bold uppercase tracking-wider text-sky-400 hover:bg-slate-800/60 focus:bg-slate-800 focus:ring-1 focus:ring-sky-500 rounded px-1.5 py-0.5 transition-colors w-full outline-hidden"
                      />
                      <div className="opacity-0 group-hover/section:opacity-100 flex items-center gap-0.5 transition-opacity">
                        <button
                          onClick={() => moveSidebarSection(sectionIdx, 'up')}
                          disabled={sectionIdx === 0}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveSidebarSection(sectionIdx, 'down')}
                          disabled={sectionIdx === cv.layoutOrder.sidebar.length - 1}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <textarea
                      value={cv.profileSummary}
                      onChange={(e) => setCv(prev => ({ ...prev, profileSummary: e.target.value }))}
                      rows={5}
                      className="w-full text-xs text-slate-300 leading-relaxed bg-transparent hover:bg-slate-800/60 focus:bg-slate-800 focus:ring-1 focus:ring-sky-500 rounded p-1.5 outline-hidden resize-none"
                      placeholder="Mô tả tóm tắt kinh nghiệm bản thân..."
                    />
                  </div>
                );
              }

              if (sectionKey === 'skills') {
                return (
                  <div key="skills" className="group/section relative flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
                      <input
                        type="text"
                        value={cv.sectionTitles.skills}
                        onChange={(e) => updateSectionTitle('skills', e.target.value)}
                        className="bg-transparent text-xs font-bold uppercase tracking-wider text-sky-400 hover:bg-slate-800/60 focus:bg-slate-800 focus:ring-1 focus:ring-sky-500 rounded px-1.5 py-0.5 transition-colors w-full outline-hidden"
                      />
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            const newSkill: SkillItem = {
                              id: `skill-${Date.now()}`,
                              name: 'Kỹ năng mới',
                              level: 85
                            };
                            setCv(prev => ({ ...prev, skills: [...prev.skills, newSkill] }));
                          }}
                          className="p-1 text-sky-400 hover:text-white hover:bg-slate-800 rounded"
                          title="Thêm kỹ năng mới"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <div className="opacity-0 group-hover/section:opacity-100 flex items-center gap-0.5 transition-opacity">
                          <button
                            onClick={() => moveSidebarSection(sectionIdx, 'up')}
                            disabled={sectionIdx === 0}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveSidebarSection(sectionIdx, 'down')}
                            disabled={sectionIdx === cv.layoutOrder.sidebar.length - 1}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Skill items */}
                    <div className="flex flex-col gap-3">
                      {cv.skills.map((skill, sIdx) => (
                        <div key={skill.id} className="group/item flex flex-col gap-1 text-xs">
                          <div className="flex items-center justify-between">
                            <input
                              type="text"
                              value={skill.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCv(prev => ({
                                  ...prev,
                                  skills: prev.skills.map((s, idx) => idx === sIdx ? { ...s, name: val } : s)
                                }));
                              }}
                              className="bg-transparent hover:bg-slate-800/60 focus:bg-slate-800 focus:ring-1 focus:ring-sky-500 rounded px-1 py-0.5 outline-hidden text-slate-100 font-medium"
                            />
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={skill.level}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  setCv(prev => ({
                                    ...prev,
                                    skills: prev.skills.map((s, idx) => idx === sIdx ? { ...s, level: val } : s)
                                  }));
                                }}
                                className="w-10 text-right bg-transparent text-sky-400 font-semibold hover:bg-slate-800 rounded px-1 py-0.5 outline-hidden text-[11px]"
                              />
                              <span className="text-[10px] text-sky-400 -ml-1.5">%</span>
                              <button
                                onClick={() => {
                                  setCv(prev => ({
                                    ...prev,
                                    skills: prev.skills.filter((_, idx) => idx !== sIdx)
                                  }));
                                }}
                                className="opacity-0 group-hover/item:opacity-100 text-rose-400 hover:text-rose-300 p-0.5"
                                title="Xóa kỹ năng"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-sky-400 to-indigo-500 h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, Math.max(0, skill.level))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              if (sectionKey === 'languages') {
                return (
                  <div key="languages" className="group/section relative flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
                      <input
                        type="text"
                        value={cv.sectionTitles.languages}
                        onChange={(e) => updateSectionTitle('languages', e.target.value)}
                        className="bg-transparent text-xs font-bold uppercase tracking-wider text-sky-400 hover:bg-slate-800/60 focus:bg-slate-800 focus:ring-1 focus:ring-sky-500 rounded px-1.5 py-0.5 transition-colors w-full outline-hidden"
                      />
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            const newLang: LanguageItem = {
                              id: `lang-${Date.now()}`,
                              name: 'Ngoại ngữ mới',
                              level: 'Giao tiếp tốt',
                              proficiency: 4
                            };
                            setCv(prev => ({ ...prev, languages: [...prev.languages, newLang] }));
                          }}
                          className="p-1 text-sky-400 hover:text-white hover:bg-slate-800 rounded"
                          title="Thêm ngoại ngữ"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <div className="opacity-0 group-hover/section:opacity-100 flex items-center gap-0.5 transition-opacity">
                          <button
                            onClick={() => moveSidebarSection(sectionIdx, 'up')}
                            disabled={sectionIdx === 0}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveSidebarSection(sectionIdx, 'down')}
                            disabled={sectionIdx === cv.layoutOrder.sidebar.length - 1}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {cv.languages.map((lang, lIdx) => (
                        <div key={lang.id} className="group/item flex items-center justify-between text-xs">
                          <div className="flex flex-col">
                            <input
                              type="text"
                              value={lang.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCv(prev => ({
                                  ...prev,
                                  languages: prev.languages.map((l, idx) => idx === lIdx ? { ...l, name: val } : l)
                                }));
                              }}
                              className="bg-transparent hover:bg-slate-800/60 focus:bg-slate-800 focus:ring-1 focus:ring-sky-500 rounded px-1 py-0.5 outline-hidden text-slate-100 font-semibold text-xs"
                            />
                            <input
                              type="text"
                              value={lang.level}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCv(prev => ({
                                  ...prev,
                                  languages: prev.languages.map((l, idx) => idx === lIdx ? { ...l, level: val } : l)
                                }));
                              }}
                              className="bg-transparent hover:bg-slate-800/60 focus:bg-slate-800 focus:ring-1 focus:ring-sky-500 rounded px-1 py-0.5 outline-hidden text-slate-400 text-[11px]"
                            />
                          </div>

                          <div className="flex items-center gap-1">
                            <div className="flex gap-0.5 text-amber-400 cursor-pointer">
                              {[1, 2, 3, 4, 5].map(star => (
                                <span
                                  key={star}
                                  onClick={() => {
                                    setCv(prev => ({
                                      ...prev,
                                      languages: prev.languages.map((l, idx) => idx === lIdx ? { ...l, proficiency: star } : l)
                                    }));
                                  }}
                                  className={star <= lang.proficiency ? 'text-amber-400' : 'text-slate-700'}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            <button
                              onClick={() => {
                                setCv(prev => ({
                                  ...prev,
                                  languages: prev.languages.filter((_, idx) => idx !== lIdx)
                                }));
                              }}
                              className="opacity-0 group-hover/item:opacity-100 text-rose-400 hover:text-rose-300 p-0.5 ml-1"
                              title="Xóa ngoại ngữ"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              if (sectionKey === 'certifications') {
                return (
                  <div key="certifications" className="group/section relative flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
                      <input
                        type="text"
                        value={cv.sectionTitles.certifications}
                        onChange={(e) => updateSectionTitle('certifications', e.target.value)}
                        className="bg-transparent text-xs font-bold uppercase tracking-wider text-sky-400 hover:bg-slate-800/60 focus:bg-slate-800 focus:ring-1 focus:ring-sky-500 rounded px-1.5 py-0.5 transition-colors w-full outline-hidden"
                      />
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            const newCert: CertificationItem = {
                              id: `cert-${Date.now()}`,
                              name: 'Chứng chỉ chuyên môn',
                              issuer: 'Tổ chức cấp',
                              year: '2026'
                            };
                            setCv(prev => ({ ...prev, certifications: [...prev.certifications, newCert] }));
                          }}
                          className="p-1 text-sky-400 hover:text-white hover:bg-slate-800 rounded"
                          title="Thêm chứng chỉ"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <div className="opacity-0 group-hover/section:opacity-100 flex items-center gap-0.5 transition-opacity">
                          <button
                            onClick={() => moveSidebarSection(sectionIdx, 'up')}
                            disabled={sectionIdx === 0}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveSidebarSection(sectionIdx, 'down')}
                            disabled={sectionIdx === cv.layoutOrder.sidebar.length - 1}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {cv.certifications.map((cert, cIdx) => (
                        <div key={cert.id} className="group/item flex flex-col text-xs bg-slate-800/40 p-2 rounded border border-slate-800">
                          <div className="flex items-center justify-between">
                            <input
                              type="text"
                              value={cert.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCv(prev => ({
                                  ...prev,
                                  certifications: prev.certifications.map((c, idx) => idx === cIdx ? { ...c, name: val } : c)
                                }));
                              }}
                              className="bg-transparent hover:bg-slate-800 focus:bg-slate-800 rounded px-1 py-0.5 outline-hidden text-slate-100 font-semibold text-xs w-full"
                            />
                            <button
                              onClick={() => {
                                setCv(prev => ({
                                  ...prev,
                                  certifications: prev.certifications.filter((_, idx) => idx !== cIdx)
                                }));
                              }}
                              className="opacity-0 group-hover/item:opacity-100 text-rose-400 hover:text-rose-300 p-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex gap-2 text-[11px] text-slate-400">
                            <input
                              type="text"
                              value={cert.issuer}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCv(prev => ({
                                  ...prev,
                                  certifications: prev.certifications.map((c, idx) => idx === cIdx ? { ...c, issuer: val } : c)
                                }));
                              }}
                              className="bg-transparent hover:bg-slate-800 rounded px-1 py-0.5 outline-hidden text-slate-400 text-[11px] w-2/3"
                            />
                            <input
                              type="text"
                              value={cert.year}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCv(prev => ({
                                  ...prev,
                                  certifications: prev.certifications.map((c, idx) => idx === cIdx ? { ...c, year: val } : c)
                                }));
                              }}
                              className="bg-transparent hover:bg-slate-800 rounded px-1 py-0.5 outline-hidden text-slate-400 text-[11px] w-1/3 text-right"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </aside>

          {/* ========================================================= */}
          {/* RIGHT MAIN CONTENT COLUMN (CRISP WHITE / SLATE #ffffff) */}
          {/* ========================================================= */}
          <main className="w-full md:w-[64%] bg-white p-6 md:p-10 flex flex-col gap-7 select-text">
            {/* CANDIDATE NAME & JOB TITLE HEADER BANNER */}
            <header className="border-b-2 border-slate-100 pb-5">
              <input
                type="text"
                value={cv.personalInfo.fullName}
                onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
                className="w-full text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-slate-50 focus:ring-2 focus:ring-sky-500 rounded px-2 py-1 outline-hidden"
                placeholder="HỌ VÀ TÊN ỨNG VIÊN"
                title="Nhấp để đổi họ tên"
              />
              <input
                type="text"
                value={cv.personalInfo.jobTitle}
                onChange={(e) => updatePersonalInfo('jobTitle', e.target.value)}
                className="w-full text-sm sm:text-base font-bold uppercase tracking-widest text-sky-600 bg-transparent hover:bg-slate-50 focus:bg-slate-50 focus:ring-2 focus:ring-sky-500 rounded px-2 py-0.5 outline-hidden mt-1"
                placeholder="VỊ TRÍ / CHỨC DANH ỨNG TUYỂN"
                title="Nhấp để đổi chức danh"
              />
            </header>

            {/* DYNAMIC MAIN SECTIONS ACCORDING TO layoutOrder.main */}
            {cv.layoutOrder.main.map((sectionKey, sectionIdx) => {
              // 1. WORK EXPERIENCE
              if (sectionKey === 'experience') {
                return (
                  <section key="experience" className="group/section flex flex-col gap-4">
                    {/* Section Header */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-4.5 bg-sky-600 rounded-xs" />
                        <input
                          type="text"
                          value={cv.sectionTitles.experience}
                          onChange={(e) => updateSectionTitle('experience', e.target.value)}
                          className="bg-transparent text-sm font-extrabold uppercase tracking-wider text-slate-900 hover:bg-slate-100 focus:bg-slate-100 focus:ring-1 focus:ring-sky-500 rounded px-1.5 py-0.5 outline-hidden"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            const newExp: ExperienceItem = {
                              id: `exp-${Date.now()}`,
                              role: 'Chức danh công việc mới',
                              company: 'Tên công ty / Tập đoàn',
                              period: '2024 - HIỆN TẠI',
                              location: 'TP. Hồ Chí Minh',
                              description: 'Mô tả tóm tắt trách nhiệm chính...',
                              bullets: [
                                'Thành tựu hoặc đóng góp nổi bật thứ nhất',
                                'Thành tựu hoặc đóng góp nổi bật thứ hai'
                              ]
                            };
                            setCv(prev => ({ ...prev, experiences: [newExp, ...prev.experiences] }));
                            toast.success('Đã thêm một mục kinh nghiệm làm việc');
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-sky-600 hover:bg-sky-50 rounded transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm vị trí</span>
                        </button>
                        <div className="opacity-0 group-hover/section:opacity-100 flex items-center gap-0.5 transition-opacity">
                          <button
                            onClick={() => moveMainSection(sectionIdx, 'up')}
                            disabled={sectionIdx === 0}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveMainSection(sectionIdx, 'down')}
                            disabled={sectionIdx === cv.layoutOrder.main.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Timeline list */}
                    <div className="relative pl-5 border-l-2 border-slate-200 flex flex-col gap-6">
                      {cv.experiences.map((exp, eIdx) => (
                        <div key={exp.id} className="group/item relative flex flex-col gap-1.5 text-xs">
                          {/* Timeline dot */}
                          <div className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-sky-600 border-2 border-white shadow-xs" />

                          {/* Row 1: Role, Company, Period, Delete */}
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <input
                                type="text"
                                value={exp.role}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCv(prev => ({
                                    ...prev,
                                    experiences: prev.experiences.map((item, idx) => idx === eIdx ? { ...item, role: val } : item)
                                  }));
                                }}
                                className="font-bold text-slate-900 text-sm bg-transparent hover:bg-slate-100 focus:bg-slate-100 rounded px-1 py-0.5 outline-hidden"
                              />
                              <span className="text-slate-400 font-semibold">•</span>
                              <input
                                type="text"
                                value={exp.company}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCv(prev => ({
                                    ...prev,
                                    experiences: prev.experiences.map((item, idx) => idx === eIdx ? { ...item, company: val } : item)
                                  }));
                                }}
                                className="font-semibold text-slate-600 bg-transparent hover:bg-slate-100 focus:bg-slate-100 rounded px-1 py-0.5 outline-hidden"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={exp.period}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCv(prev => ({
                                    ...prev,
                                    experiences: prev.experiences.map((item, idx) => idx === eIdx ? { ...item, period: val } : item)
                                  }));
                                }}
                                className="font-bold text-sky-700 bg-sky-50 text-[11px] px-2 py-0.5 rounded border border-sky-100 outline-hidden"
                              />
                              <button
                                onClick={() => {
                                  setCv(prev => ({
                                    ...prev,
                                    experiences: prev.experiences.filter((_, idx) => idx !== eIdx)
                                  }));
                                }}
                                className="opacity-0 group-hover/item:opacity-100 text-rose-500 hover:text-rose-700 p-1"
                                title="Xóa vị trí kinh nghiệm này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Description */}
                          <textarea
                            value={exp.description}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCv(prev => ({
                                ...prev,
                                experiences: prev.experiences.map((item, idx) => idx === eIdx ? { ...item, description: val } : item)
                              }));
                            }}
                            rows={2}
                            className="w-full text-slate-600 leading-relaxed bg-transparent hover:bg-slate-50 focus:bg-slate-50 rounded p-1 outline-hidden resize-none"
                            placeholder="Mô tả công việc chung..."
                          />

                          {/* Bullets */}
                          <div className="flex flex-col gap-1 pl-2">
                            {exp.bullets.map((b, bIdx) => (
                              <div key={bIdx} className="group/bullet flex items-start gap-1.5">
                                <span className="text-sky-600 font-bold mt-0.5">•</span>
                                <input
                                  type="text"
                                  value={b}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setCv(prev => ({
                                      ...prev,
                                      experiences: prev.experiences.map((item, idx) => {
                                        if (idx !== eIdx) return item;
                                        const newBullets = [...item.bullets];
                                        newBullets[bIdx] = val;
                                        return { ...item, bullets: newBullets };
                                      })
                                    }));
                                  }}
                                  className="w-full text-slate-700 text-xs bg-transparent hover:bg-slate-50 focus:bg-slate-50 rounded px-1 py-0.5 outline-hidden"
                                />
                                <button
                                  onClick={() => {
                                    setCv(prev => ({
                                      ...prev,
                                      experiences: prev.experiences.map((item, idx) => {
                                        if (idx !== eIdx) return item;
                                        return { ...item, bullets: item.bullets.filter((_, idxB) => idxB !== bIdx) };
                                      })
                                    }));
                                  }}
                                  className="opacity-0 group-hover/bullet:opacity-100 text-slate-400 hover:text-rose-500 p-0.5"
                                  title="Xóa ý này"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                setCv(prev => ({
                                  ...prev,
                                  experiences: prev.experiences.map((item, idx) => {
                                    if (idx !== eIdx) return item;
                                    return { ...item, bullets: [...item.bullets, 'Thành tựu hoặc kết quả đo lường mới'] };
                                  })
                                }));
                              }}
                              className="text-[11px] text-sky-600 hover:underline flex items-center gap-1 self-start mt-1 opacity-70 hover:opacity-100"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Thêm gạch đầu dòng</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              }

              // 2. TOOLS & TECHNOLOGIES (CRITICAL FEATURE!)
              if (sectionKey === 'tools') {
                return (
                  <section key="tools" className="group/section flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-4.5 bg-sky-600 rounded-xs" />
                        <input
                          type="text"
                          value={cv.sectionTitles.tools}
                          onChange={(e) => updateSectionTitle('tools', e.target.value)}
                          className="bg-transparent text-sm font-extrabold uppercase tracking-wider text-slate-900 hover:bg-slate-100 focus:bg-slate-100 focus:ring-1 focus:ring-sky-500 rounded px-1.5 py-0.5 outline-hidden"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        {/* THE ADD TOOL BUTTON OPENING PRESET & CUSTOM UPLOAD MODAL */}
                        <button
                          onClick={() => setShowToolModal(true)}
                          className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg border border-sky-200 shadow-2xs transition-all hover:scale-105"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm Công Cụ</span>
                        </button>
                        <div className="opacity-0 group-hover/section:opacity-100 flex items-center gap-0.5 transition-opacity">
                          <button
                            onClick={() => moveMainSection(sectionIdx, 'up')}
                            disabled={sectionIdx === 0}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveMainSection(sectionIdx, 'down')}
                            disabled={sectionIdx === cv.layoutOrder.main.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Tools badges grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                      {cv.tools.map((tool) => {
                        const preset = POPULAR_TOOLS.find(p => p.id === tool.iconName || p.name.toLowerCase() === tool.name.toLowerCase());
                        return (
                          <div 
                            key={tool.id} 
                            className="group/tool relative flex items-center gap-2.5 px-3 py-2 bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-xl transition-all shadow-2xs hover:shadow-xs"
                          >
                            {/* Logo */}
                            <div className="w-6 h-6 flex items-center justify-center shrink-0">
                              {preset ? (
                                <div className="w-5 h-5" dangerouslySetInnerHTML={{ __html: preset.iconSvg }} />
                              ) : tool.logoUrl ? (
                                <img src={tool.logoUrl} alt={tool.name} className="w-5 h-5 object-contain rounded" />
                              ) : (
                                <div className="w-5 h-5 rounded bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center">
                                  {tool.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>

                            {/* Tool info & editable name */}
                            <div className="flex flex-col min-w-0 flex-1">
                              <input
                                type="text"
                                value={tool.name}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCv(prev => ({
                                    ...prev,
                                    tools: prev.tools.map(t => t.id === tool.id ? { ...t, name: val } : t)
                                  }));
                                }}
                                className="text-xs font-bold text-slate-800 bg-transparent hover:bg-white rounded px-1 py-0.2 outline-hidden truncate"
                              />
                              {tool.level && (
                                <span className="text-[10px] text-slate-500 px-1 truncate">
                                  {tool.level}
                                </span>
                              )}
                            </div>

                            {/* Delete button */}
                            <button
                              onClick={() => handleDeleteTool(tool.id)}
                              className="opacity-0 group-hover/tool:opacity-100 text-rose-400 hover:text-rose-600 p-1 transition-opacity shrink-0"
                              title="Xóa công cụ này"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              }

              // 3. FEATURED PROJECTS
              if (sectionKey === 'projects') {
                return (
                  <section key="projects" className="group/section flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-4.5 bg-sky-600 rounded-xs" />
                        <input
                          type="text"
                          value={cv.sectionTitles.projects}
                          onChange={(e) => updateSectionTitle('projects', e.target.value)}
                          className="bg-transparent text-sm font-extrabold uppercase tracking-wider text-slate-900 hover:bg-slate-100 focus:bg-slate-100 focus:ring-1 focus:ring-sky-500 rounded px-1.5 py-0.5 outline-hidden"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            const newProj: ProjectItem = {
                              id: `proj-${Date.now()}`,
                              name: 'Tên Dự Án Mới',
                              role: 'Trưởng nhóm / Lead',
                              period: '2025 - 2026',
                              description: 'Mô tả giá trị dự án và kết quả đạt được...',
                              tags: ['React', 'Figma', 'Node.js']
                            };
                            setCv(prev => ({ ...prev, projects: [...prev.projects, newProj] }));
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-sky-600 hover:bg-sky-50 rounded"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm dự án</span>
                        </button>
                        <div className="opacity-0 group-hover/section:opacity-100 flex items-center gap-0.5 transition-opacity">
                          <button
                            onClick={() => moveMainSection(sectionIdx, 'up')}
                            disabled={sectionIdx === 0}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveMainSection(sectionIdx, 'down')}
                            disabled={sectionIdx === cv.layoutOrder.main.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      {cv.projects.map((proj, pIdx) => (
                        <div key={proj.id} className="group/item flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="flex items-center justify-between">
                            <input
                              type="text"
                              value={proj.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCv(prev => ({
                                  ...prev,
                                  projects: prev.projects.map((p, idx) => idx === pIdx ? { ...p, name: val } : p)
                                }));
                              }}
                              className="font-bold text-slate-900 text-xs bg-transparent hover:bg-white rounded px-1 py-0.5 outline-hidden flex-1"
                            />
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={proj.role}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCv(prev => ({
                                    ...prev,
                                    projects: prev.projects.map((p, idx) => idx === pIdx ? { ...p, role: val } : p)
                                  }));
                                }}
                                className="text-[11px] font-semibold text-sky-600 bg-transparent hover:bg-white rounded px-1 outline-hidden"
                              />
                              <button
                                onClick={() => {
                                  setCv(prev => ({
                                    ...prev,
                                    projects: prev.projects.filter((_, idx) => idx !== pIdx)
                                  }));
                                }}
                                className="opacity-0 group-hover/item:opacity-100 text-rose-500 hover:text-rose-700 p-0.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <textarea
                            value={proj.description}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCv(prev => ({
                                ...prev,
                                projects: prev.projects.map((p, idx) => idx === pIdx ? { ...p, description: val } : p)
                              }));
                            }}
                            rows={2}
                            className="text-xs text-slate-600 bg-transparent hover:bg-white rounded p-1 outline-hidden resize-none leading-relaxed"
                          />

                          {/* Tags */}
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {proj.tags.map((tag, tIdx) => (
                              <span key={tIdx} className="text-[10px] font-semibold bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              }

              // 4. EDUCATION
              if (sectionKey === 'education') {
                return (
                  <section key="education" className="group/section flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-4.5 bg-sky-600 rounded-xs" />
                        <input
                          type="text"
                          value={cv.sectionTitles.education}
                          onChange={(e) => updateSectionTitle('education', e.target.value)}
                          className="bg-transparent text-sm font-extrabold uppercase tracking-wider text-slate-900 hover:bg-slate-100 focus:bg-slate-100 focus:ring-1 focus:ring-sky-500 rounded px-1.5 py-0.5 outline-hidden"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            const newEdu: EducationItem = {
                              id: `edu-${Date.now()}`,
                              school: 'Tên Trường Đại Học / Học Viện',
                              degree: 'Cử nhân Chuyên ngành...',
                              period: '2018 - 2022',
                              honors: 'Tốt nghiệp loại Giỏi'
                            };
                            setCv(prev => ({ ...prev, educations: [...prev.educations, newEdu] }));
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-sky-600 hover:bg-sky-50 rounded"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm học vấn</span>
                        </button>
                        <div className="opacity-0 group-hover/section:opacity-100 flex items-center gap-0.5 transition-opacity">
                          <button
                            onClick={() => moveMainSection(sectionIdx, 'up')}
                            disabled={sectionIdx === 0}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveMainSection(sectionIdx, 'down')}
                            disabled={sectionIdx === cv.layoutOrder.main.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="relative pl-5 border-l-2 border-slate-200 flex flex-col gap-4">
                      {cv.educations.map((edu, edIdx) => (
                        <div key={edu.id} className="group/item relative flex flex-col gap-1 text-xs">
                          <div className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-sky-600 border-2 border-white shadow-xs" />
                          <div className="flex flex-wrap items-baseline justify-between">
                            <input
                              type="text"
                              value={edu.degree}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCv(prev => ({
                                  ...prev,
                                  educations: prev.educations.map((item, idx) => idx === edIdx ? { ...item, degree: val } : item)
                                }));
                              }}
                              className="font-bold text-slate-900 text-xs bg-transparent hover:bg-slate-100 rounded px-1 py-0.5 outline-hidden"
                            />
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={edu.period}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCv(prev => ({
                                    ...prev,
                                    educations: prev.educations.map((item, idx) => idx === edIdx ? { ...item, period: val } : item)
                                  }));
                                }}
                                className="font-semibold text-sky-700 bg-sky-50 text-[11px] px-1.5 py-0.5 rounded outline-hidden"
                              />
                              <button
                                onClick={() => {
                                  setCv(prev => ({
                                    ...prev,
                                    educations: prev.educations.filter((_, idx) => idx !== edIdx)
                                  }));
                                }}
                                className="opacity-0 group-hover/item:opacity-100 text-rose-500 hover:text-rose-700 p-0.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <input
                            type="text"
                            value={edu.school}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCv(prev => ({
                                ...prev,
                                educations: prev.educations.map((item, idx) => idx === edIdx ? { ...item, school: val } : item)
                              }));
                            }}
                            className="text-slate-600 font-semibold bg-transparent hover:bg-slate-100 rounded px-1 py-0.5 outline-hidden"
                          />
                          <input
                            type="text"
                            value={edu.honors}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCv(prev => ({
                                ...prev,
                                educations: prev.educations.map((item, idx) => idx === edIdx ? { ...item, honors: val } : item)
                              }));
                            }}
                            className="text-emerald-700 font-medium bg-transparent hover:bg-slate-100 rounded px-1 py-0.5 outline-hidden text-[11px]"
                            placeholder="Thành tích / GPA..."
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                );
              }

              return null;
            })}
          </main>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: ADD TOOL (PRESET LIBRARY & CUSTOM LOGO UPLOAD) */}
      {/* ========================================================= */}
      {showToolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-white text-base">Thêm Công Cụ & Phần Mềm Vào CV</h3>
              </div>
              <button
                onClick={() => setShowToolModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 pt-2 gap-4">
              <button
                onClick={() => setToolModalTab('preset')}
                className={`pb-3 text-xs font-bold transition-colors border-b-2 ${
                  toolModalTab === 'preset'
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                1. Chọn từ thư viện có sẵn (Popular Tools)
              </button>
              <button
                onClick={() => setToolModalTab('custom')}
                className={`pb-3 text-xs font-bold transition-colors border-b-2 ${
                  toolModalTab === 'custom'
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                2. Tự tải Logo lên & Nhập tên công cụ
              </button>
            </div>

            {/* Tab 1: Preset Tools */}
            {toolModalTab === 'preset' && (
              <div className="p-6 flex flex-col gap-4 overflow-y-auto flex-1">
                {/* Search & Category Filter */}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={toolSearch}
                    onChange={(e) => setToolSearch(e.target.value)}
                    placeholder="Tìm nhanh Figma, Photoshop, React, Node.js..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 outline-hidden focus:border-sky-500"
                  />
                  <div className="flex gap-1">
                    {[
                      { id: 'all', label: 'Tất cả' },
                      { id: 'design', label: 'Design' },
                      { id: 'frontend', label: 'Frontend' },
                      { id: 'backend', label: 'Backend' },
                      { id: 'productivity', label: 'Tools' }
                    ].map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedToolCategory(c.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                          selectedToolCategory === c.id
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid of presets */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {filteredPresetTools.map(preset => {
                    const isAdded = cv.tools.some(t => t.name.toLowerCase() === preset.name.toLowerCase());
                    return (
                      <button
                        key={preset.id}
                        onClick={() => handleAddPresetTool(preset)}
                        disabled={isAdded}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                          isAdded
                            ? 'bg-slate-800/40 border-slate-800 opacity-60 cursor-not-allowed'
                            : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 hover:border-sky-500 hover:scale-[1.02]'
                        }`}
                      >
                        <div className="w-7 h-7 flex items-center justify-center shrink-0">
                          <div className="w-6 h-6" dangerouslySetInnerHTML={{ __html: preset.iconSvg }} />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-xs font-bold text-slate-100 truncate">{preset.name}</span>
                          <span className="text-[10px] text-slate-400 capitalize">{preset.category}</span>
                        </div>
                        {isAdded ? (
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                            <Check className="w-3 h-3" />
                            Đã thêm
                          </span>
                        ) : (
                          <Plus className="w-4 h-4 text-sky-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 2: Custom Tool Upload */}
            {toolModalTab === 'custom' && (
              <div className="p-6 flex flex-col gap-5 overflow-y-auto flex-1">
                <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-3 text-xs text-sky-300">
                  Bạn có thể tải logo file PNG/SVG của bất kỳ phần mềm chuyên biệt nào (Blender, Unity, Midjourney, Cinema4D...) và nhập tên để hiển thị chuẩn xác trong CV.
                </div>

                {/* Tool Name Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-300">Tên công cụ / Phần mềm *</label>
                  <input
                    type="text"
                    value={customToolName}
                    onChange={(e) => setCustomToolName(e.target.value)}
                    placeholder="Ví dụ: Cinema 4D, Midjourney, Final Cut Pro..."
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 outline-hidden focus:border-sky-500"
                  />
                </div>

                {/* Level / Tag */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-300">Mức độ thành thạo (Tùy chọn)</label>
                  <select
                    value={customToolLevel}
                    onChange={(e) => setCustomToolLevel(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-hidden focus:border-sky-500"
                  >
                    <option value="Thành thạo">Thành thạo (Advanced)</option>
                    <option value="Chuyên gia">Chuyên gia (Expert)</option>
                    <option value="Khá tốt">Khá tốt (Proficient)</option>
                    <option value="Cơ bản">Cơ bản (Basic)</option>
                  </select>
                </div>

                {/* Logo Upload or Link */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-300">Logo công cụ</label>
                  <div className="flex items-center gap-3">
                    {/* Logo Preview */}
                    <div className="w-14 h-14 rounded-xl border border-slate-700 bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                      {customToolLogoUrl ? (
                        <img src={customToolLogoUrl} alt="Logo preview" className="w-full h-full object-contain p-2" />
                      ) : (
                        <Wrench className="w-6 h-6 text-slate-500" />
                      )}
                    </div>

                    <div className="flex flex-col gap-2 flex-1">
                      <input
                        type="file"
                        ref={toolLogoInputRef}
                        onChange={handleToolLogoFileSelect}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => toolLogoInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 transition-colors w-fit"
                      >
                        <Upload className="w-3.5 h-3.5 text-sky-400" />
                        <span>Tải tệp ảnh logo từ máy tính</span>
                      </button>
                      <input
                        type="text"
                        value={customToolLogoUrl}
                        onChange={(e) => setCustomToolLogoUrl(e.target.value)}
                        placeholder="Hoặc dán URL link ảnh logo..."
                        className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 outline-hidden focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setShowToolModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleAddCustomTool}
                    className="px-5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-md transition-colors"
                  >
                    Thêm vào CV ngay
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: AVATAR CHANGE (UPLOAD FILE OR URL) */}
      {/* ========================================================= */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Thay Đổi Ảnh Đại Diện CV</h3>
              <button onClick={() => setShowAvatarModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-3">
              <img
                src={cv.personalInfo.avatar}
                alt="Avatar current"
                className="w-28 h-28 rounded-full object-cover border-4 border-slate-700 shadow-lg"
              />
              <span className="text-xs text-slate-400">Xem trước ảnh hiện tại</span>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarFileSelect}
              accept="image/*"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploadLoading}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition-all shadow-md"
            >
              <Upload className="w-4 h-4" />
              <span>{avatarUploadLoading ? 'Đang tải lên...' : 'Tải ảnh mới từ máy tính'}</span>
            </button>

            <div className="flex items-center gap-2 my-1">
              <div className="h-px bg-slate-800 flex-1" />
              <span className="text-[11px] text-slate-500 uppercase">Hoặc dán URL</span>
              <div className="h-px bg-slate-800 flex-1" />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={avatarInputUrl}
                onChange={(e) => setAvatarInputUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 outline-hidden"
              />
              <button
                onClick={() => {
                  if (avatarInputUrl.trim()) {
                    updatePersonalInfo('avatar', avatarInputUrl.trim());
                    setShowAvatarModal(false);
                    setAvatarInputUrl('');
                    toast.success('Đã cập nhật ảnh đại diện!');
                  }
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-xs rounded-xl border border-slate-700"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: REORDER LAYOUT SECTIONS */}
      {/* ========================================================= */}
      {showLayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Sắp Xếp Bố Cục Các Phần Trong CV</h3>
              </div>
              <button onClick={() => setShowLayoutModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Sử dụng các nút mũi tên để di chuyển thứ tự các khối theo đúng sở thích của bạn để CV trông hài hòa nhất.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Sidebar sections */}
              <div className="flex flex-col gap-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">
                  Cột Trái (Sidebar)
                </h4>
                {cv.layoutOrder.sidebar.map((key, idx) => (
                  <div key={key} className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 text-xs text-slate-200">
                    <span className="font-semibold capitalize">{cv.sectionTitles[key] || key}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveSidebarSection(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 hover:text-sky-400 disabled:opacity-30"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveSidebarSection(idx, 'down')}
                        disabled={idx === cv.layoutOrder.sidebar.length - 1}
                        className="p-1 hover:text-sky-400 disabled:opacity-30"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Main sections */}
              <div className="flex flex-col gap-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">
                  Cột Phải (Nội dung chính)
                </h4>
                {cv.layoutOrder.main.map((key, idx) => (
                  <div key={key} className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 text-xs text-slate-200">
                    <span className="font-semibold capitalize">{cv.sectionTitles[key] || key}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveMainSection(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 hover:text-sky-400 disabled:opacity-30"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveMainSection(idx, 'down')}
                        disabled={idx === cv.layoutOrder.main.length - 1}
                        className="p-1 hover:text-sky-400 disabled:opacity-30"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowLayoutModal(false)}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
