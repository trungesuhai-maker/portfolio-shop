import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { supabase } from '@/src/lib/supabase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/src/contexts/LanguageContext';

export default function Login() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAdminLogin = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    localStorage.setItem('demo_auth', 'true');
    window.location.href = '/admin';
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    
    // Simulate network delay
    await new Promise(r => setTimeout(r, 400));
    
    localStorage.setItem('demo_auth', 'true');
    
    const params = new URLSearchParams(window.location.search);
    const returnUrl = params.get('returnUrl') || '/dashboard';
    
    window.location.href = returnUrl;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error('Please enter email and password');
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      toast.success('Welcome back!');
      const params = new URLSearchParams(window.location.search);
      const returnUrl = params.get('returnUrl') || '/dashboard';
      navigate(returnUrl);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900">{t('auth.login.title')}</h1>
        <p className="text-slate-500 font-medium">{t('auth.login.subtitle')}</p>
      </div>

      <form className="space-y-4" onSubmit={handleLogin}>
        <div className="space-y-4">
          <Input 
            type="email" 
            placeholder={t('auth.email')} 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <Input 
            type="password" 
            placeholder={t('auth.password')} 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded border-slate-300 text-brand-500 focus:ring-brand-500" />
            <span className="text-sm font-medium text-slate-600">{t('auth.remember')}</span>
          </label>
          <Link to="/auth/forgot-password" className="text-sm font-bold text-brand-600 hover:text-brand-500">
            {t('auth.forgotPass')}
          </Link>
        </div>

        <Button type="submit" className="w-full gap-2" size="lg" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {t('auth.login.submit')}
        </Button>
        
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-500 font-medium">Or</span>
          </div>
        </div>

        <div className="space-y-2">
          <Button 
            type="button" 
            variant="outline" 
            className="w-full gap-2 border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold" 
            size="lg" 
            disabled={loading}
            onClick={handleAdminLogin}
          >
            Đăng nhập quyền Admin (Vào Admin Panel)
          </Button>

          <Button 
            type="button" 
            variant="outline" 
            className="w-full gap-2 border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-medium" 
            size="lg" 
            disabled={loading}
            onClick={handleDemoLogin}
          >
            Đăng nhập tài khoản Demo khách hàng
          </Button>
        </div>
      </form>

      <p className="text-center text-sm font-medium text-slate-600">
        {t('auth.login.noAccount')}{' '}
        <Link to="/auth/register" className="text-brand-600 font-bold hover:text-brand-500">
          {t('auth.login.register')}
        </Link>
      </p>
    </div>
  );
}
