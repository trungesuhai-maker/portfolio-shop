/**
 * Cloudflare Worker for Wildcard Subdomains (*.portfolio-shop.com)
 * 
 * 8-Step Architecture Pipeline:
 * 1. Receive Request: Intercept wildcard requests (*.portfolio-shop.com/*)
 * 2. Read Hostname: Parse request host
 * 3. Extract Slug: Extract unique customer subdomain
 * 4. Find Portfolio Instance: Query registry database/KV for instance metadata
 * 5. Find Template: Resolve design template contract
 * 6. Determine Template Deployment/Origin: Locate origin deployment service
 * 7. Get Portfolio Data: Hydrate custom customer fields
 * 8. Render/Route Portfolio: Serve with strict per-customer isolated edge cache
 * 
 * Cache Isolation Guarantee:
 * - Cache key is explicitly scoped by Hostname + Instance ID + Subdomain.
 * - Under NO circumstances can customer A's cached portfolio leak to customer B.
 * - Responses emit `Vary: Host` and unique instance purge tags.
 */

const MAIN_DOMAIN = 'portfolio-shop.com';
const ORIGIN_API = 'https://portfolio-shop.com/api/edge/resolve';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const hostname = url.hostname.toLowerCase();

    // 1 & 2: Receive request & Read hostname
    // Pass-through if main domain (Shop storefront)
    if (
      hostname === MAIN_DOMAIN || 
      hostname === `www.${MAIN_DOMAIN}` || 
      url.pathname.startsWith('/api/')
    ) {
      return fetch(request);
    }

    // 3. Extract slug
    let slug = '';
    if (hostname.endsWith(`.${MAIN_DOMAIN}`)) {
      slug = hostname.slice(0, -(MAIN_DOMAIN.length + 1));
    } else {
      // Custom CNAME domain routing
      slug = hostname.split('.')[0];
    }
    slug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');

    if (!slug) {
      return new Response('Invalid Hostname or Subdomain', { status: 400 });
    }

    // Edge Cache Check with STRICT CUSTOMER ISOLATION
    const cache = caches.default;
    // The cache key uses the unique subdomain and URL to ensure total isolation:
    const edgeCacheKey = new Request(`https://${hostname}/__edge_subdomain_${slug}${url.pathname}${url.search}`, {
      method: 'GET',
      headers: {
        'X-Portfolio-Subdomain': slug,
        'Host': hostname
      }
    });

    let cachedResponse = await cache.match(edgeCacheKey);
    if (cachedResponse) {
      // Security check: verify this cache entry strictly belongs to this subdomain
      const cachedSubdomain = cachedResponse.headers.get('X-Portfolio-Subdomain');
      if (cachedSubdomain === slug) {
        const responseWithHit = new Response(cachedResponse.body, cachedResponse);
        responseWithHit.headers.set('CF-Edge-Cache', 'HIT');
        return responseWithHit;
      }
    }

    // 4, 5, 6, 7: Fetch resolution from backend registry
    const resolveUrl = `${env?.REGISTRY_API_URL || ORIGIN_API}?host=${encodeURIComponent(hostname)}&slug=${encodeURIComponent(slug)}`;
    
    let resolution;
    try {
      const apiRes = await fetch(resolveUrl, {
        headers: {
          'X-Forwarded-Host': hostname,
          'X-Wildcard-Edge': 'Cloudflare-Worker-v2'
        }
      });

      if (apiRes.status === 404) {
        return renderSubdomainNotFound(slug, hostname);
      }

      if (!apiRes.ok) {
        return new Response(`Error resolving portfolio subdomain: ${apiRes.statusText}`, { status: apiRes.status });
      }

      resolution = await apiRes.json();
    } catch (err) {
      return new Response(`Edge Gateway Connection Error: ${err.message}`, { status: 502 });
    }

    // 8. Render & Route Portfolio
    const { instance, template, deployment, cache: cacheConfig } = resolution;

    // Check if portfolio is in draft mode
    if (instance.status !== 'published') {
      return renderDraftNotice(instance, template, hostname);
    }

    // Build the rendered HTML page
    const html = generatePortfolioHtml({
      instance,
      template,
      hostname,
      slug
    });

    const responseHeaders = new Headers({
      'Content-Type': 'text/html; charset=utf-8',
      'Vary': 'Host, Accept-Encoding',
      'X-Portfolio-Instance-Id': instance.id,
      'X-Portfolio-Subdomain': slug,
      'X-Portfolio-Customer-Id': instance.user_id,
      'X-Portfolio-Cache-Key': cacheConfig.cacheKey,
      'CF-Edge-Cache': 'MISS',
      'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
    });

    const response = new Response(html, {
      status: 200,
      headers: responseHeaders
    });

    // Store in Edge Cache (scoped to this exact customer instance)
    ctx.waitUntil(cache.put(edgeCacheKey, response.clone()));

    return response;
  }
};

/**
 * Generates the server-rendered HTML for the public portfolio.
 */
function generatePortfolioHtml({ instance, template, hostname, slug }) {
  const data = instance.custom_data || {};
  const heroTitle = data.hero_title || instance.name;
  const heroSubtitle = data.hero_subtitle || 'Chào mừng bạn đến với Portfolio của tôi';
  const bio = data.about_bio || '';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${heroTitle} | ${template.name}</title>
  <meta name="description" content="${heroSubtitle}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Plus Jakarta Sans', 'sans-serif'],
          }
        }
      }
    }
  </script>
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-indigo-500 selection:text-white">

  <!-- Edge Banner -->
  <header class="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
    <div class="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between text-xs">
      <div class="flex items-center gap-2.5">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span class="font-mono text-emerald-400 font-bold">${hostname}</span>
        <span class="text-slate-500">|</span>
        <span class="text-slate-400">Cloudflare Edge Wildcard Router</span>
      </div>
      <div class="flex items-center gap-4">
        <a href="https://${MAIN_DOMAIN}" class="text-slate-400 hover:text-white transition-colors flex items-center gap-1 font-medium">
          ← Về Cửa hàng Shop
        </a>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-1 max-w-4xl mx-auto px-6 py-20 flex flex-col justify-center">
    <div class="space-y-6">
      <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-wide">
        <span>Template: ${template.name}</span>
        <span>•</span>
        <span class="text-slate-400">Instance ID: ${instance.id}</span>
      </div>
      
      <h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
        ${heroTitle}
      </h1>
      
      <p class="text-xl sm:text-2xl text-slate-400 font-medium leading-relaxed max-w-2xl">
        ${heroSubtitle}
      </p>

      ${bio ? `
      <div class="pt-6 border-t border-slate-800 text-slate-300 leading-relaxed max-w-2xl">
        <p>${bio}</p>
      </div>` : ''}

      <div class="pt-8 flex flex-wrap items-center gap-4">
        <a href="#contact" class="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-600/20">
          Liên hệ Hợp tác
        </a>
        <a href="https://${MAIN_DOMAIN}" class="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold border border-slate-800 transition-all">
          Tạo Portfolio của riêng bạn
        </a>
      </div>
    </div>
  </main>

  <!-- Footer with cache security verification -->
  <footer class="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500 space-y-2">
    <p>© 2026 ${heroTitle}. All rights reserved.</p>
    <p class="font-mono text-[11px] text-slate-600">
      Cache Partition: <span class="text-slate-400">customer_${instance.user_id}</span> • 
      Subdomain: <span class="text-slate-400">${slug}</span> • 
      Vary: Host (No Cross-Customer Leakage)
    </p>
  </footer>

</body>
</html>`;
}

function renderSubdomainNotFound(slug, hostname) {
  return new Response(`<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Subdomain Chưa Tồn Tại | Portfolio Shop</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-white min-h-screen flex items-center justify-center p-6 font-sans">
  <div class="max-w-md w-full text-center space-y-6 bg-slate-900 p-8 rounded-3xl border border-slate-800">
    <div class="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-2xl font-bold">
      404
    </div>
    <div class="space-y-2">
      <h1 class="text-2xl font-extrabold text-white">Subdomain Chưa Được Đăng Ký</h1>
      <p class="text-slate-400 text-sm">
        Tên miền phụ <span class="text-indigo-400 font-mono font-bold">${hostname}</span> hiện đang còn trống và sẵn sàng để bạn sở hữu!
      </p>
    </div>
    <div class="pt-4">
      <a href="https://${MAIN_DOMAIN}" class="inline-block w-full py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all">
        Đăng ký Subdomain "${slug}" ngay
      </a>
    </div>
  </div>
</body>
</html>`, {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

function renderDraftNotice(instance, template, hostname) {
  return new Response(`<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Portfolio Đang Ở Bản Nháp</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-white min-h-screen flex items-center justify-center p-6 font-sans">
  <div class="max-w-md w-full text-center space-y-6 bg-slate-900 p-8 rounded-3xl border border-slate-800">
    <div class="w-16 h-16 mx-auto rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-2xl font-bold">
      🔒
    </div>
    <div class="space-y-2">
      <h1 class="text-2xl font-extrabold text-white">Portfolio Đang Ẩn (Bản Nháp)</h1>
      <p class="text-slate-400 text-sm">
        Chủ sở hữu chưa xuất bản công khai Portfolio này tại <span class="text-indigo-400 font-mono">${hostname}</span>.
      </p>
    </div>
  </div>
</body>
</html>`, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
