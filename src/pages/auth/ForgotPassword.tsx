import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { supabase } from '@/src/lib/supabase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/src/contexts/LanguageContext';

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      return toast.error('Please enter your email address');
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-extrabold text-slate-900">Check your email</h1>
        <p className="text-slate-500 font-medium">
          We have sent a password reset link to <span className="text-slate-900 font-bold">{email}</span>.
        </p>
        <Link to="/auth/login">
          <Button className="w-full mt-4" size="lg">Back to login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900">{t('auth.forgot.title')}</h1>
        <p className="text-slate-500 font-medium">{t('auth.forgot.subtitle')}</p>
      </div>

      <form className="space-y-4" onSubmit={handleReset}>
        <Input 
          type="email" 
          placeholder={t('auth.email')} 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        
        <Button type="submit" className="w-full gap-2" size="lg" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {t('auth.forgot.submit')}
        </Button>
      </form>

      <p className="text-center text-sm font-medium text-slate-600">
        {t('auth.forgot.remembered')}{' '}
        <Link to="/auth/login" className="text-brand-600 font-bold hover:text-brand-500">
          {t('auth.login.submit')}
        </Link>
      </p>
    </div>
  );
}
