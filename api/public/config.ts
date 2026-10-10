export default function handler(_req: any, res: any) {
  res.status(200).json({
    supabaseUrl: process.env.VITE_SUPABASE_URL || 'https://zeuiowqdzuwraqhkgkoo.supabase.co',
    supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpldWlvd3FkenV3cmFxaGtna29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMTQyMTYsImV4cCI6MjEwNTc5MDIxNn0.WL3UwtGJ1e8x1YwvlC50tjwz_pywavAcSHM_gg25jUI'
  });
}
