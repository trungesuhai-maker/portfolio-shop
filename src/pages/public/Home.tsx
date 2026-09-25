import { useEffect, useState } from 'react';
import { Button } from '@/src/components/ui/Button';
import { TemplateCard } from '@/src/components/ui/TemplateCard';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { api } from '@/src/services/api';
import { Template } from '@/src/types';
import { PenTool, Layout, Search, ArrowRight, ShieldCheck, Zap, Globe, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/src/contexts/LanguageContext';

export default function Home() {
  const [featured, setFeatured] = useState<Template[]>([]);
  const [popular, setPopular] = useState<Template[]>([]);
  const { t } = useLanguage();
  
  useEffect(() => {
    api.templates.getFeatured().then(setFeatured);
    api.templates.getPopular().then(setPopular);
  }, []);

  return (
    <div className="w-full">
      {/* Decorative Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-[800px] overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] rounded-full bg-gradient-to-bl from-blue-100/60 to-purple-100/60 blur-3xl opacity-70" />
        <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-orange-100/80 to-pink-100/60 blur-3xl opacity-70" />
        <div className="absolute bottom-0 right-[20%] w-[400px] h-[400px] rounded-full bg-yellow-100/40 blur-3xl opacity-60" />
      </div>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[500px]">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8 max-w-xl"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1]" dangerouslySetInnerHTML={{ __html: t('home.hero.title') }} />
            <p className="text-lg md:text-xl text-slate-500 max-w-md font-medium leading-relaxed">
              {t('home.hero.subtitle')}
            </p>
            <div className="pt-4 flex items-center gap-4">
              <Link to="/templates">
                <Button size="lg" className="px-8 shadow-soft-md shadow-brand-500/20">
                  {t('home.hero.getStarted')}
                </Button>
              </Link>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative hidden lg:block"
          >
             <div className="relative w-full aspect-[4/3] rounded-[40px] bg-white/50 backdrop-blur-sm border border-white/40 shadow-soft-lg flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-pastel-blue to-pastel-purple opacity-40"></div>
                {/* Abstract mockup representation */}
                <div className="w-[80%] h-[70%] bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden relative z-10 hover:-translate-y-2 transition-transform duration-500">
                   <div className="h-6 bg-slate-50 border-b border-slate-100 flex items-center px-3 gap-1.5">
                     <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                     <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                     <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                   </div>
                   <div className="flex-1 p-4 flex gap-4">
                     <div className="w-1/3 space-y-3">
                       <div className="h-3 w-16 bg-slate-200 rounded-full"></div>
                       <div className="h-24 bg-pastel-orange rounded-xl"></div>
                       <div className="h-2 w-full bg-slate-100 rounded-full"></div>
                       <div className="h-2 w-4/5 bg-slate-100 rounded-full"></div>
                     </div>
                     <div className="w-2/3 space-y-3">
                       <div className="h-32 bg-pastel-blue rounded-xl"></div>
                       <div className="grid grid-cols-2 gap-3">
                         <div className="h-16 bg-pastel-green rounded-xl"></div>
                         <div className="h-16 bg-pastel-pink rounded-xl"></div>
                       </div>
                     </div>
                   </div>
                </div>
             </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Templates */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 space-y-6 md:space-y-0">
          <div className="space-y-3">
            <h2 className="text-4xl font-extrabold text-slate-900">{t('home.featured.title')}</h2>
            <p className="text-slate-500 font-medium text-lg">{t('home.featured.subtitle')}</p>
          </div>
          <Link to="/templates">
            <Button variant="ghost" className="text-brand-600 gap-2 font-bold px-0 hover:bg-transparent hover:text-brand-700">
              {t('home.featured.explore')} <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featured.map((tpl, i) => (
            <motion.div
              key={tpl.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <TemplateCard template={tpl} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Popular Templates */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white/40 rounded-[64px] border border-white/50 shadow-soft my-12">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 space-y-6 md:space-y-0">
          <div className="space-y-3">
            <h2 className="text-4xl font-extrabold text-slate-900">{t('home.trending.title')}</h2>
            <p className="text-slate-500 font-medium text-lg">{t('home.trending.subtitle')}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {popular.map((tpl, i) => (
            <motion.div
              key={tpl.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <TemplateCard template={tpl} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Services / Categories Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-3">
          <h2 className="text-4xl font-extrabold text-slate-900">{t('home.categories.title')}</h2>
          <p className="text-slate-500 font-medium text-lg">{t('home.categories.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: PenTool, title: "Designers", bg: "bg-pastel-pink", iconColor: "text-pink-500", link: "/category/creative-designer" },
            { icon: Layout, title: "Developers", bg: "bg-pastel-blue", iconColor: "text-blue-500", link: "/category/software-developer" },
            { icon: Search, title: "Creators", bg: "bg-pastel-orange", iconColor: "text-orange-500", link: "/category/content-creator" }
          ].map((service, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link to={service.link}>
                <div className={`p-10 rounded-[40px] ${service.bg} flex flex-col items-center text-center space-y-5 transition-transform hover:-translate-y-2 cursor-pointer h-full`}>
                  <div className={`p-4 bg-white/60 rounded-2xl ${service.iconColor} shadow-sm backdrop-blur-sm`}>
                    <service.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">{service.title}</h3>
                  <p className="text-slate-600 font-medium text-sm leading-relaxed px-4">
                    Optimized layouts and features tailored specifically for your industry.
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
         <div className="bg-slate-900 rounded-[64px] p-12 md:p-20 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-500/20 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="text-center mb-16 space-y-4 relative z-10">
              <h2 className="text-4xl md:text-5xl font-extrabold">{t('home.how.title')}</h2>
              <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto">{t('home.how.subtitle')}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-12 relative z-10">
               {[
                 { step: "01", title: "Choose a Template", desc: "Browse our premium collection and select the one that matches your vibe." },
                 { step: "02", title: "Customize Content", desc: "Use our intuitive visual editor to add your projects, bio, and images." },
                 { step: "03", title: "Publish instantly", desc: "Hit publish and your site is live on a secure, fast, custom subdomain." }
               ].map((item, i) => (
                  <div key={i} className="space-y-6">
                    <div className="text-6xl font-black text-white/10 tracking-tighter">{item.step}</div>
                    <h3 className="text-2xl font-bold">{item.title}</h3>
                    <p className="text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <div className="text-center mb-16 space-y-3">
          <h2 className="text-4xl font-extrabold text-slate-900">{t('home.faq.title')}</h2>
        </div>
        <div className="space-y-6">
           {[
             { q: "Is it a one-time payment?", a: "Yes, you pay once for the template and get lifetime access to the visual editor and edge hosting." },
             { q: "Can I use my own custom domain?", a: "Yes! You receive an instant *.portfolio-shop.com subdomain, and you can also bind your own custom domain (e.g., yourname.com) with automated SSL." },
             { q: "Do I need to know how to code?", a: "Not at all. Our platform provides a visual editor where you simply fill in your content, projects, and bio." }
           ].map((faq, i) => (
             <div key={i} className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
               <h4 className="text-lg font-bold text-slate-900 mb-2">{faq.q}</h4>
               <p className="text-slate-500 font-medium">{faq.a}</p>
             </div>
           ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-100/50 mt-12 relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-b from-transparent to-pastel-orange/30 -z-10"></div>
         <div className="flex flex-col md:flex-row justify-between items-center bg-white/60 backdrop-blur-md p-12 md:p-16 rounded-[40px] border border-white shadow-soft-lg">
           <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 max-w-md leading-tight text-center md:text-left mb-8 md:mb-0">
             {t('home.cta.title')}
           </h2>
           <Link to="/templates">
             <Button size="lg" className="px-10 shadow-soft-md h-16 text-lg">
               {t('home.cta.button')}
             </Button>
           </Link>
         </div>
      </section>
    </div>
  );
}
