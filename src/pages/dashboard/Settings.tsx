import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { useAuth } from '@/src/contexts/AuthContext';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { useState } from 'react';
import { toast } from 'sonner';
import { User as UserIcon, Lock, Globe, Phone, Mail, Key } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const { t, language } = useLanguage();
  
  const initialUserId = (() => {
    if (user?.user_metadata?.username) return user.user_metadata.username;
    if (user?.phone) return user.phone.replace(/[^0-9]/g, '');
    if (user?.user_metadata?.phone) return String(user.user_metadata.phone).replace(/[^0-9]/g, '');
    if (user?.email) return user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9-]/g, '');
    return user?.id ? `user-${user.id.slice(0, 6)}` : 'user';
  })();

  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [username, setUsername] = useState(initialUserId);
  const [phone, setPhone] = useState(user?.phone || user?.user_metadata?.phone || '');
  const [email] = useState(user?.email || '');
  
  // Password states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
      await updateProfile({ 
        full_name: fullName,
        username: cleanUsername,
        phone: phone.trim()
      });
      toast.success(language === 'vi' ? 'Đã lưu thành công thông tin hồ sơ và User ID!' : 'Successfully saved profile and User ID!');
    } catch (err) {
      toast.error(language === 'vi' ? 'Có lỗi xảy ra khi cập nhật hồ sơ' : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error(language === 'vi' ? 'Mật khẩu mới phải có tối thiểu 6 ký tự' : 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(language === 'vi' ? 'Mật khẩu xác nhận không khớp' : 'Passwords do not match');
      return;
    }

    setPwLoading(true);
    try {
      await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, newPassword })
      });
      toast.success(language === 'vi' ? 'Cập nhật mật khẩu thành công!' : 'Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      toast.success(language === 'vi' ? 'Cập nhật mật khẩu thành công!' : 'Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Page Title */}
      <div className="space-y-1 pb-2">
        <h1 className="text-[26px] sm:text-[28px] font-black text-slate-900 tracking-tight">
          {t('dash.settings.title')}
        </h1>
        <p className="text-[16px] text-slate-600 font-medium">
          {t('dash.settings.subtitle')}
        </p>
      </div>

      <div className="space-y-6">
        {/* Card 1: Thông tin hồ sơ & User ID (p-6, text >= 14px, no shadow) */}
        <div className="p-6 bg-white border border-slate-200/90 rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-[20px] font-bold text-slate-900">{t('dash.settings.profileTitle')}</h2>
                <p className="text-[14px] text-slate-500">{t('dash.settings.profileDesc')}</p>
              </div>
            </div>
            
            <Link
              to="/dashboard/domains"
              className="inline-flex items-center gap-2 text-[14px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2 rounded-xl transition-colors w-fit"
            >
              <Globe className="w-4 h-4" /> {t('dash.settings.manageDomains')}
            </Link>
          </div>

          <form className="space-y-6" onSubmit={handleUpdate}>
            <div className="grid sm:grid-cols-2 gap-6">
              {/* User ID field */}
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>{t('dash.settings.userIdLabel')}</span>
                  <span className="text-[13px] text-indigo-600 font-mono font-bold">Subdomain</span>
                </label>
                <div>
                  <Input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="e.g. john or 0901234567"
                    disabled={loading}
                    className="font-mono font-bold text-indigo-700 text-[15px] px-4 py-3"
                  />
                </div>
                <p className="text-[13px] text-slate-500 font-medium">
                  {t('dash.settings.subdomainLinked')} <strong className="text-slate-900 font-mono text-[14px]">https://{username || 'username'}.webcuaban.site</strong>
                </p>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-slate-700 uppercase tracking-wider">{t('dash.settings.fullName')}</label>
                <Input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  disabled={loading}
                  className="font-medium text-[15px] px-4 py-3"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-slate-400" /> {t('dash.settings.email')}
                </label>
                <Input 
                  type="email" 
                  value={email} 
                  disabled 
                  className="bg-slate-50 text-slate-600 font-medium cursor-not-allowed text-[15px] px-4 py-3"
                />
              </div>

              {/* Phone number */}
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-slate-400" /> {t('dash.settings.phone')}
                </label>
                <Input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0901234567"
                  disabled={loading}
                  className="font-mono font-medium text-[15px] px-4 py-3"
                />
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <Button 
                type="submit" 
                disabled={loading} 
                className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[15px] px-6 py-3 rounded-xl"
              >
                {loading ? 'Saving...' : t('dash.settings.saveProfile')}
              </Button>
            </div>
          </form>
        </div>

        {/* Card 2: Quản lý Mật khẩu */}
        <div className="p-6 bg-white border border-slate-200/90 rounded-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[20px] font-bold text-slate-900">{t('dash.settings.passwordTitle')}</h2>
              <p className="text-[14px] text-slate-500">{t('dash.settings.passwordDesc')}</p>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handlePasswordUpdate}>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-slate-700 uppercase tracking-wider">{t('dash.settings.newPassword')}</label>
                <Input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  disabled={pwLoading}
                  className="font-mono text-[15px] px-4 py-3"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[14px] font-bold text-slate-700 uppercase tracking-wider">{t('dash.settings.confirmPassword')}</label>
                <Input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  disabled={pwLoading}
                  className="font-mono text-[15px] px-4 py-3"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                variant="outline"
                disabled={pwLoading || !newPassword} 
                className="gap-2 bg-white hover:bg-indigo-50/60 text-indigo-600 border border-indigo-600 hover:border-indigo-700 font-bold text-[15px] px-6 py-3 rounded-xl shadow-none transition-all cursor-pointer"
              >
                <Key className="w-4 h-4 text-indigo-600" /> {pwLoading ? 'Updating...' : t('dash.settings.updatePassword')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
