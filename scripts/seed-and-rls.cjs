const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const reviewUrl = 'postgresql://postgres:Satthutihon1@db.zeuiowqdzuwraqhkgkoo.supabase.co:5432/postgres';
const mainUrl = 'postgresql://postgres:Satthutihon1@db.tmuiemficwylacoghvry.supabase.co:5432/postgres';

const categories = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/categories.json'), 'utf8'));
const templates = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/templates.json'), 'utf8'));

async function updateDb(connectionString, label) {
  console.log(`\n=== UPDATING ${label} DATABASE ===`);
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    // 1. Schema Upgrades & RLS Policies
    console.log('1. Setting Schema Upgrades, Constraints & RLS Policies...');
    await client.query(`
      ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

      -- Update payment_method check constraint to allow payos, vietqr, sandbox, bank_transfer, vnpay, momo, stripe
      ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
      ALTER TABLE public.orders ADD CONSTRAINT orders_payment_method_check 
        CHECK (payment_method IN ('sandbox', 'vnpay', 'momo', 'stripe', 'bank_transfer', 'payos', 'vietqr', 'vietqr_payos', 'manual'));

      DROP POLICY IF EXISTS "Anyone can insert portfolio instances" ON public.portfolio_instances;
      DROP POLICY IF EXISTS "Anyone can update portfolio instances" ON public.portfolio_instances;
      DROP POLICY IF EXISTS "Users manage their own portfolios" ON public.portfolio_instances;
      DROP POLICY IF EXISTS "Public view published portfolios" ON public.portfolio_instances;
      
      CREATE POLICY "Public view published portfolios" ON public.portfolio_instances FOR SELECT USING (true);
      CREATE POLICY "Anyone can insert portfolio instances" ON public.portfolio_instances FOR INSERT WITH CHECK (true);
      CREATE POLICY "Anyone can update portfolio instances" ON public.portfolio_instances FOR UPDATE USING (true);

      DROP POLICY IF EXISTS "Anyone can insert domains" ON public.domains;
      DROP POLICY IF EXISTS "Anyone can update domains" ON public.domains;
      DROP POLICY IF EXISTS "Public read active domains" ON public.domains;
      DROP POLICY IF EXISTS "Users manage their domains" ON public.domains;

      CREATE POLICY "Public read active domains" ON public.domains FOR SELECT USING (true);
      CREATE POLICY "Anyone can insert domains" ON public.domains FOR INSERT WITH CHECK (true);
      CREATE POLICY "Anyone can update domains" ON public.domains FOR UPDATE USING (true);

      DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
      DROP POLICY IF EXISTS "Users view their own orders" ON public.orders;
      DROP POLICY IF EXISTS "Anyone can update orders" ON public.orders;
      DROP POLICY IF EXISTS "Public view orders" ON public.orders;

      CREATE POLICY "Public view orders" ON public.orders FOR SELECT USING (true);
      CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
      CREATE POLICY "Anyone can update orders" ON public.orders FOR UPDATE USING (true);

      DROP POLICY IF EXISTS "Anyone can create payments" ON public.payments;
      DROP POLICY IF EXISTS "Public view payments" ON public.payments;
      CREATE POLICY "Public view payments" ON public.payments FOR SELECT USING (true);
      CREATE POLICY "Anyone can create payments" ON public.payments FOR INSERT WITH CHECK (true);

      DROP POLICY IF EXISTS "Anyone can create user_licenses" ON public.user_licenses;
      DROP POLICY IF EXISTS "Public view user_licenses" ON public.user_licenses;
      CREATE POLICY "Public view user_licenses" ON public.user_licenses FOR SELECT USING (true);
      CREATE POLICY "Anyone can create user_licenses" ON public.user_licenses FOR INSERT WITH CHECK (true);

      DROP POLICY IF EXISTS "Public read categories" ON public.categories;
      DROP POLICY IF EXISTS "Anyone manage categories" ON public.categories;
      CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
      CREATE POLICY "Anyone manage categories" ON public.categories FOR ALL USING (true);

      DROP POLICY IF EXISTS "Public read templates" ON public.templates;
      DROP POLICY IF EXISTS "Anyone manage templates" ON public.templates;
      CREATE POLICY "Public read templates" ON public.templates FOR SELECT USING (true);
      CREATE POLICY "Anyone manage templates" ON public.templates FOR ALL USING (true);
    `);

    // 2. Seed Categories
    console.log('2. Seeding Categories...');
    for (const cat of categories) {
      await client.query(
        `INSERT INTO public.categories (id, name, slug, description, icon, display_order, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           slug = EXCLUDED.slug,
           description = EXCLUDED.description,
           icon = EXCLUDED.icon,
           display_order = EXCLUDED.display_order`,
        [cat.id, cat.name, cat.slug, cat.description || '', cat.icon || 'folder', cat.displayOrder || 0]
      );
    }

    // 3. Seed Templates
    console.log('3. Seeding Templates...');
    for (const tpl of templates) {
      await client.query(
        `INSERT INTO public.templates (
          id, name, slug, description, category_id, price, sale_price, currency,
          thumbnail_url, gallery, demo_url, origin_url, version, schema_version,
          status, tags, badge, bg_color_class, is_new, is_popular, is_featured,
          editable_fields, default_data, seo_config, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, NOW(), NOW()
        ) ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          description = EXCLUDED.description,
          category_id = EXCLUDED.category_id,
          price = EXCLUDED.price,
          sale_price = EXCLUDED.sale_price,
          currency = EXCLUDED.currency,
          thumbnail_url = EXCLUDED.thumbnail_url,
          gallery = EXCLUDED.gallery,
          demo_url = EXCLUDED.demo_url,
          origin_url = EXCLUDED.origin_url,
          status = EXCLUDED.status,
          tags = EXCLUDED.tags,
          badge = EXCLUDED.badge,
          bg_color_class = EXCLUDED.bg_color_class,
          is_new = EXCLUDED.is_new,
          is_popular = EXCLUDED.is_popular,
          is_featured = EXCLUDED.is_featured,
          editable_fields = EXCLUDED.editable_fields,
          default_data = EXCLUDED.default_data,
          seo_config = EXCLUDED.seo_config,
          updated_at = NOW()`,
        [
          tpl.id,
          tpl.name,
          tpl.slug,
          tpl.description || '',
          tpl.categoryId || 'c1',
          tpl.price || 490000,
          tpl.salePrice || 390000,
          tpl.currency || 'VND',
          tpl.thumbnail || '',
          JSON.stringify(tpl.gallery || []),
          tpl.demoUrl || '',
          tpl.originUrl || '',
          tpl.version || '1.0.0',
          tpl.schemaVersion || '1.0.0',
          tpl.status || 'published',
          JSON.stringify(tpl.tags || []),
          tpl.badge || null,
          tpl.bgColorClass || null,
          Boolean(tpl.isNew),
          Boolean(tpl.isPopular),
          Boolean(tpl.isFeatured),
          JSON.stringify(tpl.editableFields || []),
          JSON.stringify(tpl.defaultData || {}),
          JSON.stringify(tpl.seo || {})
        ]
      );
    }

    // 4. Lookup user ID for trungesuhai@gmail.com
    console.log('4. Looking up user ID for trungesuhai@gmail.com...');
    const userRes = await client.query("SELECT id FROM auth.users WHERE email = 'trungesuhai@gmail.com' LIMIT 1");
    const userId = userRes.rows[0]?.id || null;
    console.log(`Found User ID: ${userId}`);

    const siteUrl = 'https://trungesuhai.webcuaban.site';
    const viewerUrl = '/p/trungesuhai';
    const originUrl = 'https://ais-pre-cbg6p5tmrlyzcymqqfrmqj-395109314000.asia-southeast1.run.app';
    const demoUrl = 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8';
    const adminUrl = '/dashboard/portfolios/inst-trungesuhai/edit';

    const publishedData = {
      site_url: siteUrl,
      viewer_url: viewerUrl,
      origin_url: originUrl,
      demo_url: demoUrl,
      admin_url: adminUrl,
      template_name: 'PORT PHOTOGRAPH',
      customer_name: 'Trung Trần',
      customer_email: 'trungesuhai@gmail.com',
      hero_title: 'TRUNG TRẦN',
      hero_subtitle: 'Portfolio AI Studio đã kích hoạt bản quyền chính thức'
    };

    const deploymentMetadata = {
      official_url: siteUrl,
      internal_route: viewerUrl,
      origin_url: originUrl,
      demo_url: demoUrl,
      activated_at: new Date().toISOString()
    };

    // 5. Insert Portfolio Instance
    console.log('5. Inserting Portfolio Instance for trungesuhai...');
    await client.query("DELETE FROM public.portfolio_instances WHERE id = 'inst-trungesuhai' OR subdomain = 'trungesuhai'");
    await client.query(
      `INSERT INTO public.portfolio_instances (
        id, user_id, template_id, name, subdomain, custom_domain, status, published_data, deployment_metadata, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
      [
        'inst-trungesuhai',
        userId,
        't1',
        'PORT PHOTOGRAPH',
        'trungesuhai',
        'trungesuhai.webcuaban.site',
        'published',
        publishedData,
        deploymentMetadata
      ]
    );

    // 6. Insert Domain
    console.log('6. Inserting Domain for trungesuhai...');
    await client.query("DELETE FROM public.domains WHERE id = 'dom-trungesuhai' OR subdomain = 'trungesuhai'");
    await client.query(
      `INSERT INTO public.domains (
        id, portfolio_id, subdomain, full_domain, custom_domain, status, ssl_status, verified, dns_records, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [
        'dom-trungesuhai',
        'inst-trungesuhai',
        'trungesuhai',
        'trungesuhai.webcuaban.site',
        'trungesuhai.webcuaban.site',
        'active',
        'valid',
        true,
        { site_url: siteUrl, viewer_url: viewerUrl, origin_url: originUrl, demo_url: demoUrl }
      ]
    );

    // 7. Insert Order
    console.log('7. Inserting Order for trungesuhai...');
    await client.query("DELETE FROM public.orders WHERE id = 'ORD-162336' OR instance_id = 'inst-trungesuhai'");
    await client.query(
      `INSERT INTO public.orders (
        id, user_id, customer_name, customer_email, template_id, amount, currency, status, payment_method, transaction_ref, instance_id, metadata, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
      [
        'ORD-162336',
        userId,
        'Trung Trần',
        'trungesuhai@gmail.com',
        't1',
        390000,
        'VND',
        'paid',
        'payos',
        'PORTFOLIO ORD162336',
        'inst-trungesuhai',
        {
          template_name: 'PORT PHOTOGRAPH',
          subdomain: 'trungesuhai',
          site_url: siteUrl,
          viewer_url: viewerUrl,
          origin_url: originUrl,
          demo_url: demoUrl,
          duration: '1 Năm'
        }
      ]
    );

    // 8. Insert User License
    if (userId) {
      console.log('8. Inserting User License...');
      await client.query("DELETE FROM public.user_licenses WHERE user_id = $1 AND template_id = 't1'", [userId]);
      await client.query(
        `INSERT INTO public.user_licenses (
          user_id, template_id, order_id, license_type, is_active, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [userId, 't1', 'ORD-162336', 'standard', true]
      );
    }

    console.log(`>>> ${label} DATABASE SYNCED SUCCESSFULLY! <<<`);
  } catch (err) {
    console.error(`Error syncing ${label}:`, err);
    throw err;
  } finally {
    await client.end();
  }
}

async function main() {
  await updateDb(reviewUrl, 'REVIEW');
  await updateDb(mainUrl, 'MAIN');
}

main().catch(console.error);
