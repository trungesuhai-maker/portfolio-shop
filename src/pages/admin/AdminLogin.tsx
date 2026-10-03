import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, User, ArrowLeft, Loader2, KeyRound, Sparkles, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { api } from '@/src/services/api';
import { useAuth } from '@/src/contexts/AuthContext';
import { toast } from 'sonner';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  // Prefilled default admin credentials as requested
  const DEFAULT_ADMIN_ID = 'admin@portio.com';
  const DEFAULT_ADMIN_PASS = 'admin123';

  const [identifier, setIdentifier] = useState(DEFAULT_ADMIN_ID);
  const [password, setPassword] = useState(DEFAULT_ADMIN_PASS);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // If already logged in as admin, redirect to /admin
  useEffect(() => {
    if (isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [isAdmin, navigate]);

  const handleResetToDefault = () => {
    setIdentifier(DEFAULT_ADMIN_ID);
    setPassword(DEFAULT_ADMIN_PASS);
    toast.info('Đã điền lại tài khoản & mật khẩu Admin mặc định');
  };

  const executeAdminLogin = async (idVal: string, passVal: string) => {
    if (!idVal.trim()) {
      toast.error('Vui lòng nhập ID hoặc Email Quản trị viên');
      return;
    }
    if (!passVal) {
      toast.error('Vui lòng nhập mật khẩu Quản trị viên');
      return;
    }

    setLoading(true);
    try {
      // 1. Call server authentication
      const res = await api.auth.login({
        identifier: idVal.trim(),
        email: idVal.includes('@') ? idVal.trim() : undefined,
        password: passVal
      });

      // 2. Guarantee admin privileges
      const adminUser = res?.user ? {
        ...res.user,
        role: 'admin',
        user_metadata: {
          ...res.user.user_metadata,
          name: res.user.fullName || 'Admin Manager',
          role: 'admin'
        }
      } : {
        id: 'usr-admin',
        email: 'admin@portio.com',
        fullName: 'Admin Manager',
        role: 'admin',
        user_metadata: { name: 'Admin Manager', role: 'admin' }
      };

      // 3. Save admin session to localStorage
      localStorage.setItem('auth_user', JSON.stringify(adminUser));
      localStorage.setItem('demo_auth', 'true');
      if (res?.token) {
        localStorage.setItem('auth_token', res.token);
      }

      toast.success('Đăng nhập Quản trị viên thành công!');
      
      // Navigate to admin overview
      setTimeout(() => {
        window.location.href = '/admin';
      }, 300);
    } catch (err: any) {
      // Offline / Local sandbox fallback: If default admin credentials match, allow access
      if ((idVal === 'admin' || idVal === 'admin@portio.com') && passVal === 'admin123') {
        const fallbackAdmin = {
          id: 'usr-admin',
          email: 'admin@portio.com',
          fullName: 'Admin Manager',
          role: 'admin',
          created_at: new Date().toISOString(),
          user_metadata: { name: 'Admin Manager', role: 'admin' }
        };
        localStorage.setItem('auth_user', JSON.stringify(fallbackAdmin));
        localStorage.setItem('demo_auth', 'true');
        toast.success('Đăng nhập Quản trị viên thành công (Hệ thống nội bộ)!');
        window.location.href = '/admin';
      } else {
        toast.error(err.message || 'Tài khoản hoặc mật khẩu Quản trị viên không chính xác!');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeAdminLogin(identifier, password);
  };

  const handleQuickLogin = () => {
    setIdentifier(DEFAULT_ADMIN_ID);
    setPassword(DEFAULT_ADMIN_PASS);
    executeAdminLogin(DEFAULT_ADMIN_ID, DEFAULT_ADMIN_PASS);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans selection:bg-brand-500 selection:text-white">
      {/* Background Glow & Mesh Elements */}
      <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-brand-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      {/* Top Left Navigation Back to Store */}
      <div className="absolute top-6 left-6 z-30">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-800 backdrop-blur-md transition-all shadow-md hover:scale-105"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-brand-400" />
          <span>Về cửa hàng</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Portal Shield Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-xl shadow-brand-500/20 ring-4 ring-slate-900 border border-brand-400/30 mx-auto">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-950/80 border border-brand-500/30 text-brand-400 text-[11px] font-bold tracking-wider uppercase mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
              Cổng Quản Trị Hệ Thống
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Đăng nhập Admin
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
              Khu vực giới hạn dành riêng cho Ban Quản trị Portio
            </p>
          </div>
        </div>

        {/* Card Box */}
        <div className="mt-8 bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
          
          {/* Prefilled Credentials Callout */}
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-brand-950/70 via-slate-800/60 to-slate-800/40 border border-brand-500/30 text-xs">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-bold text-brand-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-400" />
                Tài khoản Admin đã được điền sẵn
              </span>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-[11px] font-semibold text-slate-400 hover:text-brand-300 underline cursor-pointer"
                title="Khôi phục tài khoản mặc định"
              >
                Điền lại
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px] text-slate-300">
              <div className="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-sans">ID / Email</span>
                <span className="text-brand-200 font-bold truncate block">{DEFAULT_ADMIN_ID}</span>
              </div>
              <div className="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-sans">Mật khẩu</span>
                <span className="text-emerald-400 font-bold block">{DEFAULT_ADMIN_PASS}</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Tài khoản Quản trị viên (ID hoặc Email)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={loading}
                  required
                  placeholder="admin@portio.com hoặc admin"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-950/90 border border-slate-700/80 text-sm font-mono text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Mật khẩu Quản trị
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Ẩn' : 'Hiện'}</span>
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-10 rounded-xl bg-slate-950/90 border border-slate-700/80 text-sm font-mono text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <KeyRound className="w-4 h-4 text-brand-200" />
                )}
                <span>Đăng nhập vào Bảng Điều Khiển Admin</span>
              </Button>

              <button
                type="button"
                onClick={handleQuickLogin}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>⚡ Vào thẳng Admin bằng 1-Click (Tự động điền)</span>
              </button>
            </div>
          </form>

          {/* User Login Switch */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-500">
              Bạn là khách hàng thông thường?{' '}
              <Link to="/auth/login" className="text-brand-400 hover:text-brand-300 font-semibold underline">
                Đăng nhập tài khoản khách hàng
              </Link>
            </p>
          </div>
        </div>

        {/* Security watermark footer */}
        <div className="mt-6 text-center text-[11px] font-mono text-slate-600 flex items-center justify-center gap-2">
          <span>PORTIO_SECURE_ADMIN_GATEWAY</span>
          <span>•</span>
          <span>v2.4.0</span>
        </div>
      </div>
    </div>
  );
}
