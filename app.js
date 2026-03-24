// ─────────────────────────────────────────────────────────────────────────────
// TMDB CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const API_KEY  = 'd4efd0f5ee17df1f22d1cc4a1e83725a';

// ─── PROXY CONFIG ────────────────────────────────────────────────────────────
// After deploying cloudflare-worker.js, replace the string below with your
// worker URL, e.g. 'https://streamflix-proxy.your-name.workers.dev/tmdb'
// Until then it falls back to the direct TMDB URL (works where not blocked).
const PROXY_BASE  = 'https://delicate-bonus-064d.ruben-charles2508.workers.dev/tmdb';
const DIRECT_BASE = 'https://api.themoviedb.org/3';
const BASE_URL    = PROXY_BASE.startsWith('YOUR') ? DIRECT_BASE : PROXY_BASE;
// ─────────────────────────────────────────────────────────────────────────────

const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const BG_BASE  = 'https://image.tmdb.org/t/p/original';

// ─────────────────────────────────────────────────────────────────────────────
// PAGE DEFINITIONS
// Each page declares its hero source and its content rows.
// ─────────────────────────────────────────────────────────────────────────────
const HERO_GENRE_MAP = {
  popular: '/movie/popular',
  action:  '/discover/movie?with_genres=28&sort_by=popularity.desc',
  drama:   '/discover/movie?with_genres=18&sort_by=popularity.desc',
  scifi:   '/discover/movie?with_genres=878&sort_by=popularity.desc',
  comedy:  '/discover/movie?with_genres=35&sort_by=popularity.desc',
  horror:  '/discover/movie?with_genres=27&sort_by=popularity.desc',
};

const PAGES = {
  home: {
    heroEndpoint: null,          // resolved at render time using CT hero_genre var
    heroMediaType: 'movie',
    heroTag: 'Featured Film',    // overridden by CT hero_tag_label
    rows: [
      { id: 'trending', label: 'Trending Now',           endpoint: '/trending/movie/week', mediaType: 'movie' },
      { id: 'popular',  label: 'Popular on StreamFlix',  endpoint: '/movie/popular',       mediaType: 'movie' },
      { id: 'toprated', label: 'Top Rated',              endpoint: '/movie/top_rated',     mediaType: 'movie' },
      { id: 'tvshows',  label: 'Popular TV Shows',       endpoint: '/tv/popular',          mediaType: 'tv'    },
    ],
  },
  tvshows: {
    heroEndpoint: '/tv/popular',
    heroMediaType: 'tv',
    heroTag: 'Featured Series',
    rows: [
      { id: 'tv_popular',  label: 'Popular TV Shows',    endpoint: '/tv/popular',                                               mediaType: 'tv' },
      { id: 'tv_toprated', label: 'Top Rated TV',        endpoint: '/tv/top_rated',                                             mediaType: 'tv' },
      { id: 'tv_action',   label: 'Action & Adventure',  endpoint: '/discover/tv?with_genres=10759&sort_by=popularity.desc',    mediaType: 'tv' },
      { id: 'tv_drama',    label: 'Drama',               endpoint: '/discover/tv?with_genres=18&sort_by=popularity.desc',       mediaType: 'tv' },
      { id: 'tv_comedy',   label: 'Comedy',              endpoint: '/discover/tv?with_genres=35&sort_by=popularity.desc',       mediaType: 'tv' },
      { id: 'tv_crime',    label: 'Crime',               endpoint: '/discover/tv?with_genres=80&sort_by=popularity.desc',       mediaType: 'tv' },
      { id: 'tv_scifi',    label: 'Sci-Fi & Fantasy',    endpoint: '/discover/tv?with_genres=10765&sort_by=popularity.desc',    mediaType: 'tv' },
    ],
  },
  movies: {
    heroEndpoint: null,          // also uses CT hero_genre var
    heroMediaType: 'movie',
    heroTag: 'Now Showing',
    rows: [
      { id: 'mov_popular',  label: 'Popular Movies',     endpoint: '/movie/popular',                                            mediaType: 'movie' },
      { id: 'mov_toprated', label: 'Top Rated',          endpoint: '/movie/top_rated',                                          mediaType: 'movie' },
      { id: 'mov_action',   label: 'Action',             endpoint: '/discover/movie?with_genres=28&sort_by=popularity.desc',    mediaType: 'movie' },
      { id: 'mov_comedy',   label: 'Comedy',             endpoint: '/discover/movie?with_genres=35&sort_by=popularity.desc',    mediaType: 'movie' },
      { id: 'mov_drama',    label: 'Drama',              endpoint: '/discover/movie?with_genres=18&sort_by=popularity.desc',    mediaType: 'movie' },
      { id: 'mov_horror',   label: 'Horror',             endpoint: '/discover/movie?with_genres=27&sort_by=popularity.desc',    mediaType: 'movie' },
      { id: 'mov_scifi',    label: 'Sci-Fi',             endpoint: '/discover/movie?with_genres=878&sort_by=popularity.desc',   mediaType: 'movie' },
      { id: 'mov_romance',  label: 'Romance',            endpoint: '/discover/movie?with_genres=10749&sort_by=popularity.desc', mediaType: 'movie' },
    ],
  },
  new: {
    heroEndpoint: '/trending/all/week',
    heroMediaType: 'auto',       // TMDB returns mixed results; media_type field used
    heroTag: 'Trending This Week',
    rows: [
      { id: 'new_trend_m',  label: 'Trending Movies',    endpoint: '/trending/movie/week',  mediaType: 'movie' },
      { id: 'new_trend_t',  label: 'Trending TV Shows',  endpoint: '/trending/tv/week',     mediaType: 'tv'    },
      { id: 'new_theatres', label: 'Now in Theatres',    endpoint: '/movie/now_playing',    mediaType: 'movie' },
      { id: 'new_upcoming', label: 'Coming Soon',        endpoint: '/movie/upcoming',       mediaType: 'movie' },
      { id: 'new_airing',   label: 'Airing Today',       endpoint: '/tv/airing_today',      mediaType: 'tv'    },
      { id: 'new_onair',    label: 'On The Air',         endpoint: '/tv/on_the_air',        mediaType: 'tv'    },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// MY LIST — persisted in localStorage
// ─────────────────────────────────────────────────────────────────────────────
function getMyList() {
  return JSON.parse(localStorage.getItem('sf_mylist') || '[]');
}

function isInMyList(id) {
  return getMyList().some(item => item.id === id);
}

function addToMyList(item) {
  const list = getMyList();
  if (!isInMyList(item.id)) {
    list.push(item);
    localStorage.setItem('sf_mylist', JSON.stringify(list));
  }
}

function removeFromMyList(id) {
  const list = getMyList().filter(item => item.id !== id);
  localStorage.setItem('sf_mylist', JSON.stringify(list));
}

// Modal My List toggle — called by the button in the modal
let _modalItem = null;  // set when openModal resolves
window.toggleMyList = function () {
  if (!_modalItem) return;
  const btn = document.getElementById('modal-mylist-btn');
  if (isInMyList(_modalItem.id)) {
    removeFromMyList(_modalItem.id);
    btn.textContent = '+ My List';
    btn.classList.remove('in-list');
  } else {
    addToMyList(_modalItem);
    btn.textContent = '✓ In My List';
    btn.classList.add('in-list');
  }
  // Refresh My List page if currently on it
  if (currentPage === 'mylist') renderMyListPage();
};

// ─────────────────────────────────────────────────────────────────────────────
// CLEVERTAP — User Properties & Events
// ─────────────────────────────────────────────────────────────────────────────
function trackSessionCount() {
  const count = parseInt(localStorage.getItem('sf_session_count') || '0', 10) + 1;
  localStorage.setItem('sf_session_count', count);
  clevertap.profile.push({ Site: { 'Session Count': count } });
  console.log('[CleverTap] Session Count:', count);
  return count;
}

function trackCardClick(item, mediaType) {
  const eventName = mediaType === 'tv' ? 'tv_click' : 'movie_click';
  clevertap.event.push(eventName, {
    'Content ID': item.id,
    'Title':      item.title || item.name,
    'Rating':     item.vote_average ?? null,
    'Media Type': mediaType,
  });

  const movieClicks = parseInt(localStorage.getItem('sf_movie_clicks') || '0', 10) + (mediaType === 'movie' ? 1 : 0);
  const tvClicks    = parseInt(localStorage.getItem('sf_tv_clicks')    || '0', 10) + (mediaType === 'tv'    ? 1 : 0);
  localStorage.setItem('sf_movie_clicks', movieClicks);
  localStorage.setItem('sf_tv_clicks',    tvClicks);

  const total = movieClicks + tvClicks;
  let preference = 'mixed';
  if (total >= 3) {
    const ratio = movieClicks / total;
    if (ratio >= 0.7)      preference = 'movies';
    else if (ratio <= 0.3) preference = 'tv';
  }
  clevertap.profile.push({ Site: { 'Content Preference': preference } });
  console.log(`[CleverTap] Content Preference → "${preference}" (🎬${movieClicks} 📺${tvClicks})`);
}

function setPlanType(plan) {
  clevertap.profile.push({ Site: { 'Plan Type': plan } });
  console.log('[CleverTap] Plan Type:', plan);
}

// ─────────────────────────────────────────────────────────────────────────────
// CLEVERTAP — Remote Config variables
// ─────────────────────────────────────────────────────────────────────────────
let ctVars = {};

function defineCleverTapVariables() {
  ctVars.hero_genre       = clevertap.defineVariable('CTWebsite.hero_genre',       'popular');
  ctVars.hero_tag_label   = clevertap.defineVariable('CTWebsite.hero_tag_label',   'Featured Film');
  ctVars.row_order        = clevertap.defineVariable('CTWebsite.row_order',        'trending,popular,toprated,tvshows');
  ctVars.show_tv_row      = clevertap.defineVariable('CTWebsite.show_tv_row',      true);
  ctVars.trending_label   = clevertap.defineVariable('CTWebsite.trending_label',   'Trending Now');
  ctVars.accent_color     = clevertap.defineVariable('CTWebsite.accent_color',     '#e50914');
  ctVars.hero_cta_label   = clevertap.defineVariable('CTWebsite.hero_cta_label',   'Play');
  ctVars.show_match_score = clevertap.defineVariable('CTWebsite.show_match_score', true);
}

function getVariableValues() {
  return {
    hero_genre:       ctVars.hero_genre?.getValue()       ?? 'popular',
    hero_tag_label:   ctVars.hero_tag_label?.getValue()   ?? 'Featured Film',
    row_order:        ctVars.row_order?.getValue()         ?? 'trending,popular,toprated,tvshows',
    show_tv_row:      ctVars.show_tv_row?.getValue()       ?? true,
    trending_label:   ctVars.trending_label?.getValue()    ?? 'Trending Now',
    accent_color:     ctVars.accent_color?.getValue()      ?? '#e50914',
    hero_cta_label:   ctVars.hero_cta_label?.getValue()    ?? 'Play',
    show_match_score: ctVars.show_match_score?.getValue()  ?? true,
  };
}

function applyUIVariables(vals) {
  document.documentElement.style.setProperty('--red', vals.accent_color);
  const heroCta = document.getElementById('hero-cta');
  if (heroCta) heroCta.innerHTML = `&#9654; ${vals.hero_cta_label}`;
  updateDebugPanel(vals);
}

// ─────────────────────────────────────────────────────────────────────────────
// FETCH HELPER
// ─────────────────────────────────────────────────────────────────────────────
async function fetchData(endpoint) {
  const sep = endpoint.includes('?') ? '&' : '?';
  const res = await fetch(`${BASE_URL}${endpoint}${sep}api_key=${API_KEY}&language=en-US`);
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────────────────────
async function loadHero(page, vals) {
  const pageDef = PAGES[page];
  let endpoint  = pageDef.heroEndpoint;

  // Home and Movies pages use the CT hero_genre variable
  if (endpoint === null) {
    const genre = vals.hero_genre in HERO_GENRE_MAP ? vals.hero_genre : 'popular';
    endpoint    = HERO_GENRE_MAP[genre];
  }

  const data  = await fetchData(endpoint);
  const items = data.results.filter(m => m.backdrop_path);
  const item  = items[Math.floor(Math.random() * Math.min(5, items.length))];
  const mtype = pageDef.heroMediaType === 'auto' ? (item.media_type || 'movie') : pageDef.heroMediaType;

  // UC1 — hero_tag_label only applies on home + movies; other pages use their own tag
  const tag = (page === 'home' || page === 'movies') ? vals.hero_tag_label : pageDef.heroTag;

  document.getElementById('hero').style.backgroundImage = `url(${BG_BASE}${item.backdrop_path})`;
  document.getElementById('hero-tag').textContent        = tag;
  document.getElementById('hero-title').textContent      = item.title || item.name;
  document.getElementById('hero-desc').textContent       = item.overview;
  document.getElementById('hero-title').style.cursor     = 'pointer';
  document.getElementById('hero-title').onclick          = () => openModal(item.id, mtype);
  document.getElementById('hero-info').onclick           = () => openModal(item.id, mtype);
}

// ─────────────────────────────────────────────────────────────────────────────
// ROWS — generic renderer used by all pages
// ─────────────────────────────────────────────────────────────────────────────
function buildRowHTML(rowId, label) {
  return `
    <section class="row" id="${rowId}-section">
      <h2 class="row-title">${label}</h2>
      <div class="slider-wrapper">
        <button class="slider-btn left"  onclick="slide('${rowId}', -1)">&#8249;</button>
        <div class="row-cards" id="${rowId}"></div>
        <button class="slider-btn right" onclick="slide('${rowId}', 1)">&#8250;</button>
      </div>
    </section>`;
}

async function loadPageRows(rows, showMatchScore) {
  const main = document.getElementById('main-content');
  main.innerHTML = rows.map(r => buildRowHTML(r.id, r.label)).join('');
  rows.forEach(r => showSkeletons(r.id));

  const fetches = rows.map(r => fetchData(r.endpoint).then(data => ({ r, data })));
  const results = await Promise.all(fetches);
  results.forEach(({ r, data }) => renderCards(r.id, data.results, r.mediaType, showMatchScore));
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME PAGE — CT row_order / show_tv_row / trending_label applied here
// ─────────────────────────────────────────────────────────────────────────────
async function renderHomePage(vals) {
  let rows = vals.row_order
    .split(',')
    .map(s => s.trim())
    .filter(id => PAGES.home.rows.find(r => r.id === id))
    .map(id => {
      const base = PAGES.home.rows.find(r => r.id === id);
      // UC2: apply trending_label from CT
      return id === 'trending' ? { ...base, label: vals.trending_label } : base;
    });

  if (!vals.show_tv_row) rows = rows.filter(r => r.id !== 'tvshows');

  await loadPageRows(rows, vals.show_match_score);
}

// ─────────────────────────────────────────────────────────────────────────────
// MY LIST PAGE — no hero, grid layout
// ─────────────────────────────────────────────────────────────────────────────
function renderMyListPage() {
  const list = getMyList();
  const vals = getVariableValues();
  const main = document.getElementById('main-content');

  if (list.length === 0) {
    main.innerHTML = `
      <div class="mylist-empty">
        <p>Your list is empty.</p>
        <p style="color:#666;font-size:14px;margin-top:8px;">Click "+ My List" on any title to save it here.</p>
      </div>`;
    return;
  }

  main.innerHTML = `
    <section class="row mylist-grid-section">
      <div class="mylist-grid" id="mylist-grid"></div>
    </section>`;

  const grid = document.getElementById('mylist-grid');
  list.forEach(item => {
    if (!item.poster_path) return;
    const card = document.createElement('div');
    card.className = 'card mylist-card';
    const ratingHtml = vals.show_match_score
      ? `<div class="card-rating">★ ${item.vote_average?.toFixed(1) ?? 'N/A'}</div>`
      : '';
    card.innerHTML = `
      <img src="${IMG_BASE}${item.poster_path}" alt="${item.title || item.name}" loading="lazy" />
      <div class="card-info">
        <div class="card-title">${item.title || item.name}</div>
        ${ratingHtml}
        <div class="card-remove" onclick="event.stopPropagation(); removeFromMyList(${item.id}); renderMyListPage();">✕ Remove</div>
      </div>`;
    card.addEventListener('click', () => openModal(item.id, item.mediaType || 'movie'));
    grid.appendChild(card);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD RENDERING
// ─────────────────────────────────────────────────────────────────────────────
function renderCards(containerId, items, mediaType = 'movie', showMatchScore = true) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  items.forEach(item => {
    if (!item.poster_path) return;
    const card = document.createElement('div');
    card.className = 'card';
    const ratingHtml = showMatchScore
      ? `<div class="card-rating">★ ${item.vote_average?.toFixed(1) ?? 'N/A'}</div>`
      : '';
    card.innerHTML = `
      <img src="${IMG_BASE}${item.poster_path}" alt="${item.title || item.name}" loading="lazy" />
      <div class="card-info">
        <div class="card-title">${item.title || item.name}</div>
        ${ratingHtml}
      </div>`;
    card.addEventListener('click', () => {
      trackCardClick(item, mediaType);
      openModal(item.id, mediaType);
    });
    container.appendChild(card);
  });
}

function showSkeletons(containerId, count = 8) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = Array(count).fill(`<div class="card card-skeleton"></div>`).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────────────────────────────────────
async function openModal(id, mediaType) {
  _modalItem = null;
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  document.getElementById('modal-title').textContent    = 'Loading…';
  document.getElementById('modal-overview').textContent = '';
  document.getElementById('modal-meta').innerHTML       = '';
  document.getElementById('modal-backdrop').style.backgroundImage = '';
  document.getElementById('modal-mylist-btn').textContent = '+ My List';
  document.getElementById('modal-mylist-btn').classList.remove('in-list');

  const data = await fetchData(`/${mediaType}/${id}`);
  _modalItem = { ...data, mediaType };

  document.getElementById('modal-title').textContent =
    data.title || data.name;
  document.getElementById('modal-overview').textContent =
    data.overview || 'No description available.';

  if (data.backdrop_path) {
    document.getElementById('modal-backdrop').style.backgroundImage =
      `url(${BG_BASE}${data.backdrop_path})`;
  }

  // My List button state
  const listBtn = document.getElementById('modal-mylist-btn');
  if (isInMyList(id)) {
    listBtn.textContent = '✓ In My List';
    listBtn.classList.add('in-list');
  }

  const vals      = getVariableValues();
  const year      = (data.release_date || data.first_air_date || '').slice(0, 4);
  const matchScore = vals.show_match_score && data.vote_average
    ? Math.round(data.vote_average * 10) + '% Match' : '';
  const runtime = mediaType === 'movie'
    ? (data.runtime ? `${data.runtime} min` : '')
    : (data.number_of_seasons
        ? `${data.number_of_seasons} Season${data.number_of_seasons > 1 ? 's' : ''}` : '');

  document.getElementById('modal-meta').innerHTML = `
    ${matchScore ? `<span class="match">${matchScore}</span>` : ''}
    ${year       ? `<span>${year}</span>`                     : ''}
    ${runtime    ? `<span class="rating">${runtime}</span>`   : ''}
    ${data.genres?.slice(0, 3).map(g => `<span>${g.name}</span>`).join('') ?? ''}`;
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ─────────────────────────────────────────────────────────────────────────────
// SLIDER
// ─────────────────────────────────────────────────────────────────────────────
function slide(containerId, direction) {
  const el = document.getElementById(containerId);
  if (el) el.scrollBy({ left: direction * 700, behavior: 'smooth' });
}

// ─────────────────────────────────────────────────────────────────────────────
// NAVBAR
// ─────────────────────────────────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  document.querySelector('.navbar').classList.toggle('scrolled', window.scrollY > 60);
});

function setActiveNav(page) {
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTER
// ─────────────────────────────────────────────────────────────────────────────
let currentPage = 'home';

async function navigateTo(page) {
  if (!PAGES[page] && page !== 'mylist') page = 'home';
  currentPage = page;
  window.location.hash = page;
  setActiveNav(page);
  window.scrollTo({ top: 0 });

  const vals     = getVariableValues();
  const hero     = document.getElementById('hero');
  const banner   = document.getElementById('page-banner');
  const main     = document.getElementById('main-content');

  // Page transition fade
  main.classList.add('page-fade');
  setTimeout(() => main.classList.remove('page-fade'), 300);

  applyUIVariables(vals);

  if (page === 'mylist') {
    // My List: hide hero, show banner
    hero.style.display   = 'none';
    banner.style.display = 'flex';
    document.getElementById('page-banner-title').textContent = 'My List';
    document.getElementById('page-banner-sub').textContent   =
      `${getMyList().length} title${getMyList().length !== 1 ? 's' : ''} saved`;
    renderMyListPage();
    return;
  }

  // All other pages: show hero, hide banner
  hero.style.display   = '';
  banner.style.display = 'none';

  try {
    if (page === 'home') {
      await Promise.all([loadHero(page, vals), renderHomePage(vals)]);
    } else {
      await Promise.all([loadHero(page, vals), loadPageRows(PAGES[page].rows, vals.show_match_score)]);
    }
  } catch (err) {
    console.error('StreamFlix load error:', err);
    document.getElementById('hero-title').textContent = 'Could not load content.';
  }
}

window.addEventListener('hashchange', () => {
  const page = window.location.hash.replace('#', '') || 'home';
  navigateTo(page);
});

// ─────────────────────────────────────────────────────────────────────────────
// DEBUG PANEL
// ─────────────────────────────────────────────────────────────────────────────
const VARIABLE_LABELS = {
  hero_genre: 'CTWebsite.hero_genre', hero_tag_label: 'CTWebsite.hero_tag_label',
  row_order: 'CTWebsite.row_order', show_tv_row: 'CTWebsite.show_tv_row',
  trending_label: 'CTWebsite.trending_label', accent_color: 'CTWebsite.accent_color',
  hero_cta_label: 'CTWebsite.hero_cta_label', show_match_score: 'CTWebsite.show_match_score',
};

const VARIABLE_DEFAULTS = {
  hero_genre: 'popular', hero_tag_label: 'Featured Film',
  row_order: 'trending,popular,toprated,tvshows', show_tv_row: true,
  trending_label: 'Trending Now', accent_color: '#e50914',
  hero_cta_label: 'Play', show_match_score: true,
};

function updateDebugPanel(vals) {
  const body = document.getElementById('ct-debug-body');
  if (!body) return;

  const currentPlan  = localStorage.getItem('sf_plan_type')    || 'free';
  const sessionCount = localStorage.getItem('sf_session_count') || '0';
  const movieClicks  = localStorage.getItem('sf_movie_clicks')  || '0';
  const tvClicks     = localStorage.getItem('sf_tv_clicks')     || '0';
  const total        = parseInt(movieClicks) + parseInt(tvClicks);
  const movieRatio   = total > 0 ? Math.round((parseInt(movieClicks) / total) * 100) : 0;
  const preference   = total < 3 ? 'mixed (need 3+ clicks)'
    : movieRatio >= 70 ? 'movies' : movieRatio <= 30 ? 'tv' : 'mixed';

  const userPropsHtml = `
    <div style="border-bottom:1px solid #333;padding-bottom:10px;margin-bottom:10px;">
      <div style="color:#888;font-size:10px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">User Properties</div>
      <div class="ct-var-row" style="margin-bottom:6px;">
        <span class="ct-var-name">Session Count</span>
        <span class="ct-var-value">${sessionCount}</span>
      </div>
      <div class="ct-var-row" style="margin-bottom:6px;">
        <span class="ct-var-name">Content Preference</span>
        <span class="ct-var-value" style="color:${preference.startsWith('mixed') ? '#aaa' : '#46d369'}">
          ${preference}
          <span style="color:#666;font-size:10px;margin-left:4px;">(🎬${movieClicks} 📺${tvClicks})</span>
        </span>
      </div>
      <div class="ct-var-row">
        <span class="ct-var-name">Plan Type</span>
        <select onchange="window.changePlanType(this.value)"
          style="background:#2a2a2a;color:white;border:1px solid #444;border-radius:4px;padding:2px 6px;font-size:11px;cursor:pointer;margin-top:3px;">
          ${['free','premium','trial'].map(p =>
            `<option value="${p}" ${p === currentPlan ? 'selected' : ''}>${p}</option>`
          ).join('')}
        </select>
      </div>
    </div>
    <div style="color:#888;font-size:10px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Remote Config Variables</div>`;

  body.innerHTML = userPropsHtml + Object.entries(vals).map(([key, val]) => {
    const isRemote = String(val) !== String(VARIABLE_DEFAULTS[key]);
    const badge    = isRemote
      ? `<span class="ct-badge ct-badge-remote">REMOTE</span>`
      : `<span class="ct-badge ct-badge-default">DEFAULT</span>`;
    const swatch   = key === 'accent_color'
      ? `<span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${val};margin-right:4px;vertical-align:middle;"></span>`
      : '';
    return `
      <div class="ct-var-row">
        <span class="ct-var-name">${VARIABLE_LABELS[key] ?? key}</span>
        <span class="ct-var-value ${isRemote ? 'is-remote' : ''}">${swatch}${val}${badge}</span>
      </div>`;
  }).join('');
}

window.changePlanType = function (plan) {
  localStorage.setItem('sf_plan_type', plan);
  setPlanType(plan);
};

window.fetchLatestVariables = function () {
  const btn = document.getElementById('ct-fetch-btn');
  if (btn) { btn.textContent = 'Fetching…'; btn.disabled = true; }
  clevertap.fetchVariables(() => {
    console.log('[CleverTap] Manual fetch complete');
    navigateTo(currentPage);
    if (btn) { btn.textContent = 'Fetch Latest'; btn.disabled = false; }
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// CLEVERTAP SDK READY
// ─────────────────────────────────────────────────────────────────────────────
function onCTReady() {
  console.log('[CleverTap] SDK ready');

  trackSessionCount();
  const savedPlan = localStorage.getItem('sf_plan_type') || 'free';
  setPlanType(savedPlan);

  defineCleverTapVariables();

  clevertap.setLogLevel(4);
  clevertap.syncVariables(
    () => console.log('[CleverTap] syncVariables ✓'),
    () => console.warn('[CleverTap] syncVariables ✗ — mark profile as Test Profile or clear any draft')
  );

  clevertap.addVariablesChangedCallback(() => {
    console.log('[CleverTap] Variables changed — re-rendering');
    navigateTo(currentPage);
  });

  clevertap.fetchVariables(() => {
    console.log('[CleverTap] fetchVariables ✓ — re-rendering with remote values');
    navigateTo(currentPage);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOT
// ─────────────────────────────────────────────────────────────────────────────
function boot() {
  // Render the page from hash (or default to home) immediately with CT defaults
  const startPage = window.location.hash.replace('#', '') || 'home';
  navigateTo(startPage);

  // Wire up CT SDK when ready
  if (typeof clevertap.defineVariable === 'function') {
    onCTReady();
  } else {
    document.addEventListener('clevertap:ready', onCTReady, { once: true });
  }
}

boot();
