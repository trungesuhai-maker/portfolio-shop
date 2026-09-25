import { useState } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Component, 
  FolderTree, 
  ShoppingBag, 
  Users, 
  FileCode2, 
  CreditCard, 
  Globe, 
  Sliders, 
  Search, 
  ScrollText, 
  ShieldAlert, 
  LogOut, 
  ExternalLink,
  Menu,
  X,
  HardDrive,
  ShieldCheck,
  GitBranch,
  Rocket,
  Smartphone
} from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const navItems = [
    { name: 'Tổng quan', path: '/admin', icon: LayoutDashboard },
    { name: '1-Click Deploy & APK Sync', path: '/admin/deploy', icon: Rocket },
    { name: 'Quản lý Template', path: '/admin/templates', icon: Component },
    { name: 'Danh mục', path: '/admin/categories', icon: FolderTree },
    { name: 'Đơn hàng', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Khách hàng', path: '/admin/customers', icon: Users },
    { name: 'Danh sách Instance', path: '/admin/portfolios', icon: FileCode2 },
    { name: 'Kho lưu trữ (Storage)', path: '/admin/storage', icon: HardDrive },
    { name: 'Thanh toán', path: '/admin/payments', icon: CreditCard },
    { name: 'Tên miền & DNS', path: '/admin/domains', icon: Globe },
    { name: 'Cài đặt cửa hàng', path: '/admin/settings', icon: Sliders },
    { name: 'Cấu hình SEO', path: '/admin/seo', icon: Search },
    { name: 'Kiểm toán Bảo mật (Audit)', path: '/admin/security', icon: ShieldCheck },
    { name: 'Nhật ký hệ thống', path: '/admin/logs', icon: ScrollText },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <Link to="/admin" className="flex items-center gap-2.5 text-white font-bold text-lg">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <span>Portio Admin</span>
          </Link>
          <button 
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="px-4 pt-4 pb-2">
          <span className="text-sm font-bold text-slate-400 uppercase tracking-wider px-3">Menu Quản trị</span>
        </div>

        <nav className="flex-1 py-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/admin'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-brand-600 text-white font-semibold shadow-sm' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-brand-400" />
              Xem cửa hàng trực tiếp
            </span>
            <span className="bg-slate-800 text-sm px-2 py-0.5 rounded text-slate-300 font-medium">Live</span>
          </Link>

          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2.5 px-3 py-2 w-full rounded-xl text-sm font-semibold text-slate-400 hover:bg-red-950/40 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Về Dashboard khách hàng
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <header className="h-16 bg-white border-b-2 border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 animate-pulse" />
              <h2 className="text-base font-bold text-slate-800 hidden sm:inline">Bảng điều khiển hệ thống quản trị</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900">{user?.user_metadata?.name || 'Quản trị viên'}</p>
              <p className="text-sm text-slate-500 font-mono">admin@portio.com</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 font-bold text-sm flex items-center justify-center ring-2 ring-brand-500/20">
              AD
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-y-auto w-full">
          <div className="w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
