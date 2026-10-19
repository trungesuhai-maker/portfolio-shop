import { useState, useEffect, useRef } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Modal } from '@/src/components/ui/Modal';
import { 
  FileText, 
  Search, 
  LayoutGrid, 
  List, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Plus, 
  CheckCircle2, 
  Download, 
  ExternalLink, 
  Briefcase, 
  Phone, 
  Mail, 
  MapPin, 
  Sparkles, 
  Clock, 
  Filter,
  Check,
  AlertTriangle,
  Printer,
  Copy,
  Globe,
  ArrowUpDown,
  Wrench,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { CVDocument } from '@/src/types/cv';
import { CVLiveEditor } from '@/src/components/cv/CVLiveEditor';
import { downloadCVHTML } from '@/src/utils/cvExporter';

// AUTHENTIC MASTER CV TEMPLATE (100% Matching User's Design)
export const DEFAULT_MASTER_CV: CVDocument = {
  id: 'cv-master-001',
  title: 'Mẫu CV Chuyên Nghiệp 2026 - Modern Executive & Tech',
  updatedAt: new Date().toLocaleDateString('vi-VN'),
  status: 'published',
  templateTheme: 'from-slate-900 to-indigo-950',
  personalInfo: {
    fullName: 'NGUYỄN MINH HOÀNG',
    jobTitle: 'SENIOR PRODUCT DESIGNER & UI/UX SPECIALIST',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face',
    email: 'hoang.design@gmail.com',
    phone: '0912 345 678',
    location: 'TP. Hồ Chí Minh / Hà Nội',
    website: 'minhhoang.design',
    linkedin: 'linkedin.com/in/minhhoang-ux',
    github: 'github.com/minhhoang-dev'
  },
  sectionTitles: {
    contact: 'THÔNG TIN LIÊN HỆ',
    profile: 'GIỚI THIỆU BẢN THÂN',
    experience: 'KINH NGHIỆM LÀM VIỆC',
    education: 'HỌC VẤN & BẰNG CẤP',
    skills: 'KỸ NĂNG CHUYÊN MÔN',
    tools: 'CÔNG CỤ & CÔNG NGHỆ',
    projects: 'DỰ ÁN TIÊU BIỂU',
    languages: 'NGOẠI NGỮ',
    certifications: 'CHỨNG CHỈ NGHỀ NGHIỆP'
  },
  layoutOrder: {
    sidebar: ['contact', 'profile', 'skills', 'languages', 'certifications'],
    main: ['experience', 'tools', 'projects', 'education']
  },
  profileSummary: 'Chuyên gia thiết kế sản phẩm số & UI/UX với hơn 6 năm kinh nghiệm kiến tạo trải nghiệm người dùng tinh tế, tối ưu hóa tỷ lệ chuyển đổi và xây dựng Design System quy mô lớn cho các sản phẩm Fintech, E-commerce và SaaS. Sở hữu tư duy giải quyết vấn đề sáng tạo kết hợp hiểu biết sâu sắc về hành vi người dùng.',
  experiences: [
    {
      id: 'exp-1',
      role: 'Lead Product Designer',
      company: 'VNPAY Fintech Solution Corp',
      period: '2023 - HIỆN TẠI',
      location: 'Hà Nội',
      description: 'Chỉ đạo định hướng thiết kế hệ sinh thái thanh toán điện tử & ngân hàng số với hơn 5.000.000 người dùng hàng tháng.',
      bullets: [
        'Tái cấu trúc luồng thanh toán QR & chuyển tiền nhanh, giảm 28% tỷ lệ hủy giao dịch (Drop-off rate).',
        'Xây dựng và phát triển Design System toàn diện với 400+ reusable components trên Figma & Storybook.',
        'Dẫn dắt và cố vấn cho đội ngũ 8 nhà thiết kế UI/UX, thúc đẩy phương pháp tiếp cận Human-Centered Design.'
      ]
    },
    {
      id: 'exp-2',
      role: 'Senior UI/UX Specialist',
      company: 'Grab Financial Group',
      period: '2021 - 2023',
      location: 'TP. Hồ Chí Minh',
      description: 'Phụ trách thiết kế trải nghiệm tính năng vi mô, ví điện tử & chương trình khách hàng thân thiết.',
      bullets: [
        'Thực hiện nghiên cứu người dùng định lượng và định tính với hơn 120 buổi phỏng vấn chuyên sâu.',
        'Tối ưu hóa hành trình đăng ký hội viên mới, gia tăng 35% lượng kích hoạt ví thành công trong tháng đầu.'
      ]
    },
    {
      id: 'exp-3',
      role: 'UI Designer & Prototyper',
      company: 'VNG Corporation - ZaloPay Ecosystem',
      period: '2019 - 2021',
      location: 'TP. Hồ Chí Minh',
      description: 'Thiết kế giao diện ứng dụng di động iOS/Android và web portals quản trị cho đối tác bán buôn.',
      bullets: [
        'Thiết kế hơn 50+ micro-interactions và hiệu ứng động mượt mà bằng After Effects & Lottie.',
        'Hợp tác chặt chẽ với đội ngũ kỹ sư Frontend đảm bảo độ chuẩn xác pixel-perfect khi bàn giao thiết kế.'
      ]
    }
  ],
  educations: [
    {
      id: 'edu-1',
      school: 'Đại Học Kiến Trúc TP. Hồ Chí Minh',
      degree: 'Cử nhân Thiết kế Đồ họa & Tương tác số',
      period: '2015 - 2019',
      honors: 'Tốt nghiệp loại Giỏi - GPA 3.8/4.0'
    },
    {
      id: 'edu-2',
      school: 'Interaction Design Foundation (IxDF)',
      degree: 'Chứng chỉ Chuyên sâu UX Master & Design Thinking',
      period: '2020',
      honors: 'Top 5% học viên xuất sắc toàn khóa'
    }
  ],
  skills: [
    { id: 'sk-1', name: 'UI/UX & Product Design', level: 95 },
    { id: 'sk-2', name: 'Design System & Architecture', level: 92 },
    { id: 'sk-3', name: 'User Research & Testing', level: 88 },
    { id: 'sk-4', name: 'Frontend Code (React/Tailwind)', level: 82 },
    { id: 'sk-5', name: 'Design Sprint & Leadership', level: 86 }
  ],
  tools: [
    { id: 't-1', name: 'Figma', iconName: 'figma', level: 'Chuyên gia' },
    { id: 't-2', name: 'Adobe Photoshop', iconName: 'photoshop', level: 'Thành thạo' },
    { id: 't-3', name: 'Adobe Illustrator', iconName: 'illustrator', level: 'Thành thạo' },
    { id: 't-4', name: 'Adobe XD', iconName: 'adobexd', level: 'Thành thạo' },
    { id: 't-5', name: 'Premiere Pro', iconName: 'premiere', level: 'Khá tốt' },
    { id: 't-6', name: 'Canva', iconName: 'canva', level: 'Thành thạo' },
    { id: 't-7', name: 'React.js', iconName: 'react', level: 'Thành thạo' },
    { id: 't-8', name: 'Tailwind CSS', iconName: 'tailwind', level: 'Thành thạo' },
    { id: 't-9', name: 'TypeScript', iconName: 'typescript', level: 'Khá tốt' },
    { id: 't-10', name: 'VS Code', iconName: 'vscode', level: 'Thành thạo' },
    { id: 't-11', name: 'Git & GitHub', iconName: 'git_github', level: 'Thành thạo' },
    { id: 't-12', name: 'Jira Software', iconName: 'jira', level: 'Thành thạo' }
  ],
  projects: [
    {
      id: 'p-1',
      name: 'FinFlow - Siêu ứng dụng Tài chính Cá nhân',
      role: 'Lead Product Designer',
      period: '2024 - 2025',
      tags: ['Figma', 'Fintech', 'Design System', 'React Native'],
      description: 'Nền tảng quản lý tài chính thông minh tích hợp AI phân tích chi tiêu tự động, đạt 4.8 sao trên App Store và 500k+ downloads.'
    },
    {
      id: 'p-2',
      name: 'Nexus UI Design System',
      role: 'Lead Architect',
      period: '2023 - 2024',
      tags: ['Figma Tokens', 'Storybook', 'Tailwind', 'Accessibility WCAG'],
      description: 'Hệ thống thiết kế chuẩn hóa cho hơn 15 sản phẩm số doanh nghiệp, tăng 40% tốc độ bàn giao giữa Design và Engineering.'
    }
  ],
  languages: [
    { id: 'lang-1', name: 'Tiếng Việt', level: 'Tiếng mẹ đẻ (Bản ngữ)', proficiency: 5 },
    { id: 'lang-2', name: 'Tiếng Anh', level: 'Thành thạo - IELTS 7.5', proficiency: 5 },
    { id: 'lang-3', name: 'Tiếng Nhật', level: 'Giao tiếp cơ bản (JLPT N4)', proficiency: 3 }
  ],
  certifications: [
    { id: 'c-1', name: 'Certified UX Master', issuer: 'Interaction Design Foundation', year: '2024' },
    { id: 'c-2', name: 'Google UX Design Professional', issuer: 'Google Career Certificates', year: '2023' }
  ]
};

const STORAGE_KEY = 'webcuaban_admin_cv_real_list';

export default function AdminCVManagement() {
  // Load CVs: initialize with DEFAULT_MASTER_CV only (NO fake mock cards!)
  const [cvList, setCvList] = useState<CVDocument[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return [DEFAULT_MASTER_CV];
  });

  const [activeCvId, setActiveCvId] = useState<string>(cvList[0]?.id || DEFAULT_MASTER_CV.id);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'hidden' | 'draft'>('all');
  
  // Popup Action Menu
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [actionMenuPos, setActionMenuPos] = useState<{ top: number; left: number } | null>(null);
  
  // Editor mode
  const [isEditingMode, setIsEditingMode] = useState<boolean>(false);
  const [editingCv, setEditingCv] = useState<CVDocument | null>(null);

  // Delete modal confirmation
  const [deletingCvId, setDeletingCvId] = useState<string | null>(null);

  // Close popup menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.cv-action-trigger') && !target.closest('.cv-action-menu')) {
        setOpenActionId(null);
        setActionMenuPos(null);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Save to localStorage
  const saveCvList = (newList: CVDocument[]) => {
    setCvList(newList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch {
      // ignore
    }
  };

  // Open action dropdown
  const handleToggleAction = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (openActionId === id) {
      setOpenActionId(null);
      setActionMenuPos(null);
      return;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const menuWidth = 190;
    const menuHeight = 220;
    let left = rect.right - menuWidth;
    let top = rect.bottom + 6;

    if (left < 10) left = 10;
    if (top + menuHeight > window.innerHeight) {
      top = rect.top - menuHeight - 6;
    }

    setActionMenuPos({ top, left });
    setOpenActionId(id);
  };

  // Actions
  const handleEditCv = (cv: CVDocument) => {
    setEditingCv(JSON.parse(JSON.stringify(cv)));
    setIsEditingMode(true);
    setOpenActionId(null);
  };

  const handleToggleDisplay = (cvId: string) => {
    const updated = cvList.map(item => {
      if (item.id === cvId) {
        const nextStatus = item.status === 'published' ? 'hidden' : 'published';
        toast.success(nextStatus === 'published' ? 'Đã bật hiển thị CV' : 'Đã chuyển CV sang trạng thái ẩn');
        return { ...item, status: nextStatus as 'published' | 'hidden' };
      }
      return item;
    });
    saveCvList(updated);
    setOpenActionId(null);
  };

  const handleDuplicateCv = (cv: CVDocument) => {
    const clone: CVDocument = JSON.parse(JSON.stringify(cv));
    clone.id = `cv-${Date.now()}`;
    clone.title = `${cv.title} (Bản sao)`;
    clone.updatedAt = new Date().toLocaleDateString('vi-VN');
    const updated = [clone, ...cvList];
    saveCvList(updated);
    toast.success('Đã nhân bản CV mới thành công!');
    setOpenActionId(null);
  };

  const handleDeleteCv = (cvId: string) => {
    if (cvList.length <= 1) {
      toast.error('Cần giữ ít nhất 1 CV trong hệ thống');
      setDeletingCvId(null);
      return;
    }
    const updated = cvList.filter(c => c.id !== cvId);
    saveCvList(updated);
    toast.success('Đã xóa CV thành công');
    setDeletingCvId(null);
    setOpenActionId(null);
  };

  const handleCreateNewCv = () => {
    const newCv: CVDocument = JSON.parse(JSON.stringify(DEFAULT_MASTER_CV));
    newCv.id = `cv-${Date.now()}`;
    newCv.title = `CV Ứng Viên Mới #${cvList.length + 1}`;
    newCv.personalInfo.fullName = 'HỌ VÀ TÊN ỨNG VIÊN';
    newCv.personalInfo.jobTitle = 'VỊ TRÍ ỨNG TUYỂN';
    newCv.updatedAt = new Date().toLocaleDateString('vi-VN');
    const updated = [newCv, ...cvList];
    saveCvList(updated);
    toast.success('Đã tạo hồ sơ CV mới từ mẫu chuẩn!');
    handleEditCv(newCv);
  };

  const handleSaveFromEditor = (savedCv: CVDocument) => {
    const updated = cvList.map(c => c.id === savedCv.id ? savedCv : c);
    saveCvList(updated);
    setEditingCv(savedCv);
  };

  // Filtered CVs
  const filteredCVs = cvList.filter(cv => {
    const matchesSearch = 
      cv.personalInfo.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cv.personalInfo.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cv.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || cv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // IF USER IS IN LIVE STUDIO / EDITOR MODE
  if (isEditingMode && editingCv) {
    return (
      <CVLiveEditor
        initialCv={editingCv}
        onSave={handleSaveFromEditor}
        onClose={() => {
          setIsEditingMode(false);
          setEditingCv(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Quản lý CV & Hồ sơ ứng viên
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Mẫu CV thiết kế chuẩn 100%, hỗ trợ biên tập trực tiếp mọi chi tiết, xuất HTML, sắp xếp bố cục và dịch đa ngôn ngữ.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
          {/* Quick open primary CV in studio */}
          <button
            onClick={() => handleEditCv(cvList[0] || DEFAULT_MASTER_CV)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-md shadow-sky-600/20 transition-all hover:scale-[1.02]"
          >
            <Edit3 className="w-4 h-4" />
            <span>Mở Studio Sửa Trực Tiếp</span>
          </button>

          <Button
            onClick={handleCreateNewCv}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-sm py-2.5 px-4 rounded-xl font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo CV Mới</span>
          </Button>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tổng số CV</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{cvList.length}</h3>
            </div>
            <div className="p-3 bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Đang hiển thị</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {cvList.filter(c => c.status === 'published').length}
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Eye className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Đang ẩn</p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {cvList.filter(c => c.status === 'hidden').length}
              </h3>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-xl">
              <EyeOff className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tải HTML / PDF</p>
              <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">Sẵn sàng</h3>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-xl">
              <Download className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* FILTER & VIEW TOGGLE BAR */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Tìm theo tên ứng viên, chức danh, kỹ năng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9.5 text-xs py-2 bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 rounded-xl"
          />
        </div>

        {/* Status Filter & View Switcher */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(['all', 'published', 'hidden'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === st
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {st === 'all' && 'Tất cả'}
                {st === 'published' && 'Đang hiển thị'}
                {st === 'hidden' && 'Đang ẩn'}
              </button>
            ))}
          </div>

          {/* VIEW SWITCHER: CARD (6 / ROW) VS LIST */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('card')}
              className={`p-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold ${
                viewMode === 'card'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Dạng thẻ (6 card / hàng)"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Thẻ (6/hàng)</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Dạng danh sách chi tiết"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Danh sách</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. CARD VIEW: EXACTLY 6 CARDS PER ROW AS REQUESTED */}
      {/* ========================================================= */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5">
          {filteredCVs.map((cv) => (
            <Card
              key={cv.id}
              className="group relative flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 transition-all hover:shadow-lg rounded-2xl overflow-hidden"
            >
              {/* Card Top Mini Banner */}
              <div className="h-16 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 relative p-2 flex justify-between items-start">
                {/* Status Badge */}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  cv.status === 'published' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {cv.status === 'published' ? 'Hiển thị' : 'Đang ẩn'}
                </span>

                {/* 3-dot action button */}
                <button
                  onClick={(e) => handleToggleAction(e, cv.id)}
                  className="cv-action-trigger p-1 text-slate-300 hover:text-white rounded-lg hover:bg-black/40 transition-colors"
                  title="Thao tác"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Avatar */}
              <div className="px-3 -mt-8 flex justify-center">
                <img
                  src={cv.personalInfo.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face'}
                  alt={cv.personalInfo.fullName}
                  className="w-16 h-16 rounded-full object-cover border-3 border-white dark:border-slate-900 shadow-md group-hover:scale-105 transition-transform"
                />
              </div>

              {/* Info */}
              <div className="p-3 text-center flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase truncate" title={cv.personalInfo.fullName}>
                    {cv.personalInfo.fullName}
                  </h3>
                  <p className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold truncate mt-0.5" title={cv.personalInfo.jobTitle}>
                    {cv.personalInfo.jobTitle}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-1">
                    Cập nhật: {cv.updatedAt}
                  </p>
                </div>

                {/* Mini tools count */}
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                  <span>{cv.tools.length} công cụ</span>
                  <span>{cv.experiences.length} kinh nghiệm</span>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-1.5 mt-2.5">
                  <button
                    onClick={() => handleEditCv(cv)}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 rounded-lg text-xs font-bold transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Sửa</span>
                  </button>
                  <button
                    onClick={() => downloadCVHTML(cv)}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors"
                    title="Tải HTML"
                  >
                    <Download className="w-3 h-3" />
                    <span>Tải</span>
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. LIST VIEW: COLUMNS WITH 3-DOT ACTION MENU AT END */}
      {/* ========================================================= */}
      {viewMode === 'list' && (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Ứng viên & Ảnh</th>
                  <th className="py-3.5 px-4">Chức danh / Vị trí</th>
                  <th className="py-3.5 px-4">Liên hệ</th>
                  <th className="py-3.5 px-4">Công cụ & Kinh nghiệm</th>
                  <th className="py-3.5 px-4">Cập nhật</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredCVs.map((cv) => (
                  <tr 
                    key={cv.id} 
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Candidate */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={cv.personalInfo.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face'}
                          alt={cv.personalInfo.fullName}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white uppercase">
                            {cv.personalInfo.fullName}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                            {cv.title}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Job Title */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-sky-600 dark:text-sky-400">
                        {cv.personalInfo.jobTitle}
                      </span>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                      <div>{cv.personalInfo.email}</div>
                      <div>{cv.personalInfo.phone}</div>
                    </td>

                    {/* Stats */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        <span className="bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded text-[10px] font-semibold">
                          {cv.tools.length} Tools
                        </span>
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[10px] font-semibold">
                          {cv.experiences.length} Nơi làm việc
                        </span>
                      </div>
                    </td>

                    {/* Updated */}
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                      {cv.updatedAt}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        cv.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cv.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {cv.status === 'published' ? 'Đang hiển thị' : 'Đang ẩn'}
                      </span>
                    </td>

                    {/* Action 3-dots */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditCv(cv)}
                          className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/50 dark:hover:bg-sky-900/50 text-sky-600 dark:text-sky-400 rounded-lg text-xs font-bold transition-colors"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={(e) => handleToggleAction(e, cv.id)}
                          className="cv-action-trigger p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================= */}
      {/* FLOATING ACTION DROPDOWN POPUP (SỬA, XÓA, HIỂN THỊ, TẢI HTML) */}
      {/* ========================================================= */}
      {openActionId && actionMenuPos && (() => {
        const targetCv = cvList.find(c => c.id === openActionId);
        if (!targetCv) return null;

        return (
          <div
            className="cv-action-menu fixed z-50 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1.5 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100"
            style={{ top: `${actionMenuPos.top}px`, left: `${actionMenuPos.left}px` }}
          >
            {/* 1. Sửa trực tiếp */}
            <button
              onClick={() => handleEditCv(targetCv)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:text-sky-600 dark:hover:text-sky-400 rounded-lg transition-colors text-left"
            >
              <Edit3 className="w-3.5 h-3.5 text-sky-500" />
              <span>Chỉnh sửa trực tiếp</span>
            </button>

            {/* 2. Tải file HTML */}
            <button
              onClick={() => {
                downloadCVHTML(targetCv);
                setOpenActionId(null);
                toast.success('Đã xuất và tải xuống tệp HTML!');
              }}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg transition-colors text-left"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span>Tải file HTML</span>
            </button>

            {/* 3. Hiển thị / Ẩn */}
            <button
              onClick={() => handleToggleDisplay(targetCv.id)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-left"
            >
              {targetCv.status === 'published' ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-amber-500" />
                  <span>Chuyển sang Ẩn</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Bật hiển thị CV</span>
                </>
              )}
            </button>

            {/* 4. Nhân bản CV */}
            <button
              onClick={() => handleDuplicateCv(targetCv)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-left"
            >
              <Copy className="w-3.5 h-3.5 text-indigo-500" />
              <span>Nhân bản bản sao</span>
            </button>

            <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

            {/* 5. Xóa */}
            <button
              onClick={() => {
                setDeletingCvId(targetCv.id);
                setOpenActionId(null);
              }}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors text-left"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa hồ sơ CV</span>
            </button>
          </div>
        );
      })()}

      {/* CONFIRM DELETE MODAL */}
      <Modal
        isOpen={!!deletingCvId}
        onClose={() => setDeletingCvId(null)}
        title="Xác nhận xóa CV"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Bạn có chắc chắn muốn xóa hồ sơ CV này? Thao tác này sẽ xóa vĩnh viễn dữ liệu CV khỏi hệ thống quản lý.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeletingCvId(null)}
            >
              Hủy
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              onClick={() => {
                if (deletingCvId) handleDeleteCv(deletingCvId);
              }}
            >
              Xóa ngay
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
