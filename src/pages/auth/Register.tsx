import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { supabase } from '@/src/lib/supabase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/src/contexts/LanguageContext';

export default function Register() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      return toast.error('Please fill in all fields');
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      toast.success('Registration successful! Please log in.');
      navigate('/auth/login');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900">{t('auth.register.title')}</h1>
        <p className="text-slate-500 font-medium">{t('auth.register.subtitle')}</p>
      </div>

      <form className="space-y-4" onSubmit={handleRegister}>
        <div className="space-y-4">
          <Input 
            type="text" 
            placeholder={t('auth.fullname')} 
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={loading}
          />
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
        
        <Button type="submit" className="w-full gap-2" size="lg" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {t('auth.register.submit')}
        </Button>
      </form>

      <p className="text-center text-sm font-medium text-slate-600">
        {t('auth.register.hasAccount')}{' '}
        <Link to="/auth/login" className="text-brand-600 font-bold hover:text-brand-500">
          {t('auth.login.submit')}
        </Link>
      </p>
    </div>
  );
}
