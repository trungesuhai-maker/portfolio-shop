import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_REAL_URL = 'https://zeuiowqdzuwraqhkgkoo.supabase.co';
const DEFAULT_REAL_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpldWlvd3FkenV3cmFxaGtna29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMTQyMTYsImV4cCI6MjEwNTc5MDIxNn0.WL3UwtGJ1e8x1YwvlC50tjwz_pywavAcSHM_gg25jUI';

// Retrieve configuration from Vite Env, or cached storage, or runtime config
function getInitialConfig(): { url: string; key: string } {
  let url = import.meta.env.VITE_SUPABASE_URL || '';
  let key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  if (typeof window !== 'undefined') {
    // Check local configuration cache if environment variable was not baked into build
    if (!url || url.includes('dummy-project')) {
      const cachedUrl = localStorage.getItem('portio_supabase_url');
      const cachedKey = localStorage.getItem('portio_supabase_key');
      if (cachedUrl && cachedKey && !cachedUrl.includes('dummy-project')) {
        url = cachedUrl;
        key = cachedKey;
      }
    }
  }

  if (!url) url = DEFAULT_REAL_URL;
  if (!key) key = DEFAULT_REAL_ANON_KEY;

  return { url, key };
}

let { url: activeUrl, key: activeKey } = getInitialConfig();

export let isSupabaseConfigured: boolean = 
  Boolean(activeUrl && activeKey && !activeUrl.includes('dummy-project.supabase.co') && !activeUrl.includes('your-preview-project'));

let internalClient: SupabaseClient = createClient(activeUrl, activeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  }
});

// Proxy handler to allow dynamic hot-reconfiguration without breaking existing references
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (internalClient as any)[prop];
  }
});

/**
 * Dynamically reconfigure Supabase client at runtime (e.g. from Admin Settings or API fetch)
 */
export function setSupabaseConfig(url: string, key: string) {
  if (!url || !key) return;
  activeUrl = url.trim();
  activeKey = key.trim();
  isSupabaseConfigured = !activeUrl.includes('dummy-project.supabase.co') && !activeUrl.includes('your-preview-project');

  internalClient = createClient(activeUrl, activeKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined
    }
  });

  if (typeof window !== 'undefined') {
    localStorage.setItem('portio_supabase_url', activeUrl);
    localStorage.setItem('portio_supabase_key', activeKey);
    window.dispatchEvent(new CustomEvent('supabase_config_updated', { detail: { url: activeUrl, configured: isSupabaseConfigured } }));
  }
}

/**
 * Fetch public runtime config from server (if available)
 */
if (typeof window !== 'undefined') {
  fetch('/api/public/config')
    .then(res => res.json())
    .then(data => {
      if (data?.supabaseUrl && data?.supabaseAnonKey && (!activeUrl || activeUrl.includes('dummy-project'))) {
        setSupabaseConfig(data.supabaseUrl, data.supabaseAnonKey);
      }
    })
    .catch(() => {});
}
