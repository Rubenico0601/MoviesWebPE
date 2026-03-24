// ─────────────────────────────────────────────────────────────────────────────
// StreamFlix — Cloudflare Worker TMDB Proxy
//
// DEPLOY STEPS (free, no credit card):
//   1. Go to https://workers.cloudflare.com  → sign up / log in
//   2. Click "Create Worker"
//   3. Delete all default code, paste this entire file
//   4. Click "Save and Deploy"
//   5. Copy the worker URL shown (e.g. https://streamflix-proxy.YOUR-NAME.workers.dev)
//   6. Paste that URL into app.js → PROXY_BASE constant (instructions in app.js)
//
// What it does:
//   Browser → https://your-worker.workers.dev/tmdb/<path>?<query>
//           → Cloudflare Worker → api.themoviedb.org/3/<path>?<query>
//           → Response back to browser with CORS headers added
// ─────────────────────────────────────────────────────────────────────────────

export default {
  async fetch(request) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    const url = new URL(request.url);

    // Expect paths like /tmdb/movie/popular or /tmdb/trending/movie/week
    if (!url.pathname.startsWith('/tmdb')) {
      return new Response('Not found', { status: 404 });
    }

    // Strip /tmdb prefix → forward remainder to TMDB API
    const tmdbPath = url.pathname.replace(/^\/tmdb/, '') || '/';
    const tmdbUrl  = 'https://api.themoviedb.org/3' + tmdbPath + url.search;

    let response;
    try {
      response = await fetch(tmdbUrl, {
        headers: { 'Accept': 'application/json' },
        cf: { cacheTtl: 300, cacheEverything: true }, // cache at edge for 5 min
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Upstream fetch failed', detail: err.message }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }

    // Clone response and add CORS headers
    const body    = await response.arrayBuffer();
    const headers = new Headers(response.headers);
    Object.entries(corsHeaders()).forEach(([k, v]) => headers.set(k, v));

    return new Response(body, {
      status:  response.status,
      headers,
    });
  },
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
