import { useEffect, useState } from 'react';
import { TemplateCard } from '@/src/components/ui/TemplateCard';
import { api } from '@/src/services/api';
import { Template, Category } from '@/src/types';
import { Loading } from '@/src/components/ui/Loading';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { Search } from 'lucide-react';
import { Input } from '@/src/components/ui/Input';

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredTemplates = templates.filter(tpl => {
    const q = searchQuery.toLowerCase();
    return tpl.name.toLowerCase().includes(q) || 
           tpl.description.toLowerCase().includes(q) || 
           (tpl.tags || []).some(tag => tag.toLowerCase().includes(q));
  });

  return (
    <div className="w-full pt-36 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900">{t('public.templates.title')}</h1>
        <p className="text-slate-500 font-medium text-lg">
          {t('public.templates.subtitle')}
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-xl mx-auto relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          <Search className="w-5 h-5" />
        </div>
        <Input 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('public.search.placeholder') || "Search templates..."}
          className="pl-12 h-14 rounded-full text-lg shadow-sm"
        />
      </div>

      {/* Categories Filter (Pills) */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <div className="px-5 py-2.5 rounded-full bg-slate-900 text-white font-bold text-sm shadow-md cursor-default">
          {t('public.templates.all')}
        </div>
        {!loading && categories.map((cat) => (
          <Link key={cat.id} to={`/category/${cat.slug}`}>
            <div className="px-5 py-2.5 rounded-full bg-white text-slate-600 font-bold text-sm shadow-sm border border-slate-100 hover:bg-slate-50 hover:text-slate-900 transition-colors">
              {cat.name}
            </div>
          </Link>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20"><Loading /></div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-[40px] border border-slate-100">
          <h3 className="text-xl font-bold text-slate-900 mb-2">{t('public.search.noResults')}</h3>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTemplates.map((tpl, i) => (
            <motion.div
              key={tpl.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <TemplateCard template={tpl} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
