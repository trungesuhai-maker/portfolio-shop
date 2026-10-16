import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://zeuiowqdzuwraqhkgkoo.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpldWlvd3FkenV3cmFxaGtna29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMTQyMTYsImV4cCI6MjEwNTc5MDIxNn0.WL3UwtGJ1e8x1YwvlC50tjwz_pywavAcSHM_gg25jUI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { subdomain, templateId, userId, customerName, customerEmail } = req.body || {};
    const cleanSubdomain = (subdomain || 'user').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

    if (!cleanSubdomain) {
      return res.status(400).json({ error: 'Subdomain is required' });
    }

    const siteUrl = `https://${cleanSubdomain}.webcuaban.site`;
    const viewerUrl = `/p/${cleanSubdomain}`;
    const nowIso = new Date().toISOString();

    // 1. Fetch template details
    let templateName = 'PORT PHOTOGRAPH';
    let originUrl = `https://webcuaban.site/p/${cleanSubdomain}`;
    let demoUrl = 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8';

    if (templateId) {
      const { data: tpls } = await supabase
        .from('templates')
        .select('*')
        .or(`id.eq.${templateId},slug.eq.${templateId}`)
        .limit(1);
      if (tpls && tpls.length > 0) {
        templateName = tpls[0].name || templateName;
        originUrl = tpls[0].origin_url || tpls[0].demo_url || originUrl;
        demoUrl = tpls[0].demo_url || demoUrl;
      }
    }

    // 2. Insert/Upsert into portfolio_instances
    const { error: instErr } = await supabase
      .from('portfolio_instances')
      .upsert({
        id: `inst-${cleanSubdomain}`,
        user_id: userId || null,
        template_id: templateId || 't1',
        name: templateName,
        subdomain: cleanSubdomain,
        custom_domain: `${cleanSubdomain}.webcuaban.site`,
        status: 'published',
        published_data: {
          site_url: siteUrl,
          viewer_url: viewerUrl,
          origin_url: originUrl,
          demo_url: demoUrl,
          admin_url: `/dashboard/portfolios/inst-${cleanSubdomain}/edit`,
          template_name: templateName,
          customer_name: customerName || cleanSubdomain.toUpperCase(),
          customer_email: customerEmail || '',
          hero_title: customerName || cleanSubdomain.toUpperCase(),
          hero_subtitle: 'Portfolio AI Studio đã kích hoạt bản quyền chính thức'
        },
        deployment_metadata: {
          official_url: siteUrl,
          internal_route: viewerUrl,
          origin_url: originUrl,
          demo_url: demoUrl,
          activated_at: nowIso
        }
      });

    // 3. Insert/Upsert into domains
    await supabase
      .from('domains')
      .upsert({
        id: `dom-${cleanSubdomain}`,
        portfolio_id: `inst-${cleanSubdomain}`,
        subdomain: cleanSubdomain,
        full_domain: `${cleanSubdomain}.webcuaban.site`,
        custom_domain: `${cleanSubdomain}.webcuaban.site`,
        status: 'active',
        ssl_status: 'valid',
        verified: true,
        dns_records: {
          site_url: siteUrl,
          viewer_url: viewerUrl,
          origin_url: originUrl,
          demo_url: demoUrl
        }
      });

    return res.status(200).json({
      success: true,
      instanceId: `inst-${cleanSubdomain}`,
      subdomain: cleanSubdomain,
      site_url: siteUrl,
      viewer_url: viewerUrl
    });
  } catch (error: any) {
    console.error('Provision error:', error);
    return res.status(500).json({ error: error.message || 'Internal error' });
  }
}
