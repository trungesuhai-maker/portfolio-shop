import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { TemplateCard } from '@/src/components/ui/TemplateCard';
import { api } from '@/src/services/api';
import { Template, Category } from '@/src/types';
import { Loading } from '@/src/components/ui/Loading';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { 
  Search, 
  Globe, 
  Rocket, 
  UserCheck, 
  LayoutDashboard, 
  LayoutGrid, 
  Sparkles,
  SlidersHorizontal,
  X,
  ArrowUpDown
} from 'lucide-react';
import { Input } from '@/src/components/ui/Input';

export type TemplateTabType = 'ALL' | 'WEBSITE' | 'LANDING_PAGE' | 'PORTFOLIO' | 'DASHBOARD';

export default function Templates() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = (searchParams.get('tab') || searchParams.get('type') || 'ALL').toUpperCase();
  
  const initialTab: TemplateTabType = 
    rawTab === 'WEBSITE' ? 'WEBSITE' :
    rawTab === 'LANDING_PAGE' || rawTab === 'LANDING' || rawTab === 'LANDING-PAGE' ? 'LANDING_PAGE' :
    rawTab === 'PORTFOLIO' ? 'PORTFOLIO' :
    rawTab === 'DASHBOARD' || rawTab === 'ADMIN' ? 'DASHBOARD' : 'ALL';

  const [activeTab, setActiveTab] = useState<TemplateTabType>(initialTab);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'price-asc' | 'price-desc'>('featured');
  const { t } = useLanguage();

  useEffect(() => {
    Promise.all([
      api.templates.list(),
      api.categories.list()
    ]).then(([tpls, cats]) => {
      setTemplates(tpls);
      setCategories(cats);
      setLoading(false);
    });
  }, []);

  // Sync tab with URL
  const handleTabChange = (tab: TemplateTabType) => {
    setActiveTab(tab);
    setSelectedTag('ALL');
    const newParams = new URLSearchParams(searchParams);
    if (tab === 'ALL') {
      newParams.delete('tab');
      newParams.delete('type');
    } else {
      newParams.set('tab', tab.toLowerCase());
    }
    setSearchParams(newParams, { replace: true });
  };

  // Helper to determine the template type
  const getTemplateType = (tpl: Template): TemplateTabType => {
    if (tpl.templateType) return tpl.templateType;
    const nameLower = (tpl.name || '').toLowerCase();
    const catLower = (tpl.categoryName || '').toLowerCase();
    const tagsLower = (tpl.tags || []).join(' ').toLowerCase();
    const descLower = (tpl.description || '').toLowerCase();
    const combined = `${nameLower} ${catLower} ${tagsLower} ${descLower}`;

    if (combined.includes('dashboard') || combined.includes('admin') || combined.includes('crm') || combined.includes('erp') || combined.includes('analytics')) {
      return 'DASHBOARD';
    }
    if (combined.includes('landing') || combined.includes('app showcase') || combined.includes('conversion') || combined.includes('event') || combined.includes('summit')) {
      return 'LANDING_PAGE';
    }
    if (combined.includes('portfolio') || combined.includes('developer') || combined.includes('designer') || combined.includes('photographer') || combined.includes('creative art')) {
      return 'PORTFOLIO';
    }
    return 'WEBSITE';
  };

  // Count templates for each tab
  const counts = useMemo(() => {
    const res = {
      ALL: templates.length,
      WEBSITE: 0,
      LANDING_PAGE: 0,
      PORTFOLIO: 0,
      DASHBOARD: 0
    };
    templates.forEach(tpl => {
      const type = getTemplateType(tpl);
      if (res[type] !== undefined) {
        res[type]++;
      }
    });
    return res;
  }, [templates]);

  // Tab definitions
  const tabs = [
    {
      id: 'ALL' as TemplateTabType,
      label: 'Tất Cả',
      englishLabel: 'ALL',
      icon: LayoutGrid,
      count: counts.ALL,
      color: 'from-slate-800 to-slate-900',
      activeBadge: 'bg-slate-900 text-white'
    },
    {
      id: 'WEBSITE' as TemplateTabType,
      label: 'Website',
      englishLabel: 'WEBSITE',
      icon: Globe,
      count: counts.WEBSITE,
      color: 'from-blue-600 to-indigo-600',
      activeBadge: 'bg-blue-600 text-white'
    },
    {
      id: 'LANDING_PAGE' as TemplateTabType,
      label: 'Landing Pages',
      englishLabel: 'LANDING PAGES',
      icon: Rocket,
      count: counts.LANDING_PAGE,
      color: 'from-purple-600 to-pink-600',
      activeBadge: 'bg-purple-600 text-white'
    },
    {
      id: 'PORTFOLIO' as TemplateTabType,
      label: 'Portfolio',
      englishLabel: 'PORTFOLIO',
      icon: UserCheck,
      count: counts.PORTFOLIO,
      color: 'from-emerald-600 to-teal-600',
      activeBadge: 'bg-emerald-600 text-white'
    },
    {
      id: 'DASHBOARD' as TemplateTabType,
      label: 'Admin & Dashboard',
      englishLabel: 'ADMIN & DASHBOARD',
      icon: LayoutDashboard,
      count: counts.DASHBOARD,
      color: 'from-amber-600 to-orange-600',
      activeBadge: 'bg-amber-600 text-white'
    }
  ];

  // Extract unique tags for the active tab
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    templates.forEach(tpl => {
      if (activeTab === 'ALL' || getTemplateType(tpl) === activeTab) {
        (tpl.tags || []).forEach(t => tagSet.add(t));
      }
    });
    return Array.from(tagSet);
  }, [templates, activeTab]);

  // Filter & Sort
  const filteredTemplates = useMemo(() => {
    return templates
      .filter(tpl => {
        // Tab filter
        if (activeTab !== 'ALL' && getTemplateType(tpl) !== activeTab) {
          return false;
        }

        // Tag subfilter
        if (selectedTag !== 'ALL' && !(tpl.tags || []).includes(selectedTag)) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = tpl.name.toLowerCase().includes(q);
          const matchDesc = tpl.description.toLowerCase().includes(q);
          const matchCat = (tpl.categoryName || '').toLowerCase().includes(q);
          const matchTag = (tpl.tags || []).some(tag => tag.toLowerCase().includes(q));
          if (!matchName && !matchDesc && !matchCat && !matchTag) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return (a.salePrice || a.price) - (b.salePrice || b.price);
        if (sortBy === 'price-desc') return (b.salePrice || b.price) - (a.salePrice || a.price);
        if (sortBy === 'newest') return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
        // Default 'featured'
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      });
  }, [templates, activeTab, selectedTag, searchQuery, sortBy]);

  return (
    <div className="w-full pt-16 sm:pt-20 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 sm:space-y-9">
      
      {/* Page Header */}
      <div className="text-center space-y-2.5 max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          Khám Phá Mẫu Giao Diện
        </h1>
        <p className="text-slate-500 font-normal text-sm sm:text-base md:text-lg max-w-xl mx-auto">
          Chọn phong cách giao diện phù hợp với bạn
        </p>
      </div>

      {/* Search Bar & Sort Dropdown - Centered on Page Above Tabs */}
      <div className="w-full max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative flex-1 w-full">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm giao diện..."
              className="pl-11 pr-10 h-11 rounded-full bg-white border-slate-200 text-sm shadow-xs focus:ring-2 focus:ring-brand-500 w-full placeholder:text-slate-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700 shadow-xs w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center gap-1.5 text-slate-400">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span className="text-slate-500 font-medium">Sắp xếp:</span>
              </div>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer text-xs pr-1"
              >
                <option value="featured">Nổi bật</option>
                <option value="newest">Mới nhất</option>
                <option value="price-asc">Giá: Thấp đến Cao</option>
                <option value="price-desc">Giá: Cao đến Thấp</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* MODERN LIGHT CATEGORY TABS (No gray background, clean modern underline style) */}
      <div className="w-full max-w-4xl mx-auto border-b border-slate-200/90">
        <div className="flex items-center justify-start sm:justify-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none pb-px">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`group relative flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer select-none shrink-0 border-b-2 -mb-px ${
                  isActive
                    ? 'text-brand-600 border-brand-600 font-bold'
                    : 'text-slate-500 hover:text-brand-600 border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-brand-600'}`} />
                <span className="group-hover:text-brand-600 transition-colors">{tab.englishLabel}</span>
                <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded-full font-bold ml-0.5 shrink-0 transition-colors ${
                  isActive ? 'bg-brand-50 text-brand-600 border border-brand-200/60' : 'bg-slate-100 text-slate-500'
                }`}>
                  {tab.count}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Templates Grid */}
      {loading ? (
        <div className="py-24"><Loading /></div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 shadow-xs max-w-2xl mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{t('public.search.noResults') || "Không tìm thấy giao diện phù hợp"}</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc để hiển thị toàn bộ template.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedTag('ALL');
              setActiveTab('ALL');
            }}
            className="mt-2 text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline cursor-pointer"
          >
            Đặt lại tất cả bộ lọc
          </button>
        </div>
      ) : (
        <motion.div 
          layout
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7"
        >
          <AnimatePresence mode="popLayout">
            {filteredTemplates.map((tpl) => (
              <motion.div
                key={tpl.id}
                layout
                initial={{ opacity: 0, scale: 0.96, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -14 }}
                transition={{ 
                  duration: 0.28, 
                  ease: [0.16, 1, 0.3, 1],
                  layout: { duration: 0.28 }
                }}
              >
                <TemplateCard template={tpl} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
