import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { useAuth } from '@/src/contexts/AuthContext';
import { useState } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/src/contexts/LanguageContext';

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const { t } = useLanguage();
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({ full_name: fullName });
      toast.success(t('dash.settings.save') + ' thành công!');
    } catch (err) {
      toast.error('Có lỗi xảy ra khi cập nhật');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">{t('dash.settings.title')}</h1>
        <p className="text-slate-500 font-medium mt-1">{t('dash.settings.subtitle')}</p>
      </div>

      <div className="space-y-6">
        <Card className="p-6 md:p-8 bg-white border border-slate-100 shadow-sm rounded-3xl">
          <h2 className="text-xl font-bold text-slate-900 mb-6">{t('dash.settings.profileInfo')}</h2>
          <form className="space-y-5" onSubmit={handleUpdate}>
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">{t('auth.fullname')}</label>
                <Input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Alex Trần"
                  disabled={loading}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">{t('auth.email')}</label>
                <Input 
                  type="email" 
                  value={user?.email || ''} 
                  disabled 
                  className="bg-slate-50 text-slate-500"
                />
                <p className="text-xs text-slate-400 font-medium mt-1">{t('dash.settings.emailDesc')}</p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <Button type="submit" disabled={loading} className="gap-2 shadow-soft-md">
                {loading ? 'Đang lưu...' : t('dash.settings.save')}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
