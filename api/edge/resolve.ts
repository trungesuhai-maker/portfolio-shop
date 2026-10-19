import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://zeuiowqdzuwraqhkgkoo.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpldWlvd3FkenV3cmFxaGtna29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMTQyMTYsImV4cCI6MjEwNTc5MDIxNn0.WL3UwtGJ1e8x1YwvlC50tjwz_pywavAcSHM_gg25jUI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  const { slug, host } = req.query;
  const rawTarget = (slug || host || '').toString().trim();
  const cleanSlug = rawTarget.split('.')[0].toLowerCase().replace(/[^a-z0-9-]/g, '');

  if (!cleanSlug) {
    return res.status(400).json({ error: 'Missing slug or host' });
  }

  try {
    // 1. Query Supabase for portfolio instance
    const { data: instances, error: instErr } = await supabase
      .from('portfolio_instances')
      .select('*')
      .or(`subdomain.eq.${cleanSlug},id.eq.${cleanSlug},id.eq.inst-${cleanSlug}`)
      .limit(1);

    if (instErr) {
      console.error('Supabase query error:', instErr);
    }

    const instance = instances && instances.length > 0 ? instances[0] : null;

    if (instance) {
      if (instance.status === 'off' || instance.status === 'disabled' || instance.status === 'paused') {
        return res.status(200).json({
          isOff: true,
          instance: { status: 'off', subdomain: cleanSlug, name: instance.name },
          template: null
        });
      }

      // Fetch template details
      let template = null;
      if (instance.template_id) {
        const { data: templates } = await supabase
          .from('templates')
          .select('*')
          .or(`id.eq.${instance.template_id},slug.eq.${instance.template_id}`)
          .limit(1);
        if (templates && templates.length > 0) {
          const raw = templates[0];
          template = {
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

      return res.status(200).json({
        success: true,
        instance,
        template: template || { id: instance.template_id, name: instance.name, slug: instance.template_id }
      });
    }

    // Default sample demos (john, anna)
    if (cleanSlug === 'john' || cleanSlug === 'anna') {
      return res.status(200).json({
        success: true,
        instance: {
          id: `inst-${cleanSlug}`,
          name: cleanSlug === 'john' ? 'John Doe Photography' : 'Anna Minimal Visuals',
          subdomain: cleanSlug,
          status: 'published',
          custom_data: {
            hero_title: cleanSlug === 'john' ? 'JOHN DOE' : 'ANNA MILLER',
            hero_subtitle: 'Creative Director & Digital Artist'
          }
        },
        template: {
          id: 't1',
          name: 'Port Photograph',
          slug: 'port-photograph'
        }
      });
    }

    return res.status(200).json({
      isOff: true,
      instance: { status: 'off', subdomain: cleanSlug },
      template: null
    });
  } catch (error: any) {
    console.error('Error resolving edge slug:', error);
    return res.status(500).json({ error: error.message || 'Internal error' });
  }
}
