import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

// Layouts
import { PublicLayout } from './components/layout/PublicLayout';
import { AuthLayout } from './components/layout/AuthLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Public Pages
import Home from './pages/public/Home';
import Templates from './pages/public/Templates';
import TemplateDetail from './pages/public/TemplateDetail';
import Category from './pages/public/Category';
import PortfolioEditor from './pages/dashboard/PortfolioEditor';

import SandboxPayment from './pages/public/SandboxPayment';
import CheckoutPayment from './pages/public/CheckoutPayment';
import PublicPortfolioViewer from './pages/PublicPortfolioViewer';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Dashboard Pages
import DashboardOverview from './pages/dashboard/Overview';
import MyPortfolios from './pages/dashboard/MyPortfolios';
import Orders from './pages/dashboard/Orders';
import Settings from './pages/dashboard/Settings';
import UserDomains from './pages/dashboard/Domains';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminOverview from './pages/admin/AdminOverview';
import AdminTemplates from './pages/admin/AdminTemplates';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminPortfolios from './pages/admin/AdminPortfolios';
import AdminPayments from './pages/admin/AdminPayments';
import AdminDomains from './pages/admin/AdminDomains';
import AdminSettings from './pages/admin/AdminSettings';
import AdminSeo from './pages/admin/AdminSeo';
import AdminStorage from './pages/admin/AdminStorage';
import AdminLogs from './pages/admin/AdminLogs';
import AdminSecurityAudit from './pages/admin/AdminSecurityAudit';
import AdminGitHubSync from './pages/admin/AdminGitHubSync';
import NotFound from './pages/public/NotFound';

function getSubdomainSlug(): string | null {
  if (typeof window === 'undefined') return null;
  const hostname = window.location.hostname.toLowerCase().trim();

  // 1. Primary Shop Domains (Always render main shop homepage, templates, auth, admin)
  const PRIMARY_SHOP_DOMAINS = [
    'webcuaban.site',
    'www.webcuaban.site',
    'portfolio-shop.com',
    'www.portfolio-shop.com',
    'localhost',
    '127.0.0.1'
  ];
  if (PRIMARY_SHOP_DOMAINS.includes(hostname)) {
    return null;
  }

  // Platform deployment domains (Vercel, Google Cloud Run) always render main shop
  if (hostname.endsWith('.vercel.app') || hostname.endsWith('.run.app')) {
    return null;
  }

  // 2. Official wildcard subdomains on webcuaban.site (e.g. alex.webcuaban.site)
  if (hostname.endsWith('.webcuaban.site')) {
    const sub = hostname.slice(0, -('.webcuaban.site'.length));
    if (sub && !['www', 'admin', 'api', 'app', 'dev', 'staging', 'mail'].includes(sub)) {
      return sub;
    }
    return null;
  }

  // 3. Official wildcard subdomains on portfolio-shop.com
  if (hostname.endsWith('.portfolio-shop.com')) {
    const sub = hostname.slice(0, -('.portfolio-shop.com'.length));
    if (sub && !['www', 'admin', 'api', 'app', 'dev', 'staging', 'mail'].includes(sub)) {
      return sub;
    }
    return null;
  }

  // 4. Localhost testing (e.g. john.localhost)
  if (hostname.endsWith('.localhost')) {
    const sub = hostname.slice(0, -('.localhost'.length));
    if (sub && !['www', 'admin', 'api'].includes(sub)) {
      return sub;
    }
    return null;
  }

  // 5. Custom CNAME domains (e.g. resume.designer.com or domain.vn)
  const parts = hostname.split('.');
  if (parts.length >= 3 && !['www', 'admin', 'app', 'api', 'dev', 'preview', 'staging'].includes(parts[0])) {
    return parts[0];
  }
  if (parts.length >= 2) {
    return hostname;
  }

  return null;
}

export default function App() {
  const subdomainSlug = getSubdomainSlug();

  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Toaster position="top-right" richColors toastOptions={{ className: 'font-sans' }} />
          <Routes>
            {/* If accessed via custom subdomain, render PublicPortfolioViewer for ALL subpaths */}
            {subdomainSlug ? (
              <Route path="*" element={<PublicPortfolioViewer />} />
            ) : (
              /* Public Shop Routes */
              <Route path="/" element={<PublicLayout />}>
                <Route index element={<Home />} />
                <Route path="templates" element={<Templates />} />
                <Route path="templates/:slug" element={<TemplateDetail />} />
                <Route path="category/:slug" element={<Category />} />
              </Route>
            )}
            
            {/* Wildcard Subdomain & Subpath Public Portfolio Viewer */}
            <Route path="/p/:slug/*" element={<PublicPortfolioViewer />} />
            <Route path="/p/:slug" element={<PublicPortfolioViewer />} />
            <Route path="/p" element={<PublicPortfolioViewer />} />
            <Route path="/site/:slug/*" element={<PublicPortfolioViewer />} />
            <Route path="/site/:slug" element={<PublicPortfolioViewer />} />
            <Route path="/:subdomain/:templateSlug/*" element={<PublicPortfolioViewer />} />
            <Route path="/:subdomain/:templateSlug" element={<PublicPortfolioViewer />} />

            {/* Standard Checkout & Payment Gateway */}
            <Route path="/checkout" element={<CheckoutPayment />} />
            <Route path="/payment" element={<CheckoutPayment />} />
            <Route path="/sandbox/payment" element={<CheckoutPayment />} />

            {/* Authentication Routes */}
            <Route path="/auth" element={<AuthLayout />}>
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="reset-password" element={<ResetPassword />} />
            </Route>

            {/* Dashboard Editor (Fullscreen, no standard layout) */}
            <Route path="/dashboard/portfolios/:id/edit" element={
              <ProtectedRoute>
                <PortfolioEditor />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/editor/:id" element={
              <ProtectedRoute>
                <PortfolioEditor />
              </ProtectedRoute>
            } />

            {/* Customer Dashboard Routes (Protected) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardOverview />} />
                <Route path="portfolios" element={<MyPortfolios />} />
                <Route path="domains" element={<UserDomains />} />
                <Route path="orders" element={<Orders />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>

            {/* Admin Dedicated Login Portal (Prefilled Admin Credentials) */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Admin Routes (Protected, Admin Only) */}
            <Route element={<ProtectedRoute adminOnly={true} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminOverview />} />
                <Route path="templates" element={<AdminTemplates />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="users" element={<AdminCustomers />} />
                <Route path="github-sync" element={<AdminGitHubSync />} />
                <Route path="sync" element={<AdminGitHubSync />} />
                <Route path="deploy" element={<AdminGitHubSync />} />
                <Route path="portfolios" element={<AdminPortfolios />} />
                <Route path="storage" element={<AdminStorage />} />
                <Route path="payments" element={<AdminPayments />} />
                <Route path="domains" element={<AdminDomains />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="seo" element={<AdminSeo />} />
                <Route path="security" element={<AdminSecurityAudit />} />
                <Route path="logs" element={<AdminLogs />} />
              </Route>
            </Route>

            {/* Direct Subdomain Path e.g. /trungesuhai */}
            <Route path="/:subdomain" element={<PublicPortfolioViewer />} />

            {/* Catch-all Broken Route Handler */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}

