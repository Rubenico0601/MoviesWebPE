// StreamFlix — Cloudflare Worker TMDB Proxy
// Paste this into the Cloudflare Worker editor and click "Save and Deploy"

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const url = new URL(request.url);

  // All requests must start with /tmdb
  if (!url.pathname.startsWith('/tmdb')) {
    return new Response('StreamFlix proxy — add /tmdb/<path> to your request', {
      status: 200,
      headers: corsHeaders(),
    });
  }

  // Strip /tmdb and forward to TMDB API
  const tmdbPath = url.pathname.replace(/^\/tmdb/, '') || '/';
  const tmdbUrl  = 'https://api.themoviedb.org/3' + tmdbPath + url.search;

  const tmdbResponse = await fetch(tmdbUrl);
  const body         = await tmdbResponse.text();

  return new Response(body, {
    status:  tmdbResponse.status,
    headers: {
      'Content-Type':                'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods':'GET, OPTIONS',
      'Access-Control-Allow-Headers':'Content-Type',
    },
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
