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
      <section className="pt-6 lg:pt-10 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
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

      {/* 4 Main Categories Showcase Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-3">
          <h2 className="text-4xl font-extrabold text-slate-900">Danh Mục Giao Diện Sẵn Sàng</h2>
          <p className="text-slate-500 font-medium text-lg">Khám phá các mẫu giao diện được thiết kế riêng theo từng nhu cầu sử dụng</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              icon: Globe, 
              title: "WEBSITE", 
              desc: "Website doanh nghiệp, công ty B2B, cửa hàng E-Commerce bán hàng và ẩm thực.",
              bg: "bg-blue-50/80 hover:bg-blue-100/80 border-blue-200/60", 
              iconBg: "bg-blue-500 text-white",
              link: "/templates?tab=website",
              badge: "Doanh nghiệp & Bán hàng"
            },
            { 
              icon: Zap, 
              title: "LANDING PAGES", 
              desc: "Trang đích tối ưu tỷ lệ chuyển đổi cho sản phẩm AI, Mobile App và Sự kiện.",
              bg: "bg-purple-50/80 hover:bg-purple-100/80 border-purple-200/60", 
              iconBg: "bg-purple-500 text-white",
              link: "/templates?tab=landing_page",
              badge: "Tối ưu chuyển đổi"
            },
            { 
              icon: PenTool, 
              title: "PORTFOLIO", 
              desc: "Showcase năng lực dành riêng cho Lập trình viên, Designer và Nghệ sĩ sáng tạo.",
              bg: "bg-emerald-50/80 hover:bg-emerald-100/80 border-emerald-200/60", 
              iconBg: "bg-emerald-500 text-white",
              link: "/templates?tab=portfolio",
              badge: "Thương hiệu cá nhân"
            },
            { 
              icon: Layout, 
              title: "ADMIN & DASHBOARD", 
              desc: "Giao diện quản trị SaaS, CRM quản lý bán hàng và ERP kho vận chuyên sâu.",
              bg: "bg-amber-50/80 hover:bg-amber-100/80 border-amber-200/60", 
              iconBg: "bg-amber-500 text-white",
              link: "/templates?tab=dashboard",
              badge: "Quản trị & Báo cáo"
            }
          ].map((cat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Link to={cat.link} className="block h-full">
                <div className={`p-8 rounded-[36px] ${cat.bg} border flex flex-col justify-between space-y-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-soft-lg cursor-pointer h-full`}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`p-3.5 rounded-2xl ${cat.iconBg} shadow-sm`}>
                        <cat.icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 bg-white/80 px-2.5 py-1 rounded-full border border-slate-200/60">
                        {cat.badge}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{cat.title}</h3>
                    <p className="text-slate-600 font-medium text-xs leading-relaxed">
                      {cat.desc}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 group">
                    <span>Xem mẫu giao diện</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
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
