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

// Admin Pages
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

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Toaster position="top-right" richColors toastOptions={{ className: 'font-sans' }} />
          <Routes>
            {/* Public Shop Routes */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<Home />} />
              <Route path="templates" element={<Templates />} />
              <Route path="templates/:slug" element={<TemplateDetail />} />
              <Route path="category/:slug" element={<Category />} />
            </Route>
            
            {/* Wildcard Subdomain Public Portfolio Viewer */}
            <Route path="/p/:slug" element={<PublicPortfolioViewer />} />
            <Route path="/p" element={<PublicPortfolioViewer />} />
            <Route path="/site/:slug" element={<PublicPortfolioViewer />} />

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
                <Route path="orders" element={<Orders />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>

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

            {/* Catch-all Broken Route Handler */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}

