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
    const { orderId, userId, payload } = req.body || {};
    const { subdomain, templateId, templateName, customerEmail, customerName, amount } = payload || {};

    const cleanSubdomain = (subdomain || 'user').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    const siteUrl = `https://${cleanSubdomain}.webcuaban.site`;
    const viewerUrl = `/p/${cleanSubdomain}`;

    if (orderId) {
      await supabase
        .from('orders')
        .upsert({
          id: orderId,
          user_id: userId || null,
          customer_name: customerName || 'Khách hàng',
          customer_email: customerEmail || 'customer@example.com',
          template_id: templateId || 't1',
          amount: amount || 390000,
          currency: 'VND',
          status: 'paid',
          payment_method: 'payos',
          instance_id: `inst-${cleanSubdomain}`,
          metadata: {
            template_name: templateName || 'PORT PHOTOGRAPH',
            subdomain: cleanSubdomain,
            site_url: siteUrl,
            viewer_url: viewerUrl,
            duration: '1 Năm'
          }
        });
    }

    return res.status(200).json({ success: true, verified: true });
  } catch (error: any) {
    console.error('Verify error:', error);
    return res.status(500).json({ error: error.message || 'Internal error' });
  }
}
