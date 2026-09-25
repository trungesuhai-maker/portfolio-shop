import { Outlet, Link, Navigate } from 'react-router-dom';
import { Store } from 'lucide-react';
import { Card } from '../ui/Card';
import { useAuth } from '@/src/contexts/AuthContext';
import { Loading } from '../ui/Loading';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';

export function AuthLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#FFFCF9]">
        <Loading />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#FFFCF9]">
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-blue-100/60 to-purple-100/60 blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-orange-100/60 to-pink-100/60 blur-3xl opacity-60 pointer-events-none" />
      
      {/* Absolute Language Switcher */}
      <div className="absolute top-6 right-6 z-50">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-black group-hover:scale-105 transition-transform shadow-md">
               P
            </div>
            <span className="text-slate-900 font-extrabold text-3xl tracking-tight">Portio</span>
          </Link>
        </div>
        
        <Card className="p-8 sm:p-10 rounded-[40px] shadow-soft-lg border border-white/50 bg-white/80 backdrop-blur-sm">
          <Outlet />
        </Card>
      </div>
    </div>
  );
}
