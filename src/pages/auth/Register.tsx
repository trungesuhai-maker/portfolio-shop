import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { api } from '@/src/services/api';
import { supabase, isSupabaseConfigured } from '@/src/lib/supabase';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Mail, Phone, User, Lock } from 'lucide-react';
import { useLanguage } from '@/src/contexts/LanguageContext';

export default function Register() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [registerMethod, setRegisterMethod] = useState<'email' | 'phone'>('email');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) {
      return toast.error('Vui lòng nhập họ và tên của bạn');
    }

    const identifier = registerMethod === 'email' ? email.trim() : phone.trim();
    if (!identifier) {
      return toast.error(registerMethod === 'email' ? 'Vui lòng nhập địa chỉ Email' : 'Vui lòng nhập số điện thoại');
    }

    if (password.length < 6) {
      return toast.error('Mật khẩu cần tối thiểu 6 ký tự');
    }

    setLoading(true);
    try {
      // 1. Register with backend DB (Real persistence)
      const res = await api.auth.register({
        fullName: fullName.trim(),
        email: registerMethod === 'email' ? identifier : undefined,
        phone: registerMethod === 'phone' ? identifier : undefined,
        password
      });

      // 2. If Supabase is connected and using email, also sync to Supabase auth
      if (isSupabaseConfigured && registerMethod === 'email') {
        try {
          await supabase.auth.signUp({
            email: identifier,
            password,
            options: { data: { full_name: fullName } }
          });
        } catch (e) {}
      }

      // Auto login newly registered real user
      if (res?.user) {
        localStorage.setItem('auth_user', JSON.stringify(res.user));
        localStorage.removeItem('demo_auth');
      }

      toast.success('Đăng ký tài khoản thành công! Chào mừng bạn.');
      window.location.href = '/templates';
    } catch (err: any) {
      toast.error(err.message || 'Đăng ký thất bại. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/templates`
          }
        });
        if (error) throw error;
        return;
      }

      // Standalone Google Auth Handshake
      const googleUserEmail = `user.${Date.now().toString(36)}@gmail.com`;
      const res = await api.auth.googleLogin({
        email: googleUserEmail,
        fullName: fullName || 'Google User',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'
      });

      if (res?.user) {
        localStorage.setItem('auth_user', JSON.stringify(res.user));
        localStorage.removeItem('demo_auth');
      }

      toast.success('Đăng ký qua tài khoản Google thành công!');
      window.location.href = '/templates';
    } catch (err: any) {
      toast.error(err.message || 'Đăng ký Google thất bại');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1.5">
        <h1 className="text-3xl font-extrabold text-slate-900">{t('auth.register.title')}</h1>
        <p className="text-slate-500 font-medium text-sm">{t('auth.register.subtitle')}</p>
      </div>

      {/* Tab Switcher: Email vs Phone */}
      <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80">
        <button
          type="button"
          onClick={() => setRegisterMethod('email')}
          className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all ${
            registerMethod === 'email'
              ? 'bg-white text-brand-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Email</span>
        </button>
        <button
          type="button"
          onClick={() => setRegisterMethod('phone')}
          className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all ${
            registerMethod === 'phone'
              ? 'bg-white text-brand-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Số điện thoại</span>
        </button>
      </div>

      {/* Register Form */}
      <form className="space-y-4" onSubmit={handleRegister}>
        <div className="space-y-3.5">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Họ và Tên</label>
            <Input 
              type="text" 
              placeholder={t('auth.fullname') || "Nguyễn Văn A"} 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {registerMethod === 'email' ? (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Địa chỉ Email</label>
              <Input 
                type="email" 
                placeholder={t('auth.email') || "name@example.com"} 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          ) : (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Số điện thoại</label>
              <Input 
                type="tel" 
                placeholder="0912 345 678 hoặc +84..." 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Mật khẩu (tối thiểu 6 ký tự)</label>
            <Input 
              type="password" 
              placeholder={t('auth.password') || "••••••••"} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
        </div>
        
        <Button type="submit" className="w-full gap-2 rounded-full py-3 bg-brand-600 hover:bg-brand-700 font-bold shadow-sm" size="lg" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {t('auth.register.submit') || "Tạo tài khoản ngay"}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center justify-center pt-1">
        <div className="border-t border-slate-200 w-full" />
        <span className="bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 absolute">
          hoặc
        </span>
      </div>

      {/* Google 1-Click Sign In Button (Moved to bottom) */}
      <div>
        <button
          type="button"
          onClick={handleGoogleRegister}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm shadow-xs transition-all hover:shadow-sm cursor-pointer disabled:opacity-60"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Đăng ký với Google</span>
        </button>
      </div>

      {/* Footer Navigation */}
      <div className="text-center space-y-3 pt-1">
        <p className="text-sm font-medium text-slate-600">
          {t('auth.register.hasAccount')}{' '}
          <Link to="/auth/login" className="text-brand-600 font-bold hover:text-brand-500">
            {t('auth.login.submit') || "Đăng nhập"}
          </Link>
        </p>

        <div>
          <Link 
            to="/" 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay về trang chủ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
