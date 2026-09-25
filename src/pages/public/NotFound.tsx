import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, ArrowLeft, ShieldAlert } from 'lucide-react';

export default function NotFound() {
  const location = useLocation();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="relative inline-flex items-center justify-center">
          <div className="w-24 h-24 rounded-3xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shadow-sm animate-pulse">
            <ShieldAlert className="w-12 h-12" />
          </div>
          <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-xs font-mono font-bold">
            404
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Không tìm thấy đường dẫn
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Đường dẫn <code className="px-1.5 py-0.5 bg-slate-100 text-brand-600 rounded text-xs font-mono break-all">{location.pathname}</code> không tồn tại hoặc đã được thay đổi.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white font-medium text-sm hover:bg-brand-700 transition shadow-sm"
          >
            <Home className="w-4 h-4" />
            <span>Trang chủ</span>
          </Link>
          <Link
            to="/templates"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium text-sm hover:bg-slate-50 transition"
          >
            <Compass className="w-4 h-4" />
            <span>Khám phá Template</span>
          </Link>
        </div>

        <div className="pt-4 border-t border-slate-100 text-xs text-slate-400">
          Hệ thống bảo mật Portio — Định tuyến an toàn & Cô lập đường dẫn
        </div>
      </div>
    </div>
  );
}
