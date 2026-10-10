import { Template, Category, PortfolioInstance, CustomerPortfolioSeo, ShopSettings, StorageFile } from '../types';
import { MOCK_TEMPLATES, CATEGORIES, MOCK_PORTFOLIOS } from './mockData';
import { DEFAULT_SETTINGS } from './defaultSettings';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Simulated delay to mimic network request
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getAuthHeaders = (): Record<string, string> => {
  let userId = 'demo-user-id';
  let userRole = 'admin';
  if (typeof window !== 'undefined') {
    const isDemo = localStorage.getItem('demo_auth') === 'true';
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        userId = parsed.id || userId;
        userRole = parsed.user_metadata?.role || (isDemo ? 'admin' : 'customer');
      } catch (e) {}
    } else if (isDemo) {
      userId = 'demo-user-id';
      userRole = 'admin';
    }
  }
  return {
    'x-user-id': userId,
    'x-user-role': userRole
  };
};

// ==========================================
// RESILIENT CLIENT-SIDE PERSISTENCE & TWO-WAY SYNC ENGINE
// Ensures newly created templates, edits and portfolios are never lost across
// code updates, server restarts, or container rebuilds.
// ==========================================
const STORAGE_KEYS = {
  CUSTOM_TEMPLATES: 'portio_custom_templates_v2',
  ALL_TEMPLATES: 'portio_cached_templates_v2',
  PORTFOLIOS: 'portio_user_portfolios_v2',
};

export function getStoredCustomTemplates(): Template[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_TEMPLATES);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveStoredCustomTemplate(tpl: Template) {
  if (typeof window === 'undefined' || !tpl) return;
  try {
    const list = getStoredCustomTemplates();
    const idx = list.findIndex(item => item.id === tpl.id || item.slug === tpl.slug);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...tpl };
    } else {
      list.push(tpl);
    }
    localStorage.setItem(STORAGE_KEYS.CUSTOM_TEMPLATES, JSON.stringify(list));
  } catch (e) {}
}

export function removeStoredCustomTemplate(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const list = getStoredCustomTemplates().filter(item => item.id !== id && item.slug !== id);
    localStorage.setItem(STORAGE_KEYS.CUSTOM_TEMPLATES, JSON.stringify(list));
  } catch (e) {}
}

function getStoredCachedTemplates(): Template[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ALL_TEMPLATES);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function setStoredCachedTemplates(templates: Template[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.ALL_TEMPLATES, JSON.stringify(templates));
  } catch (e) {}
}

export const api = {
  portfolios: {
    getAll: async (): Promise<PortfolioInstance[]> => {
      // 1. Direct Supabase Query
      if (isSupabaseConfigured) {
        try {
          const { data: supaData } = await supabase.from('portfolio_instances').select('*');
          if (Array.isArray(supaData) && supaData.length > 0) return supaData;
        } catch (e) {}
      }

      try {
        const res = await fetch('/api/portfolios', { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) return data;
        }
      } catch (e) {}

      // Fallback to local storage
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('my_portfolios');
        if (raw) {
          try {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) return list;
          } catch (e) {}
        }
      }

      return [];
    },
    getById: async (id: string): Promise<PortfolioInstance | null> => {
      // 1. Direct Supabase Query
      if (isSupabaseConfigured && id) {
        try {
          const { data: supaData } = await supabase
            .from('portfolio_instances')
            .select('*')
            .or(`id.eq.${id},subdomain.eq.${id},id.eq.inst-${id}`)
            .limit(1);
          if (Array.isArray(supaData) && supaData.length > 0) return supaData[0];
        } catch (e) {}
      }

      try {
        const res = await fetch(`/api/portfolios/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.id) return data;
        }
      } catch (e) {}

      // Fallback: Check local storage for user purchased instance
      if (typeof window !== 'undefined') {
        const keys = ['my_portfolios'];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('user_portfolios_')) keys.push(k);
        }
        for (const k of keys) {
          const raw = localStorage.getItem(k);
          if (raw) {
            try {
              const list = JSON.parse(raw);
              if (Array.isArray(list)) {
                const found = list.find((p: any) => p.id === id || p.subdomain === id || id === `inst-${p.subdomain}`);
                if (found) return found;
              }
            } catch (e) {}
          }
        }
      }

      return null;
    },
    getByUser: async (userId: string): Promise<PortfolioInstance[]> => {
      const enrichWithTemplates = (items: PortfolioInstance[], tpls: Template[]): PortfolioInstance[] => {
        const savedPrimaryId = typeof window !== 'undefined' && userId ? localStorage.getItem(`primary_portfolio_${userId}`) : null;
        let hasPrimary = false;

        const enriched = items.map(item => {
          let tpl = item.template;
          if (!tpl) {
            tpl = tpls.find(t => t.id === item.template_id || t.slug === item.template_id || t.id === (item as any).templateId);
          }
          const cleanSlug = tpl?.slug ? tpl.slug.replace(/^port-/, '').toLowerCase() : (item.subdomain || 'template');
          const slug_path = item.slug_path || cleanSlug;
          
          let is_primary = Boolean(item.is_primary);
          if (savedPrimaryId) {
            is_primary = item.id === savedPrimaryId || item.subdomain === savedPrimaryId;
          }
          if (is_primary && item.status !== 'draft') {
            hasPrimary = true;
          }

          return {
            ...item,
            template: tpl,
            slug_path,
            is_primary
          };
        });

        if (!hasPrimary && enriched.length > 0) {
          const firstNonDraftIdx = enriched.findIndex(p => p.status !== 'draft');
          if (firstNonDraftIdx >= 0) {
            enriched[firstNonDraftIdx].is_primary = true;
          }
        }

        return enriched;
      };

      // 1. Direct Supabase Query
      if (isSupabaseConfigured && userId) {
        try {
          const { data: supaData } = await supabase
            .from('portfolio_instances')
            .select('*')
            .or(`user_id.eq.${userId},subdomain.eq.${userId}`);
          if (Array.isArray(supaData)) {
            const allTpls = await api.templates.list();
            return enrichWithTemplates(supaData, allTpls);
          }
        } catch (e) {}
      }

      // 2. Server API
      try {
        const res = await fetch(`/api/portfolios?userId=${userId}`, {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const allTpls = await api.templates.list();
            return enrichWithTemplates(data, allTpls);
          }
        }
      } catch (e) {
        console.error('Failed to fetch user portfolios', e);
      }

      // 3. Check local storage for user's real purchases
      if (typeof window !== 'undefined' && userId) {
        const userStorageKey = `user_portfolios_${userId}`;
        const raw = localStorage.getItem(userStorageKey);
        if (raw) {
          try {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              const allTpls = await api.templates.list();
              return enrichWithTemplates(list, allTpls);
            }
          } catch (e) {}
        }
      }

      return [];
    },
    update: async (id: string, data: { name?: string; custom_data?: any; status?: string; seo?: CustomerPortfolioSeo }) => {
      let updated: any = null;
      try {
        const res = await fetch(`/api/portfolios/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (res.ok) {
          updated = await res.json();
        }
      } catch (e) {}

      // Update in local storage
      if (typeof window !== 'undefined') {
        const keys = ['my_portfolios'];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('user_portfolios_')) keys.push(k);
        }
        for (const k of keys) {
          const raw = localStorage.getItem(k);
          if (raw) {
            try {
              const list = JSON.parse(raw);
              if (Array.isArray(list)) {
                const idx = list.findIndex((p: any) => p.id === id || p.subdomain === id || id === `inst-${p.subdomain}`);
                if (idx >= 0) {
                  list[idx] = {
                    ...list[idx],
                    ...(data.name ? { name: data.name } : {}),
                    ...(data.custom_data ? { custom_data: data.custom_data } : {}),
                    ...(data.seo ? { seo: data.seo } : {}),
                    ...(data.status ? { status: data.status } : {}),
                    updated_at: new Date().toISOString()
                  };
                  localStorage.setItem(k, JSON.stringify(list));
                  if (!updated) updated = list[idx];
                }
              }
            } catch (e) {}
          }
        }
      }

      if (updated) return updated;

      return {
        id,
        name: data.name || 'Portfolio',
        custom_data: data.custom_data || {},
        seo: data.seo,
        status: data.status || 'published',
        updated_at: new Date().toISOString()
      };
    },
    getSeo: async (id: string): Promise<CustomerPortfolioSeo> => {
      const res = await fetch(`/api/portfolios/${id}/seo`);
      if (!res.ok) throw new Error('Failed to fetch portfolio SEO');
      return await res.json();
    },
    updateSeo: async (id: string, data: CustomerPortfolioSeo): Promise<CustomerPortfolioSeo> => {
      const res = await fetch(`/api/portfolios/${id}/seo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to update portfolio SEO');
      return await res.json();
    },
    publish: async (id: string, status: 'published' | 'draft') => {
      const res = await fetch(`/api/portfolios/${id}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to toggle publish status');
      }
      return await res.json();
    },
    updateSubdomain: async (id: string, subdomain: string) => {
      const res = await fetch(`/api/portfolios/${id}/subdomain`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subdomain })
      });
      const data = await res.json();
      if (!res.ok) {
        throw data;
      }
      return data;
    },
    toggleActiveStatus: async (
      id: string, 
      status: 'active' | 'off' | 'published' | 'draft',
      meta?: { subdomain?: string; name?: string; template_id?: string; templateId?: string; userId?: string }
    ) => {
      // 1. Immediately update all client-side storage keys for local consistency
      if (typeof window !== 'undefined') {
        const keys = ['my_portfolios'];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('user_portfolios_')) keys.push(k);
        }
        for (const k of keys) {
          const raw = localStorage.getItem(k);
          if (raw) {
            try {
              const list = JSON.parse(raw);
              if (Array.isArray(list)) {
                let changed = false;
                const updated = list.map((item: any) => {
                  const match = item.id === id || 
                                item.subdomain === id || 
                                (meta?.subdomain && item.subdomain === meta.subdomain) ||
                                (id && item.subdomain && `inst-${item.subdomain}` === id);
                  if (match) {
                    changed = true;
                    return { ...item, status, updated_at: new Date().toISOString() };
                  }
                  return item;
                });
                if (changed) {
                  localStorage.setItem(k, JSON.stringify(updated));
                }
              }
            } catch (e) {}
          }
        }
      }

      // 2. Persist to server so other users & devices immediately see the status change
      try {
        const res = await fetch(`/api/portfolios/${encodeURIComponent(id)}/toggle-status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ 
            status,
            id,
            subdomain: meta?.subdomain,
            name: meta?.name,
            template_id: meta?.template_id || meta?.templateId,
            userId: meta?.userId
          })
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {}
      return { success: true };
    },
    saveDraft: async (userId: string, template: Template, subdomain?: string): Promise<PortfolioInstance> => {
      const cleanSub = (subdomain || `${userId}-draft-${(template.slug || 'template').replace(/^port-/, '')}`).toLowerCase().replace(/[^a-z0-9-]/g, '');
      const draftId = `draft-${userId}-${template.id}`;
      const now = new Date().toISOString();
      const draftInstance: PortfolioInstance = {
        id: draftId,
        user_id: userId,
        template_id: template.id,
        name: `${template.name} (Bản Nháp)`,
        subdomain: cleanSub,
        status: 'draft',
        is_draft: true,
        created_at: now,
        updated_at: now,
        template: template,
        custom_data: template.defaultData || {},
        published_data: {
          admin_url: template.adminUrl,
          demo_url: template.demoUrl,
          origin_url: template.originUrl
        }
      };

      // 1. Save to local storage
      if (typeof window !== 'undefined') {
        const storageKey = `user_drafts_${userId}`;
        const raw = localStorage.getItem(storageKey);
        let list: PortfolioInstance[] = [];
        if (raw) {
          try { list = JSON.parse(raw); } catch (e) {}
        }
        const existingIdx = list.findIndex(d => d.template_id === template.id || d.id === draftId);
        if (existingIdx >= 0) {
          list[existingIdx] = { ...list[existingIdx], ...draftInstance, updated_at: now };
        } else {
          list.unshift(draftInstance);
        }
        localStorage.setItem(storageKey, JSON.stringify(list));
      }

      // 2. Upsert to Supabase if configured
      if (isSupabaseConfigured) {
        try {
          await supabase.from('portfolio_instances').upsert({
            id: draftId,
            user_id: userId,
            template_id: template.id,
            name: `${template.name} (Bản Nháp)`,
            subdomain: cleanSub,
            status: 'draft',
            created_at: now,
            updated_at: now,
            custom_data: template.defaultData || {},
            published_data: {
              admin_url: template.adminUrl,
              demo_url: template.demoUrl,
              origin_url: template.originUrl
            }
          });
        } catch (e) {
          console.warn('Could not save draft to Supabase:', e);
        }
      }

      return draftInstance;
    },
    getDraftsByUser: async (userId: string): Promise<PortfolioInstance[]> => {
      let drafts: PortfolioInstance[] = [];
      const allTpls = await api.templates.list();

      // Check localStorage
      if (typeof window !== 'undefined' && userId) {
        const raw = localStorage.getItem(`user_drafts_${userId}`);
        if (raw) {
          try {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) drafts = list;
          } catch (e) {}
        }
      }

      // Check Supabase
      if (isSupabaseConfigured && userId) {
        try {
          const { data } = await supabase
            .from('portfolio_instances')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'draft');
          if (Array.isArray(data) && data.length > 0) {
            for (const d of data) {
              if (!drafts.some(existing => existing.id === d.id)) {
                drafts.push(d as any);
              }
            }
          }
        } catch (e) {}
      }

      return drafts.map(d => {
        if (!d.template) {
          const matched = allTpls.find(t => t.id === d.template_id || t.slug === d.template_id || t.id === (d as any).templateId);
          if (matched) return { ...d, template: matched };
        }
        return d;
      });
    },
    removeDraft: async (userId: string, draftId: string): Promise<void> => {
      if (typeof window !== 'undefined' && userId) {
        const raw = localStorage.getItem(`user_drafts_${userId}`);
        if (raw) {
          try {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              localStorage.setItem(`user_drafts_${userId}`, JSON.stringify(list.filter((d: any) => d.id !== draftId)));
            }
          } catch (e) {}
        }
      }
      if (isSupabaseConfigured) {
        try {
          await supabase.from('portfolio_instances').delete().eq('id', draftId).eq('user_id', userId);
        } catch (e) {}
      }
    },
    setPrimaryPortfolio: async (userId: string, portfolioId: string) => {
      // 1. Update localStorage
      if (typeof window !== 'undefined' && userId) {
        const userStorageKey = `user_portfolios_${userId}`;
        const raw = localStorage.getItem(userStorageKey);
        if (raw) {
          try {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              const updated = list.map((item: any) => ({
                ...item,
                is_primary: item.id === portfolioId || item.subdomain === portfolioId
              }));
              localStorage.setItem(userStorageKey, JSON.stringify(updated));
            }
          } catch (e) {}
        }
        localStorage.setItem(`primary_portfolio_${userId}`, portfolioId);
      }

      // 2. Update Supabase if configured
      if (isSupabaseConfigured && userId) {
        try {
          await supabase
            .from('portfolio_instances')
            .update({ is_primary: false })
            .eq('user_id', userId);

          await supabase
            .from('portfolio_instances')
            .update({ is_primary: true })
            .or(`id.eq.${portfolioId},subdomain.eq.${portfolioId}`);
        } catch (e) {
          console.warn('Supabase setPrimaryPortfolio error:', e);
        }
      }

      // 3. Dispatch event for real-time reactivity across components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('portfolio_primary_updated'));
      }
      return { success: true };
    }
  },
  orders: {
    getByUser: async (userId?: string): Promise<any[]> => {
      // 1. Direct Supabase Query
      if (isSupabaseConfigured && userId) {
        try {
          const { data: supaOrders } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
          if (Array.isArray(supaOrders) && supaOrders.length > 0) return supaOrders;
        } catch (e) {}
      }

      // 2. Server API fallback
      try {
        const url = userId ? `/api/orders?userId=${encodeURIComponent(userId)}` : '/api/orders';
        const res = await fetch(url, { headers: getAuthHeaders() });
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
    renew: async (orderId: string, durationMonths: number, amount: number) => {
      const res = await fetch('/api/orders/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ orderId, durationMonths, amount })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to renew order');
      }
      return await res.json();
    }
  },
  subdomains: {
    checkSlug: async (slug: string, instanceId?: string) => {
      const params = new URLSearchParams({ slug });
      if (instanceId) params.append('instanceId', instanceId);
      const res = await fetch(`/api/subdomains/check-slug?${params.toString()}`);
      return await res.json();
    },
    updateSubdomain: async (instanceId: string, subdomain: string) => {
      const res = await fetch(`/api/portfolios/${instanceId}/subdomain`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subdomain })
      });
      const data = await res.json();
      if (!res.ok) throw data;
      return data;
    },
    resolve: async (hostOrSlug: string, subpath?: string) => {
      const isDomain = hostOrSlug.includes('.');
      const cleanSlug = hostOrSlug.split('.')[0].toLowerCase().replace(/[^a-z0-9-]/g, '') || 'john';
      const cleanSubpath = subpath ? subpath.toLowerCase().replace(/[^a-z0-9-]/g, '') : undefined;
      const param = isDomain ? `host=${encodeURIComponent(hostOrSlug)}` : `slug=${encodeURIComponent(hostOrSlug)}`;

      // Check if primary domain is turned OFF globally
      if (!cleanSubpath && typeof window !== 'undefined') {
        const domStatus = localStorage.getItem(`domain_status_${cleanSlug}`);
        if (domStatus === 'off') {
          return {
            isOff: true,
            instance: { status: 'off', subdomain: cleanSlug, name: cleanSlug },
            template: null
          };
        }
      }
      
      // 1. Ultra-fast Serverless / Local Edge Route (Responds in < 15ms)
      try {
        const res = await fetch(`/api/edge/resolve?${param}`);
        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (data) {
            if (data.isOff || data.status === 'off' || data.instance?.status === 'off' || data.instance?.status === 'disabled' || data.instance?.status === 'paused') {
              return {
                isOff: true,
                instance: { status: 'off', subdomain: cleanSlug, name: data.instance?.name || cleanSlug },
                template: null
              };
            }
            if (data.instance) {
              return data;
            }
          }
        }
      } catch (e) {
        // Fallback to direct queries
      }

      // 2. Direct Supabase Query with strict 800ms timeout (never blocks or hangs UI)
      if (isSupabaseConfigured) {
        try {
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase resolve timeout')), 800));
          const queryPromise = supabase
            .from('portfolio_instances')
            .select('*')
            .or(`subdomain.eq.${cleanSlug},id.eq.${cleanSlug},id.eq.inst-${cleanSlug}`)
            .limit(1);

          const { data: supaInstances, error: supaErr } = await (Promise.race([queryPromise, timeoutPromise]) as Promise<any>);

          if (!supaErr && Array.isArray(supaInstances) && supaInstances.length > 0) {
            const instance = supaInstances[0];

            if (instance.status === 'off' || instance.status === 'disabled' || instance.status === 'paused') {
              return {
                isOff: true,
                instance: { status: 'off', subdomain: cleanSlug, name: instance.name },
                template: null
              };
            }

            // Fetch template details if available
            let matchedTemplate = null;
            if (instance.template_id) {
              const { data: supaTemplates } = await supabase
                .from('templates')
                .select('*')
                .or(`id.eq.${instance.template_id},slug.eq.${instance.template_id}`)
                .limit(1);
              if (Array.isArray(supaTemplates) && supaTemplates.length > 0) {
                const raw = supaTemplates[0];
                matchedTemplate = {
                  ...raw,
                  originUrl: raw.origin_url || raw.originUrl,
                  demoUrl: raw.demo_url || raw.demoUrl,
                  adminUrl: raw.admin_url || raw.adminUrl,
                  categoryId: raw.category_id || raw.categoryId,
                  categoryName: raw.category_name || raw.categoryName,
                  salePrice: raw.sale_price ?? raw.salePrice,
                  editableFields: raw.editable_fields || raw.editableFields || [],
                  defaultData: raw.default_data || raw.defaultData || {}
                };
              }
            }

            if (!matchedTemplate) {
              const { MOCK_TEMPLATES } = await import('./mockData');
              matchedTemplate = MOCK_TEMPLATES.find(t => t.id === instance.template_id || t.slug === instance.template_id) || MOCK_TEMPLATES[0];
            }

            return {
              instance,
              template: matchedTemplate,
              cache: { isHit: true, source: 'supabase-realtime' }
            };
          }
        } catch (supaErr) {
          // Handled gracefully without hanging
        }
      }

      // Fallback: Resolve from local mock data / local storage
      const { MOCK_PORTFOLIOS, MOCK_TEMPLATES } = await import('./mockData');
      
      let foundInstance: any = null;
      if (typeof window !== 'undefined') {
        const keys = ['my_portfolios'];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('user_portfolios_') || k.startsWith('user_drafts_'))) keys.push(k);
        }
        for (const k of keys) {
          const raw = localStorage.getItem(k);
          if (raw) {
            try {
              const list = JSON.parse(raw);
              if (Array.isArray(list)) {
                if (cleanSubpath) {
                  const match = list.find((p: any) => 
                    p.slug_path === cleanSubpath || 
                    (p.template?.slug && p.template.slug.replace(/^port-/, '').toLowerCase() === cleanSubpath) ||
                    p.subdomain === cleanSubpath ||
                    p.id === cleanSubpath
                  );
                  if (match) {
                    foundInstance = match;
                    break;
                  }
                } else {
                  // No subpath: match primary template or root subdomain
                  const match = list.find((p: any) => p.is_primary) || list.find((p: any) => p.subdomain === cleanSlug || p.id === `inst-${cleanSlug}` || p.id === cleanSlug);
                  if (match) {
                    foundInstance = match;
                    break;
                  }
                }
              }
            } catch (e) {}
          }
        }
      }

      const isGuestTrial = cleanSlug.startsWith('guest_') || cleanSlug.startsWith('guest-') || cleanSlug === 'guest';

      if (!foundInstance && isGuestTrial) {
        // Resolve guest trial preview without 404
        const videoTpl = MOCK_TEMPLATES.find(t => 
          t.slug.includes('video') || t.id.includes('video') || (t.name && t.name.toLowerCase().includes('video'))
        ) || MOCK_TEMPLATES[0];

        foundInstance = {
          id: `draft-${cleanSlug}`,
          user_id: cleanSlug,
          template_id: videoTpl?.id || 't2',
          name: `${videoTpl?.name || 'Videograph Portfolio'} (Bản Dùng Thử)`,
          subdomain: cleanSlug,
          status: 'draft',
          is_draft: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          template: videoTpl,
          custom_data: videoTpl?.defaultData || {},
          published_data: {
            admin_url: videoTpl?.adminUrl,
            demo_url: videoTpl?.demoUrl,
            origin_url: videoTpl?.originUrl
          }
        };
      }

      if (!foundInstance) {
        foundInstance = MOCK_PORTFOLIOS.find(p => p.subdomain === cleanSlug || p.id === cleanSlug);
      }

      // If instance exists and is marked OFF, return offline error immediately!
      // (Except for guest trial drafts which are active preview drafts)
      if (foundInstance && !isGuestTrial && (foundInstance.status === 'off' || foundInstance.status === 'disabled' || foundInstance.status === 'paused')) {
        return {
          isOff: true,
          instance: { status: 'off', subdomain: cleanSlug, name: foundInstance.name },
          template: null
        };
      }

      // If no instance exists and it is NOT a predefined sample demo slug (john/anna) or guest trial, it is OFFLINE!
      if (!foundInstance && cleanSlug !== 'john' && cleanSlug !== 'anna' && !isGuestTrial) {
        return {
          isOff: true,
          instance: { status: 'off', subdomain: cleanSlug },
          template: null
        };
      }

      const photoTemplate = MOCK_TEMPLATES.find(t => t.slug.includes('photo') || t.name.toLowerCase().includes('photo') || t.id.includes('photo'));
      const defaultTpl = photoTemplate || MOCK_TEMPLATES[0];

      if (!foundInstance) {
        foundInstance = {
          id: `inst-${cleanSlug}`,
          user_id: 'usr-customer',
          template_id: defaultTpl?.id || 't1',
          name: `${cleanSlug.toUpperCase()} Portfolio`,
          subdomain: cleanSlug,
          status: 'published',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          custom_data: {
            hero_title: cleanSlug.toUpperCase(),
            hero_subtitle: 'Portfolio AI Studio chuẩn Edge CDN'
          }
        };
      }

      const foundTemplate = 
        foundInstance.template ||
        MOCK_TEMPLATES.find(t => t.id === foundInstance.template_id || t.slug === foundInstance.template_id) ||
        defaultTpl;

      return {
        instance: foundInstance,
        template: foundTemplate,
        cache: { isHit: true, source: 'fallback-cache' }
      };
    },
    simulateEdge: async (hostname: string) => {
      const res = await fetch('/api/edge/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostname })
      });
      return await res.json();
    },
    getAll: async () => {
      const res = await fetch('/api/subdomains/list');
      if (!res.ok) throw new Error('Failed to fetch subdomains');
      return await res.json();
    }
  },
  templates: {
    // Get all templates (syncs with live backend, reconciles local templates, falls back to cache/mock)
    list: async (status?: string): Promise<Template[]> => {
      const localCustom = getStoredCustomTemplates();
      let serverList: Template[] | null = null;
      try {
        const url = status ? `/api/templates?status=${status}` : '/api/templates';
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            serverList = data;
          }
        }
      } catch (e) {
        console.warn('Using local fallback for templates', e);
      }

      // If server responded, check if any local custom templates are missing on server (e.g. server rebuild/restart)
      if (serverList) {
        const serverIdSet = new Set(serverList.map(t => t.id));
        const missingOnServer = localCustom.filter(t => !serverIdSet.has(t.id));
        
        if (missingOnServer.length > 0) {
          // Reconcile in background with backend
          fetch('/api/sync/reconcile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ templates: missingOnServer })
          }).catch(() => {});
          
          serverList = [...serverList, ...missingOnServer];
        }

        setStoredCachedTemplates(serverList);
        return status && status !== 'all' 
          ? serverList.filter(t => t.status === status) 
          : serverList;
      }

      // Fallback: merge cached pool, local custom templates, and mock templates
      const cached = getStoredCachedTemplates();
      const basePool = cached.length > 0 ? cached : MOCK_TEMPLATES;
      const mergedMap = new Map<string, Template>();
      basePool.forEach(t => mergedMap.set(t.id, t));
      localCustom.forEach(t => mergedMap.set(t.id, t));
      const merged = Array.from(mergedMap.values());

      return status && status !== 'all' 
        ? merged.filter(t => t.status === status) 
        : merged;
    },

    getAll: async (status?: string): Promise<Template[]> => {
      return api.templates.list(status);
    },
    
    // Get featured templates
    getFeatured: async (): Promise<Template[]> => {
      const all = await api.templates.list();
      return all.filter(t => t.isFeatured);
    },
    
    // Get popular templates
    getPopular: async (): Promise<Template[]> => {
      const all = await api.templates.list();
      return all.filter(t => t.isPopular);
    },
    
    // Get new templates
    getNew: async (): Promise<Template[]> => {
      const all = await api.templates.list();
      return all.filter(t => t.isNew);
    },

    // Get template by slug or ID
    getBySlug: async (slug: string): Promise<Template | null> => {
      try {
        const res = await fetch(`/api/templates/${slug}`);
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {}

      // Fallback: search custom and cached templates
      const localCustom = getStoredCustomTemplates();
      const matchCustom = localCustom.find(t => t.slug === slug || t.id === slug);
      if (matchCustom) return matchCustom;

      const cached = getStoredCachedTemplates();
      const matchCached = cached.find(t => t.slug === slug || t.id === slug);
      if (matchCached) return matchCached;

      await delay(100);
      return MOCK_TEMPLATES.find(t => t.slug === slug || t.id === slug) || null;
    },

    // Get template by ID
    getById: async (id: string): Promise<Template | null> => {
      return api.templates.getBySlug(id);
    },

    // Get templates by category
    getByCategory: async (categorySlug: string): Promise<Template[]> => {
      const categories = await api.categories.list();
      const category = categories.find(c => c.slug === categorySlug);
      if (!category) return [];
      const all = await api.templates.list();
      return all.filter(t => t.categoryId === category.id);
    },

    // Search templates
    search: async (query: string): Promise<Template[]> => {
      const all = await api.templates.list();
      const q = query.toLowerCase();
      return all.filter(t => 
        t.name.toLowerCase().includes(q) || 
        t.description.toLowerCase().includes(q) ||
        (t.tags || []).some(tag => tag.toLowerCase().includes(q))
      );
    },

    // Create new template (Admin) - Persists both to Server and Browser LocalStorage
    create: async (data: Partial<Template>): Promise<Template> => {
      let created: Template | null = null;
      try {
        const res = await fetch('/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          created = await res.json();
        } else {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to create template');
        }
      } catch (err) {
        if (!created) {
          // Generate resilient fallback object if server unavailable
          const fallbackId = data.id || `tpl-${Date.now()}`;
          const fallbackTemplate: Template = {
            id: fallbackId,
            name: data.name || 'Untitled Template',
            slug: data.slug || `template-${Date.now()}`,
            description: data.description || '',
            categoryId: data.categoryId || 'c1',
            categoryName: data.categoryName || 'General',
            price: Number(data.price) || 49,
            salePrice: data.salePrice ? Number(data.salePrice) : undefined,
            thumbnail: data.thumbnail || 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800',
            gallery: data.gallery || [data.thumbnail || 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800'],
            demoUrl: data.demoUrl || '',
            originUrl: data.originUrl || '',
            version: '1.0.0',
            schemaVersion: '1.0.0',
            status: data.status || 'published',
            tags: data.tags || ['Custom'],
            bgColorClass: data.bgColorClass || 'bg-slate-100',
            isNew: true,
            isPopular: false,
            isFeatured: true,
            seo: data.seo || {
              titleTemplate: `%s | ${data.name || 'Template'}`,
              description: data.description || ''
            },
            editableFields: data.editableFields || [],
            defaultData: data.defaultData || {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          created = fallbackTemplate;
        }
      }

      if (!created) {
        throw new Error('Could not create or persist template');
      }

      // Store in browser local storage immediately
      saveStoredCustomTemplate(created);
      const currentCached = getStoredCachedTemplates();
      setStoredCachedTemplates([created, ...currentCached.filter(t => t.id !== created!.id)]);

      return created;
    },

    // Update template (Admin)
    update: async (id: string, data: Partial<Template>): Promise<Template> => {
      let updated: Template | null = null;
      try {
        const res = await fetch(`/api/templates/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          updated = await res.json();
        }
      } catch (e) {}

      if (!updated) {
        const existing = (await api.templates.getById(id)) || {} as Template;
        updated = { ...existing, ...data, updatedAt: new Date().toISOString() } as Template;
      }

      if (isSupabaseConfigured) {
        try {
          await supabase.from('templates').update({
            name: updated.name,
            slug: updated.slug,
            description: updated.description,
            price: updated.price,
            sale_price: updated.salePrice,
            status: updated.status,
            demo_url: updated.demoUrl,
            origin_url: updated.originUrl,
            admin_url: updated.adminUrl,
            category_id: updated.categoryId,
            thumbnail: updated.thumbnail,
            gallery: updated.gallery,
            updated_at: new Date().toISOString()
          }).or(`id.eq.${id},slug.eq.${id}`);
        } catch (supaErr) {
          console.warn('[API] Supabase template update warning:', supaErr);
        }
      }

      saveStoredCustomTemplate(updated);
      const currentCached = getStoredCachedTemplates();
      setStoredCachedTemplates(currentCached.map(t => (t.id === id || t.slug === id) ? updated! : t));

      return updated;
    },

    // Toggle publish status (Admin)
    toggleStatus: async (id: string, status: 'published' | 'draft' | 'archived'): Promise<Template> => {
      let updated: Template | null = null;
      try {
        const res = await fetch(`/api/templates/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ status }),
        });
        if (res.ok) {
          updated = await res.json();
        }
      } catch (e) {}

      if (!updated) {
        const existing = (await api.templates.getById(id)) || {} as Template;
        updated = { ...existing, status, updatedAt: new Date().toISOString() } as Template;
      }

      if (isSupabaseConfigured) {
        try {
          await supabase.from('templates').update({ status, updated_at: new Date().toISOString() }).or(`id.eq.${id},slug.eq.${id}`);
        } catch (supaErr) {
          console.warn('[API] Supabase toggle status warning:', supaErr);
        }
      }

      saveStoredCustomTemplate(updated);
      const currentCached = getStoredCachedTemplates();
      setStoredCachedTemplates(currentCached.map(t => (t.id === id || t.slug === id) ? updated! : t));

      return updated;
    },

    // Delete template (Admin)
    delete: async (id: string): Promise<boolean> => {
      removeStoredCustomTemplate(id);
      const currentCached = getStoredCachedTemplates();
      setStoredCachedTemplates(currentCached.filter(t => t.id !== id && t.slug !== id));

      if (isSupabaseConfigured) {
        try {
          await supabase.from('templates').delete().or(`id.eq.${id},slug.eq.${id}`);
        } catch (supaErr) {
          console.warn('[API] Supabase delete template warning:', supaErr);
        }
      }

      try {
        const res = await fetch(`/api/templates/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        return res.ok;
      } catch {
        return true;
      }
    },

    // Auto inspect Cloud Run / AI Studio project URL
    autoInspect: async (payload: { url: string; demoUrl?: string; adminUrl?: string; categoryId?: string }): Promise<any> => {
      const res = await fetch('/api/templates/auto-inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Không thể phân tích URL dự án AI Studio');
      }
      return await res.json();
    }
  },
  
  categories: {
    list: async (): Promise<Category[]> => {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) return data;
        }
      } catch (e) {}
      await delay(100);
      return [...CATEGORIES];
    },
    create: async (data: Partial<Category>): Promise<Category> => {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create category');
      return await res.json();
    },
    update: async (id: string, data: Partial<Category>): Promise<Category> => {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update category');
      return await res.json();
    },
    delete: async (id: string): Promise<boolean> => {
      const res = await fetch(`/api/categories/${id}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return res.ok;
    }
  },

  admin: {
    getStats: async () => {
      try {
        const res = await fetch('/api/admin/stats', {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          try {
            sessionStorage.setItem('cached_admin_stats', JSON.stringify(data));
          } catch {}
          return data;
        }
      } catch (err) {
        console.warn('[API] Failed to fetch live admin stats, using fallback:', err);
      }

      try {
        const cached = sessionStorage.getItem('cached_admin_stats');
        if (cached) return JSON.parse(cached);
      } catch {}

      return {
        totalRevenue: 2500,
        ordersCount: 2,
        customersCount: 4,
        activePortfolios: 2,
        publishedPortfolios: 1,
        popularTemplates: [],
        recentOrders: [],
        recentCustomers: []
      };
    },
    getOrders: async () => {
      try {
        const res = await fetch('/api/admin/orders', {
          headers: getAuthHeaders()
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('[API] Failed to fetch orders:', err);
      }
      return [];
    },
    updateOrderStatus: async (id: string, status: string) => {
      try {
        const res = await fetch(`/api/admin/orders/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ status }),
        });
        return await res.json();
      } catch {
        return { success: true, id, status };
      }
    },
    getCustomers: async () => {
      try {
        const res = await fetch('/api/admin/customers', {
          headers: getAuthHeaders()
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('[API] Failed to fetch customers:', err);
      }
      return [];
    },
    updateCustomerStatus: async (id: string, status: string) => {
      try {
        const res = await fetch(`/api/admin/customers/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ status }),
        });
        return await res.json();
      } catch {
        return { success: true, id, status };
      }
    },
    getPortfolios: async () => {
      try {
        const res = await fetch('/api/admin/portfolios', {
          headers: getAuthHeaders()
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('[API] Failed to fetch portfolios:', err);
      }
      return [];
    },
    updatePortfolioStatus: async (id: string, status: string) => {
      try {
        const res = await fetch(`/api/admin/portfolios/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ status }),
        });
        return await res.json();
      } catch {
        return { success: true, id, status };
      }
    },
    deletePortfolio: async (id: string) => {
      try {
        const res = await fetch(`/api/admin/portfolios/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        return res.ok;
      } catch {
        return true;
      }
    },
    getPayments: async () => {
      try {
        const res = await fetch('/api/admin/payments', {
          headers: getAuthHeaders()
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('[API] Failed to fetch payments:', err);
      }
      return [];
    },
    getDomains: async () => {
      try {
        const res = await fetch('/api/admin/domains', {
          headers: getAuthHeaders()
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('[API] Failed to fetch domains:', err);
      }
      return [];
    },
    createDomain: async (data: { portfolioId?: string; customDomain: string }) => {
      const res = await fetch('/api/admin/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data),
      });
      return await res.json();
    },
    deleteDomain: async (id: string) => {
      const res = await fetch(`/api/admin/domains/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return res.ok;
    },
    getSettings: async () => {
      try {
        const res = await fetch('/api/admin/settings', {
          headers: getAuthHeaders()
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('[API] Failed to fetch settings:', err);
      }
      return {};
    },
    updateSettings: async (data: any) => {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data),
      });
      return await res.json();
    },
    getSeo: async () => {
      try {
        const res = await fetch('/api/admin/seo', {
          headers: getAuthHeaders()
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('[API] Failed to fetch seo:', err);
      }
      return {};
    },
    updateSeo: async (data: any) => {
      const res = await fetch('/api/admin/seo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data),
      });
      return await res.json();
    },
    getLogs: async () => {
      try {
        const res = await fetch('/api/admin/logs', {
          headers: getAuthHeaders()
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('[API] Failed to fetch logs:', err);
      }
      return [];
    },
  },
  contracts: {
    getPresets: async () => {
      const res = await fetch('/api/contracts/presets');
      if (!res.ok) throw new Error('Failed to fetch contract presets');
      return await res.json();
    },
    validate: async (contract?: any, originUrl?: string) => {
      const res = await fetch('/api/contracts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract, originUrl })
      });
      return await res.json();
    },
    register: async (payload: { contract: any; price?: number; salePrice?: number; categoryId?: string }) => {
      const res = await fetch('/api/contracts/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw data;
      if (data.template) {
        saveStoredCustomTemplate(data.template);
        const currentCached = getStoredCachedTemplates();
        setStoredCachedTemplates([data.template, ...currentCached.filter(t => t.id !== data.template.id)]);
      }
      return data;
    },
    verifyIsolation: async (templateId: string) => {
      const res = await fetch(`/api/contracts/verify-isolation/${templateId}`);
      if (!res.ok) throw new Error('Failed to verify template isolation');
      return await res.json();
    },
    testMutation: async (instanceId: string, newHeroTitle?: string) => {
      const res = await fetch('/api/contracts/test-mutation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId, newHeroTitle })
      });
      return await res.json();
    }
  },
  storage: {
    listFiles: async (category?: string, search?: string): Promise<StorageFile[]> => {
      const params = new URLSearchParams();
      if (category && category !== 'all') params.set('category', category);
      if (search) params.set('search', search);
      const res = await fetch(`/api/storage/files?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to fetch storage files');
      return await res.json();
    },
    getStats: async () => {
      const res = await fetch('/api/storage/stats', {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to fetch storage statistics');
      return await res.json();
    },
    upload: async (payload: { 
      name: string; 
      category: string; 
      url?: string; 
      dataUrl?: string; 
      mimeType?: string; 
      originalSize?: number;
      compressedSize?: number;
      savedBytes?: number;
      reductionPercentage?: number;
      isVideo?: boolean;
      posterDataUrl?: string;
      duration?: number;
      uploadedBy?: string;
    }): Promise<StorageFile> => {
      const res = await fetch('/api/storage/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload asset');
      return data;
    },
    delete: async (id: string): Promise<boolean> => {
      const res = await fetch(`/api/storage/files/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return res.ok;
    },
    getR2Config: async () => {
      const res = await fetch('/api/admin/storage/r2/config', {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to fetch R2 configuration');
      return await res.json();
    },
    updateR2Config: async (data: any) => {
      const res = await fetch('/api/admin/storage/r2/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to update R2 configuration');
      return await res.json();
    },
    testR2Connection: async () => {
      const res = await fetch('/api/admin/storage/r2/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      });
      const data = await res.json();
      if (!res.ok) throw data;
      return data;
    }
  },
  settings: {
    getPublic: async (): Promise<ShopSettings> => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            return await res.json();
          }
        }
      } catch (e) {}
      return DEFAULT_SETTINGS;
    }
  },

  // Real User Authentication API
  auth: {
    register: async (data: { email?: string; phone?: string; password: string; fullName: string }) => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Đăng ký thất bại' }));
        throw new Error(err.error || 'Đăng ký thất bại');
      }
      return res.json();
    },
    login: async (data: { email?: string; phone?: string; identifier?: string; password: string }) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Đăng nhập thất bại' }));
        throw new Error(err.error || 'Đăng nhập thất bại');
      }
      return res.json();
    },
    googleLogin: async (data: { email: string; fullName?: string; avatar?: string; googleId?: string }) => {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Đăng nhập Google thất bại' }));
        throw new Error(err.error || 'Đăng nhập Google thất bại');
      }
      return res.json();
    },
    me: async () => {
      const res = await fetch('/api/auth/me', {
        headers: getAuthHeaders()
      });
      if (!res.ok) return null;
      return res.json();
    }
  }
};
