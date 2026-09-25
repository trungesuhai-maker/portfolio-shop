-- ==============================================================================
-- SALEHUB & PORTIO MASTER SUPABASE DATABASE SCHEMA
-- Compatible with: Supabase Postgres, Google Cloud Run, Vercel Serverless
-- Features: 
--  - Multi-Auth: Email/Password, Google OAuth, Phone SMS OTP
--  - Automated Profile Sync via auth.users trigger
--  - Digital Template Store, Categories & Licensing
--  - Orders & Multi-gateway Payments (Sandbox, VNPay, MoMo, Stripe)
--  - Portfolio Instances, Custom Domains & Wildcard Subdomains
--  - Cloudflare R2 Media Storage Asset Index
--  - SEO Meta, System Settings, SMS Verification & Audit Logging
--  - Zero-Trust Row Level Security (RLS) & Role-Based Access Control (RBAC)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. USER PROFILES & AUTHENTICATION (Synced from auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'creator', 'admin', 'superadmin')),
  auth_provider TEXT DEFAULT 'email' CHECK (auth_provider IN ('email', 'google', 'phone', 'github', 'other')),
  balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for speedy lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Automated trigger function to keep public.profiles synchronized with auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  extracted_phone TEXT;
  extracted_email TEXT;
  extracted_name TEXT;
  extracted_avatar TEXT;
  detected_provider TEXT;
BEGIN
  extracted_email := NEW.email;
  extracted_phone := COALESCE(NEW.phone, (NEW.raw_user_meta_data->>'phone'));
  extracted_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  extracted_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
  );
  detected_provider := COALESCE(
    NEW.raw_app_meta_data->>'provider',
    CASE 
      WHEN NEW.phone IS NOT NULL THEN 'phone'
      WHEN NEW.raw_user_meta_data->>'iss' LIKE '%google%' THEN 'google'
      ELSE 'email'
    END
  );

  INSERT INTO public.profiles (
    id,
    email,
    phone,
    full_name,
    avatar_url,
    role,
    auth_provider,
    status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    extracted_email,
    extracted_phone,
    extracted_name,
    extracted_avatar,
    'customer',
    detected_provider,
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    auth_provider = EXCLUDED.auth_provider,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 3. CATEGORIES & TEMPLATES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  sale_price DECIMAL(10,2),
  currency TEXT NOT NULL DEFAULT 'USD',
  thumbnail_url TEXT NOT NULL,
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  demo_url TEXT,
  origin_url TEXT,
  version TEXT NOT NULL DEFAULT '1.0.0',
  schema_version TEXT DEFAULT '1.0.0',
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  badge TEXT,
  bg_color_class TEXT DEFAULT 'bg-slate-100',
  is_new BOOLEAN DEFAULT FALSE,
  is_popular BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  editable_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  default_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  seo_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_slug ON public.templates(slug);
CREATE INDEX IF NOT EXISTS idx_templates_category ON public.templates(category_id);
CREATE INDEX IF NOT EXISTS idx_templates_status ON public.templates(status);

-- ==============================================================================
-- 4. PORTFOLIO INSTANCES & DEPLOYMENTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.portfolio_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  template_id TEXT REFERENCES public.templates(id) ON DELETE RESTRICT NOT NULL,
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  custom_domain TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'suspended')),
  published_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  draft_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  seo_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  deployment_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_user ON public.portfolio_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_subdomain ON public.portfolio_instances(subdomain);
CREATE INDEX IF NOT EXISTS idx_portfolio_custom_domain ON public.portfolio_instances(custom_domain);

-- ==============================================================================
-- 5. ORDERS, PAYMENTS & LICENSES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  template_id TEXT REFERENCES public.templates(id) ON DELETE RESTRICT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method TEXT NOT NULL DEFAULT 'sandbox' CHECK (payment_method IN ('sandbox', 'vnpay', 'momo', 'stripe', 'bank_transfer')),
  transaction_ref TEXT,
  instance_id UUID REFERENCES public.portfolio_instances(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_template ON public.orders(template_id);

CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  gateway TEXT NOT NULL,
  transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  raw_payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  template_id TEXT REFERENCES public.templates(id) ON DELETE CASCADE NOT NULL,
  order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
  license_type TEXT NOT NULL DEFAULT 'standard',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, template_id)
);

-- ==============================================================================
-- 6. DOMAINS & DNS MANAGEMENT
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.domains (
  id TEXT PRIMARY KEY,
  portfolio_id UUID REFERENCES public.portfolio_instances(id) ON DELETE CASCADE NOT NULL,
  subdomain TEXT NOT NULL,
  full_domain TEXT NOT NULL,
  custom_domain TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive')),
  ssl_status TEXT NOT NULL DEFAULT 'valid' CHECK (ssl_status IN ('valid', 'pending', 'expired')),
  verified BOOLEAN NOT NULL DEFAULT TRUE,
  dns_records JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_domains_full ON public.domains(full_domain);

-- ==============================================================================
-- 7. CLOUDFLARE R2 ASSETS INDEX
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.storage_assets (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  url TEXT NOT NULL,
  bucket TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 8. SYSTEM SETTINGS, SEO & AUDIT LOGS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.seo_configs (
  id TEXT PRIMARY KEY,
  route_path TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  keywords TEXT,
  og_image_url TEXT,
  structured_data JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  details TEXT,
  level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('info', 'success', 'warning', 'error')),
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sms_otp_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT NOT NULL,
  otp_code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_otp_verifications ENABLE ROW LEVEL SECURITY;

-- Helper function: Is user admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id::text = auth.uid()::text AND role IN ('admin', 'superadmin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- POLICIES: PROFILES ---
DROP POLICY IF EXISTS "Public can view basic profiles" ON public.profiles;
CREATE POLICY "Public can view basic profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid()::text = id::text);

-- --- POLICIES: CATEGORIES & TEMPLATES ---
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read templates" ON public.templates;
CREATE POLICY "Public read templates" ON public.templates FOR SELECT USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "Admins full access templates" ON public.templates;
CREATE POLICY "Admins full access templates" ON public.templates FOR ALL USING (public.is_admin());

-- --- POLICIES: PORTFOLIO INSTANCES ---
DROP POLICY IF EXISTS "Public view published portfolios" ON public.portfolio_instances;
CREATE POLICY "Public view published portfolios" ON public.portfolio_instances FOR SELECT USING (status = 'published' OR user_id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS "Users manage their own portfolios" ON public.portfolio_instances;
CREATE POLICY "Users manage their own portfolios" ON public.portfolio_instances FOR ALL USING (user_id::text = auth.uid()::text OR public.is_admin());

-- --- POLICIES: ORDERS & PAYMENTS ---
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users view their own orders" ON public.orders;
CREATE POLICY "Users view their own orders" ON public.orders FOR SELECT USING (user_id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS "Admins full access orders" ON public.orders;
CREATE POLICY "Admins full access orders" ON public.orders FOR ALL USING (public.is_admin());

-- --- POLICIES: DOMAINS ---
DROP POLICY IF EXISTS "Public read active domains" ON public.domains;
CREATE POLICY "Public read active domains" ON public.domains FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Users manage their domains" ON public.domains;
CREATE POLICY "Users manage their domains" ON public.domains FOR ALL USING (
  EXISTS (SELECT 1 FROM public.portfolio_instances WHERE id = domains.portfolio_id AND (user_id::text = auth.uid()::text OR public.is_admin()))
);

-- --- POLICIES: STORAGE ASSETS & SETTINGS ---
DROP POLICY IF EXISTS "Public read storage assets" ON public.storage_assets;
CREATE POLICY "Public read storage assets" ON public.storage_assets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read seo" ON public.seo_configs;
CREATE POLICY "Public read seo" ON public.seo_configs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read settings" ON public.system_settings;
CREATE POLICY "Public read settings" ON public.system_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins write settings" ON public.system_settings;
CREATE POLICY "Admins write settings" ON public.system_settings FOR ALL USING (public.is_admin());
