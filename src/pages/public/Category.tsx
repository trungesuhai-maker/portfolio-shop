import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Template, Category as CategoryType } from '@/src/types';
import { api } from '@/src/services/api';
import { TemplateCard } from '@/src/components/ui/TemplateCard';
import { Loading } from '@/src/components/ui/Loading';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '@/src/contexts/LanguageContext';

export default function Category() {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<CategoryType | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    if (slug) {
      setLoading(true);
      Promise.all([
        api.categories.list(),
        api.templates.getByCategory(slug)
      ]).then(([categories, tpls]) => {
        const found = categories.find(c => c.slug === slug);
        setCategory(found || null);
        setTemplates(tpls);
        setLoading(false);
      });
    }
  }, [slug]);

  if (loading) return <div className="pt-32 pb-20"><Loading /></div>;
  if (!category) return <div className="pt-32 pb-20 max-w-lg mx-auto"><ErrorState title="Category not found" /></div>;

  return (
    <div className="w-full pt-36 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      <Link to="/templates" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 mb-2 transition-colors">
        <ArrowLeft className="w-4 h-4" /> {t('public.templates.all')}
      </Link>
      
      <div className="text-center space-y-4 max-w-2xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900">{t('public.category.title')}{category.name}</h1>
        <p className="text-slate-500 font-medium text-lg">
          {category.description}
        </p>
      </div>

      {templates.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {templates.map((tpl, i) => (
            <motion.div
              key={tpl.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <TemplateCard template={tpl} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-[40px] border border-slate-100">
          <h3 className="text-xl font-bold text-slate-900 mb-2">Coming Soon</h3>
          <p className="text-slate-500 font-medium">We are adding new templates to this category shortly.</p>
        </div>
      )}
    </div>
  );
}
