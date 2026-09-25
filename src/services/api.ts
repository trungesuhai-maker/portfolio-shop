import { Template, Category, PortfolioInstance, CustomerPortfolioSeo, ShopSettings, StorageFile } from '../types';
import { MOCK_TEMPLATES, CATEGORIES, MOCK_PORTFOLIOS } from './mockData';

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
    getById: async (id: string): Promise<PortfolioInstance | null> => {
      // For a real app, this would just hit the API. For sandbox, we hit API then fall back to mock.
      try {
        const res = await fetch(`/api/portfolios/${id}`);
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {}
      await delay(300);
      return MOCK_PORTFOLIOS.find(p => p.id === id) || null;
    },
    getByUser: async (userId: string): Promise<PortfolioInstance[]> => {
      try {
        const res = await fetch(`/api/portfolios?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          return [...data];
        }
      } catch (e) {
        console.error('Failed to fetch user portfolios', e);
      }
      return MOCK_PORTFOLIOS.filter(p => p.user_id === userId);
    },
    update: async (id: string, data: { name?: string; custom_data?: any; status?: string; seo?: CustomerPortfolioSeo }) => {
      const res = await fetch(`/api/portfolios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update portfolio');
      }
      return await res.json();
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
    }
  },
  orders: {
    getByUser: async (userId?: string): Promise<any[]> => {
      try {
        const url = userId ? `/api/orders?userId=${encodeURIComponent(userId)}` : '/api/orders';
        const res = await fetch(url, { headers: getAuthHeaders() });
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
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
    resolve: async (hostOrSlug: string) => {
      const isDomain = hostOrSlug.includes('.');
      const param = isDomain ? `host=${encodeURIComponent(hostOrSlug)}` : `slug=${encodeURIComponent(hostOrSlug)}`;
      const res = await fetch(`/api/edge/resolve?${param}`);
      if (!res.ok) {
        const err = await res.json();
        throw err;
      }
      return await res.json();
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
          headers: { 'Content-Type': 'application/json' },
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

      saveStoredCustomTemplate(updated);
      const currentCached = getStoredCachedTemplates();
      setStoredCachedTemplates(currentCached.map(t => t.id === id ? updated! : t));

      return updated;
    },

    // Toggle publish status (Admin)
    toggleStatus: async (id: string, status: 'published' | 'draft' | 'archived'): Promise<Template> => {
      let updated: Template | null = null;
      try {
        const res = await fetch(`/api/templates/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
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

      saveStoredCustomTemplate(updated);
      const currentCached = getStoredCachedTemplates();
      setStoredCachedTemplates(currentCached.map(t => t.id === id ? updated! : t));

      return updated;
    },

    // Delete template (Admin)
    delete: async (id: string): Promise<boolean> => {
      removeStoredCustomTemplate(id);
      const currentCached = getStoredCachedTemplates();
      setStoredCachedTemplates(currentCached.filter(t => t.id !== id));
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
    autoInspect: async (payload: { url: string; demoUrl?: string; categoryId?: string }): Promise<any> => {
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
      const res = await fetch('/api/admin/stats', {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      return await res.json();
    },
    getOrders: async () => {
      const res = await fetch('/api/admin/orders', {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to fetch orders');
      return await res.json();
    },
    updateOrderStatus: async (id: string, status: string) => {
      const res = await fetch(`/api/admin/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status }),
      });
      return await res.json();
    },
    getCustomers: async () => {
      const res = await fetch('/api/admin/customers', {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to fetch customers');
      return await res.json();
    },
    updateCustomerStatus: async (id: string, status: string) => {
      const res = await fetch(`/api/admin/customers/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status }),
      });
      return await res.json();
    },
    getPortfolios: async () => {
      const res = await fetch('/api/admin/portfolios', {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to fetch portfolios');
      return await res.json();
    },
    updatePortfolioStatus: async (id: string, status: string) => {
      const res = await fetch(`/api/admin/portfolios/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status }),
      });
      return await res.json();
    },
    deletePortfolio: async (id: string) => {
      const res = await fetch(`/api/admin/portfolios/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return res.ok;
    },
    getPayments: async () => {
      const res = await fetch('/api/admin/payments', {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to fetch payments');
      return await res.json();
    },
    getDomains: async () => {
      const res = await fetch('/api/admin/domains', {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to fetch domains');
      return await res.json();
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
      const res = await fetch('/api/admin/settings', {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to fetch settings');
      return await res.json();
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
      const res = await fetch('/api/admin/seo', {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to fetch SEO settings');
      return await res.json();
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
      const res = await fetch('/api/admin/logs', {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to fetch logs');
      return await res.json();
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
      return {
        shopName: "Portio — AI Studio Portfolio Shop",
        tagline: "Khởi tạo Portfolio chuẩn quốc tế trong 60 giây",
        logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop",
        favicon: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=64&h=64&fit=crop",
        contact: {
          email: "support@portio.dev",
          phone: "+84 (0) 901 234 567",
          address: "Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh",
          workingHours: "Thứ Hai - Thứ Bảy: 08:00 - 18:00 (UTC+7)"
        },
        socialLinks: {
          twitter: "https://x.com/portioshop",
          github: "https://github.com/portio-marketplace",
          linkedin: "https://linkedin.com/company/portio-dev",
          discord: "https://discord.gg/portio",
          facebook: "https://facebook.com/portio.official",
          youtube: "https://youtube.com/@portiodev"
        },
        footer: {
          copyrightText: "© 2026 Portio. Nền tảng Portfolio AI Studio phân tán với CDN toàn cầu.",
          aboutText: "Chợ Portfolio Template được thiết kế riêng cho các dự án AI Studio. Hỗ trợ kết nối subdomain wildcard, cách ly dữ liệu tuyệt đối và phân phối qua Cloudflare Edge.",
          links: [
            { label: "Về chúng tôi", url: "/about" },
            { label: "Chính sách bảo mật", url: "/privacy" },
            { label: "Điều khoản dịch vụ", url: "/terms" },
            { label: "Tài liệu API", url: "/docs" }
          ]
        },
        brandColors: {
          primary: "#4f46e5",
          accent: "#06b6d4",
          background: "#f8fafc",
          text: "#0f172a"
        },
        maintenanceMode: false,
        currency: 'USD',
        currencySymbol: '$',
        sandboxMode: false
      };
    }
  }
};
