import { useState, useEffect } from 'react';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { useAuth } from '@/src/contexts/AuthContext';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { api } from '@/src/services/api';
import { 
  Globe, 
  ExternalLink, 
  Layers, 
  Copy, 
  Check, 
  ShieldCheck, 
  Edit3, 
  Plus, 
  Server, 
  AlertCircle,
  FolderTree,
  Terminal,
  ShoppingBag
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function UserDomains() {
  const { user, updateProfile } = useAuth();
  const { t, language } = useLanguage();

  const initialUsername = (() => {
    if (user?.user_metadata?.username) return user.user_metadata.username;
    if (user?.phone) return user.phone.replace(/[^0-9]/g, '');
    if (user?.email) return user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9-]/g, '');
    return user?.id ? `user-${user.id.slice(0, 6)}` : 'user';
  })();

  const [username, setUsername] = useState(initialUsername);
  const [editingSubdomain, setEditingSubdomain] = useState(false);
  const [savingSubdomain, setSavingSubdomain] = useState(false);

  // Custom domain state
  const [customDomain, setCustomDomain] = useState('');
  const [attachedDomains, setAttachedDomains] = useState<string[]>([]);
  const [addingCustomDomain, setAddingCustomDomain] = useState(false);

  // User's purchased templates / portfolios
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const serverData = user?.id ? await api.portfolios.getByUser(user.id) : [];
        let list: any[] = Array.isArray(serverData) ? serverData : [];

        // Merge local saved portfolios for this user or global guest purchase
        const userKey = `user_portfolios_${user?.id || 'guest'}`;
        const savedUserPortfolios = localStorage.getItem(userKey);
        const savedGlobalPortfolios = localStorage.getItem('my_portfolios');

        const localList: any[] = [];
        if (savedUserPortfolios) {
          try { localList.push(...JSON.parse(savedUserPortfolios)); } catch (e) {}
        }
        if (savedGlobalPortfolios) {
          try { localList.push(...JSON.parse(savedGlobalPortfolios)); } catch (e) {}
        }

        const map = new Map<string, any>();
        list.forEach(p => map.set(p.subdomain || p.id, p));
        localList.forEach(p => {
          if (p.subdomain || p.id) map.set(p.subdomain || p.id, p);
        });

        setPortfolios(Array.from(map.values()));

        const savedCustomDomains = localStorage.getItem(`custom_domains_${user?.id}`);
        if (savedCustomDomains) {
          setAttachedDomains(JSON.parse(savedCustomDomains));
        }
      } catch (e) {
        console.error('Error loading user domains data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user?.id]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(language === 'vi' ? `Đã sao chép: ${text}` : `Copied: ${text}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveSubdomain = async () => {
    const clean = username.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!clean || clean.length < 3) {
      toast.error(language === 'vi' ? 'Subdomain phải có tối thiểu 3 ký tự' : 'Subdomain must be at least 3 characters');
      return;
    }
    setSavingSubdomain(true);
    try {
      await updateProfile({ username: clean });
      setEditingSubdomain(false);
      toast.success(language === 'vi' ? `Đã cập nhật Subdomain chính thành https://${clean}.webcuaban.site` : `Updated primary subdomain to https://${clean}.webcuaban.site`);
    } catch (e) {
      toast.error(language === 'vi' ? 'Lỗi khi cập nhật Subdomain' : 'Failed to update subdomain');
    } finally {
      setSavingSubdomain(false);
    }
  };

  const handleAddCustomDomain = () => {
    const clean = customDomain.trim().toLowerCase().replace(/https?:\/\//, '').replace(/\/$/, '');
    if (!clean || !clean.includes('.')) {
      toast.error(language === 'vi' ? 'Vui lòng nhập tên miền hợp lệ' : 'Please enter a valid domain');
      return;
    }
    if (attachedDomains.includes(clean)) {
      toast.error(language === 'vi' ? 'Tên miền này đã được thêm trong danh sách' : 'Domain already added');
      return;
    }
    const updated = [...attachedDomains, clean];
    setAttachedDomains(updated);
    localStorage.setItem(`custom_domains_${user?.id}`, JSON.stringify(updated));
    setCustomDomain('');
    setAddingCustomDomain(false);
    toast.success(language === 'vi' ? `Đã kết nối tên miền ${clean}` : `Connected custom domain ${clean}`);
  };

  const primarySubdomain = `${username || 'user'}.webcuaban.site`;

  return (
    <div className="w-full space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2">
        <div className="space-y-1">
          <h1 className="text-[26px] sm:text-[28px] font-black text-slate-900 tracking-tight">
            {t('dash.domains.title')}
          </h1>
          <p className="text-[16px] text-slate-600 font-medium">
            {t('dash.domains.subtitle')}
          </p>
        </div>

        <Link to="/templates" className="shrink-0">
          <Button className="gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[16px] px-6 py-3.5 rounded-2xl transition-all">
            <ShoppingBag className="w-5 h-5" /> {t('dash.nav.templateShop')}
          </Button>
        </Link>
      </div>

      {/* SECTION 1: Subdomain Gốc Của User (p-6, text >= 14px, no shadow) */}
      <div className="p-6 bg-white border border-slate-200/90 rounded-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-[20px] font-bold text-slate-900">{t('dash.domains.brandSpace')}</h2>
                <span className="text-[14px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-0.5 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> {t('dash.domains.active')}
                </span>
              </div>
              <p className="text-[14px] text-slate-500 mt-0.5">{t('dash.domains.brandDesc')}</p>
            </div>
          </div>

          {!editingSubdomain ? (
            <Button
              variant="outline"
              onClick={() => setEditingSubdomain(true)}
              className="gap-2 font-bold text-[14px] rounded-xl px-4 py-2.5"
            >
              <Edit3 className="w-4 h-4" /> {t('dash.domains.changeSubdomain')}
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setEditingSubdomain(false)}
                className="text-[14px] rounded-xl px-4 py-2.5"
              >
                {t('dash.domains.cancel')}
              </Button>
              <Button
                onClick={handleSaveSubdomain}
                disabled={savingSubdomain}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[14px] rounded-xl px-4 py-2.5"
              >
                {savingSubdomain ? 'Saving...' : t('dash.domains.saveSubdomain')}
              </Button>
            </div>
          )}
        </div>

        {/* Subdomain Input / Display */}
        <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          {editingSubdomain ? (
            <div className="space-y-3">
              <label className="text-[14px] font-bold text-slate-700 uppercase tracking-wider block">
                {language === 'vi' ? 'Nhập Tên Subdomain Mong Muốn (Không Trùng Lặp)' : 'Enter Desired Subdomain'}
              </label>
              <div className="flex items-center gap-2.5">
                <span className="text-[16px] font-bold text-slate-500 font-mono">https://</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="username"
                  className="bg-white border-2 border-indigo-500 rounded-xl px-4 py-2.5 font-mono font-bold text-indigo-700 text-[16px] outline-none"
                />
                <span className="text-[16px] font-bold text-slate-700 font-mono">.webcuaban.site</span>
              </div>
              <p className="text-[13px] text-slate-500">
                {language === 'vi' ? 'Chỉ dùng chữ cái viết thường không dấu, số và gạch ngang (a-z, 0-9, -).' : 'Only lowercase letters, numbers and hyphens (a-z, 0-9, -).'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[18px] font-black text-indigo-700">
                  https://{primarySubdomain}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => copyToClipboard(`https://${primarySubdomain}`, 'primary')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[14px] font-bold transition-all cursor-pointer"
                >
                  {copiedKey === 'primary' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{t('dash.myPortfolios.copy')}</span>
                </button>
                <a
                  href={`https://${primarySubdomain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[14px] font-bold transition-all cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" /> {t('dash.domains.openWeb')}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: Danh Sách Template Đã Mua (p-6, text >= 14px, no shadow) */}
      <div className="p-6 bg-white border border-slate-200/90 rounded-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[20px] font-bold text-slate-900">{t('dash.domains.ownedTemplates')}</h2>
              <p className="text-[14px] text-slate-500">{t('dash.domains.ownedDesc')}</p>
            </div>
          </div>
          
          <span className="text-[14px] font-bold text-slate-600 bg-slate-100 px-3.5 py-1.5 rounded-full">
            {portfolios.length} Websites
          </span>
        </div>

        {portfolios.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-6 space-y-3">
            <Layers className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-slate-700 text-[16px] font-bold">{t('dash.myPortfolios.empty')}</p>
            <p className="text-slate-500 text-[14px]">{t('dash.myPortfolios.emptyDesc')}</p>
            <Button
              onClick={() => window.location.href = '/templates'}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[14px] rounded-xl px-5 py-2.5"
            >
              {t('dash.nav.templateShop')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {portfolios.map((p, idx) => {
              const subpath = p.template?.slug || p.subdomain || `portfolio-${idx + 1}`;
              const fullTemplateUrl = `https://${primarySubdomain}/${subpath}`;
              const adminUrl = `https://${primarySubdomain}/${subpath}/admin.html`;

              return (
                <div 
                  key={p.id || idx}
                  className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-indigo-300 transition-all"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="font-extrabold text-slate-900 text-[16px]">{p.name || 'Portfolio'}</span>
                      <span className="text-[13px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-md font-bold">
                        #{idx + 1}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[14px]">
                      <span className="text-slate-600 font-mono font-medium flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-slate-400" />
                        <strong className="text-indigo-600">{fullTemplateUrl}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                      onClick={() => copyToClipboard(fullTemplateUrl, `p-${idx}`)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[14px] font-bold cursor-pointer"
                    >
                      {copiedKey === `p-${idx}` ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      <span>{t('dash.myPortfolios.copy')}</span>
                    </button>

                    <a
                      href={fullTemplateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[14px] font-bold cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4 text-slate-500" /> {t('dash.myPortfolios.viewWeb')}
                    </a>

                    <a
                      href={adminUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[14px] font-bold cursor-pointer"
                    >
                      <Terminal className="w-4 h-4" /> {t('dash.myPortfolios.adminWeb')}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: Kết Nối Tên Miền Riêng (p-6, text >= 14px, no shadow) */}
      <div className="p-6 bg-white border border-slate-200/90 rounded-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[20px] font-bold text-slate-900">{t('dash.domains.customDomain')}</h2>
              <p className="text-[14px] text-slate-500">{t('dash.domains.customDomainDesc')}</p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => setAddingCustomDomain(!addingCustomDomain)}
            className="gap-2 bg-white hover:bg-indigo-50/60 text-indigo-600 border border-indigo-600 hover:border-indigo-700 font-bold text-[14px] rounded-xl px-4 py-2.5 shadow-none transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-indigo-600" /> {t('dash.domains.addCustomDomain')}
          </Button>
        </div>

        {addingCustomDomain && (
          <div className="p-5 rounded-xl bg-indigo-50/50 border border-indigo-200 space-y-3">
            <h3 className="text-[14px] font-bold text-indigo-900 uppercase tracking-wider">
              {language === 'vi' ? 'Kết Nối Tên Miền Của Bạn' : 'Connect Your Domain'}
            </h3>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <Input
                type="text"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="e.g. johnsmith.com or portfolio.vn"
                className="bg-white font-mono text-[14px]"
              />
              <Button
                onClick={handleAddCustomDomain}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[14px] rounded-xl px-6 py-2.5 shrink-0"
              >
                {language === 'vi' ? 'Xác Nhận Kết Nối' : 'Confirm Connection'}
              </Button>
            </div>
          </div>
        )}

        {/* Attached Custom Domains List */}
        {attachedDomains.length > 0 && (
          <div className="space-y-3">
            <span className="text-[14px] font-bold text-slate-700 uppercase tracking-wider">
              {language === 'vi' ? 'Tên Miền Đã Kết Nối:' : 'Connected Domains:'}
            </span>
            {attachedDomains.map((dom, idx) => (
              <div 
                key={idx}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-emerald-600" />
                  <span className="font-mono font-bold text-slate-900 text-[15px]">{dom}</span>
                  <span className="text-[13px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-0.5 rounded-full flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> SSL Active
                  </span>
                </div>

                <button
                  onClick={() => {
                    const filtered = attachedDomains.filter((_, i) => i !== idx);
                    setAttachedDomains(filtered);
                    localStorage.setItem(`custom_domains_${user?.id}`, JSON.stringify(filtered));
                    toast.success(language === 'vi' ? `Đã hủy kết nối tên miền ${dom}` : `Disconnected domain ${dom}`);
                  }}
                  className="text-[14px] text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
                >
                  {language === 'vi' ? 'Gỡ bỏ' : 'Remove'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* DNS Configuration Guide Box */}
        <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-[14px]">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <span>{t('dash.domains.dnsGuide')}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[13px] bg-white rounded-xl border border-slate-200 overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">Host / Name</th>
                  <th className="p-3">Points to</th>
                  <th className="p-3">TTL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                <tr>
                  <td className="p-3 font-bold text-indigo-600">CNAME</td>
                  <td className="p-3">@ or www</td>
                  <td className="p-3 font-bold">cname.webcuaban.site</td>
                  <td className="p-3 text-slate-500">Auto (3600)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[13px] text-slate-500 leading-relaxed">
            {language === 'vi' 
              ? 'Hệ thống tự động cấp chứng chỉ bảo mật SSL 256-bit miễn phí trọn đời trong vòng 1-5 phút sau khi bạn trỏ DNS thành công.'
              : 'Free 256-bit SSL certificate will be issued automatically within 1-5 minutes after DNS propagation.'}
          </p>
        </div>
      </div>
    </div>
  );
}
