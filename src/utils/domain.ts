/**
 * Domain & Subdomain Helper Utilities
 * Provides unified helper functions to generate, format, and navigate 
 * Subdomain URLs (Option B: https://[subdomain].[rootDomain])
 */

export function getRootDomain(): string {
  if (typeof window === 'undefined') return 'webcuaban.site';
  
  const hostname = window.location.hostname.toLowerCase();
  
  // Local development
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname === '127.0.0.1') {
    return 'localhost';
  }

  // Custom Domain with port (split port if any)
  const cleanHost = hostname.split(':')[0];
  const parts = cleanHost.split('.');

  // If on webcuaban.site or custom domains
  if (cleanHost.endsWith('webcuaban.site')) {
    return 'webcuaban.site';
  }
  if (cleanHost.endsWith('portfolio-shop.com')) {
    return 'portfolio-shop.com';
  }

  // Cloud Run preview environment (e.g. ais-pre-*.run.app)
  if (hostname.includes('run.app')) {
    return 'webcuaban.site';
  }

  // Vercel app domain (e.g. portfolio-shop-all.vercel.app)
  if (hostname.endsWith('.vercel.app')) {
    return 'webcuaban.site';
  }

  // If already at subdomain level (e.g. trung.mybrand.com -> root is mybrand.com)
  if (parts.length >= 3) {
    const isSpecialSub = ['www', 'admin', 'app', 'api', 'dev', 'staging', 'preview'].includes(parts[0]);
    if (isSpecialSub) {
      return parts.slice(1).join('.');
    }
    // E.g. trung.shop.com -> shop.com
    return parts.slice(-2).join('.');
  }

  return cleanHost || 'webcuaban.site';
}

/**
 * Returns the fully qualified public URL for a user's portfolio subdomain
 * Option B: https://[subdomain].[rootDomain]
 * If on localhost or Cloud Run, provides standard routing link or sub-domain simulation
 */
export function getPortfolioSubdomainUrl(subdomain: string): string {
  if (!subdomain) return '/';
  
  if (typeof window === 'undefined') {
    return `https://${subdomain}.webcuaban.site`;
  }

  const hostname = window.location.hostname.toLowerCase();
  const port = window.location.port ? `:${window.location.port}` : '';
  const protocol = window.location.protocol;

  // 1. Localhost development
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname === '127.0.0.1') {
    return `${protocol}//${subdomain}.localhost${port}`;
  }

  // 2. Cloud Run or Vercel preview domain
  if (hostname.includes('run.app') || hostname.endsWith('.vercel.app')) {
    return `${protocol}//${hostname}${port}/p/${subdomain}`;
  }

  // 3. Production Custom Domain (e.g. https://[subdomain].webcuaban.site)
  const root = getRootDomain();
  return `${protocol}//${subdomain}.${root}${port}`;
}

/**
 * Formats a clean display representation of the subdomain URL
 * e.g. "videograph.webcuaban.site" or "anna.webcuaban.site"
 */
export function formatSubdomainDisplay(subdomain: string): string {
  if (!subdomain) return '';
  const root = getRootDomain();
  return `${subdomain}.${root}`;
}
