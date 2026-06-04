'use strict';

// ════════════════════════════════════════════════════════════
//  FIREBASE REST HELPERS
// ════════════════════════════════════════════════════════════
const FB_URL = 'https://froexbonuswhale-default-rtdb.firebaseio.com';
async function fbGet(path) {
  try { const r = await fetch(`${FB_URL}${path}.json`); return await r.json(); }
  catch(e) { console.error('fbGet', path, e); return null; }
}
async function fbPost(path, data) {
  try {
    const r = await fetch(`${FB_URL}${path}.json`, {
      method:'POST', body:JSON.stringify(data), headers:{'Content-Type':'application/json'}
    });
    return await r.json();
  } catch(e) { console.error('fbPost', path, e); return null; }
}
async function fbPatch(path, data) {
  try {
    const r = await fetch(`${FB_URL}${path}.json`, {
      method:'PATCH', body:JSON.stringify(data), headers:{'Content-Type':'application/json'}
    });
    return await r.json();
  } catch(e) { console.error('fbPatch', path, e); return null; }
}
async function fbDelete(path) {
  try { await fetch(`${FB_URL}${path}.json`, { method:'DELETE' }); }
  catch(e) { console.error('fbDelete', path, e); }
}
async function loadBonuses() {
  const data = await fbGet('/bonuses');
  if (!data || typeof data !== 'object') return [];
  return Object.entries(data).map(([id,v]) => ({id, ...v}));
}
async function addBonus(data)          { return fbPost('/bonuses', {...data, createdAt:Date.now()}); }
async function updateBonus(id, data)   { return fbPatch(`/bonuses/${id}`, data); }
async function deleteBonus(id)         { return fbDelete(`/bonuses/${id}`); }
async function incrementViews(id, cur) {
  const n = (+cur||0) + 1;
  await fbPatch(`/bonuses/${id}`, {views:n});
  return n;
}
async function loadReviews(bonusId) {
  const data = await fbGet(`/reviews/${bonusId}`);
  if (!data || typeof data !== 'object') return [];
  return Object.entries(data).map(([id,v])=>({id,...v})).sort((a,b)=>+b.createdAt-+a.createdAt);
}
async function postReview(bonusId, review) {
  return fbPost(`/reviews/${bonusId}`, {...review, createdAt:Date.now()});
}

// ════════════════════════════════════════════════════════════
//  STATE
// ════════════════════════════════════════════════════════════
const S = {
  theme:   localStorage.getItem('fbw_theme') || 'dark',
  lang:    localStorage.getItem('fbw_lang')  || 'en',
  section: 'no-deposit',
  bonuses: [],
  reviews: [],
  loading: true,
  selectedId: null,
  menuOpen:   false,
  filter: 'all',
  sort:   'popular',
  search: '',
  sortOpen: false,
  secOpen:  false,
  revName: '', revRating: 0, revHover: 0,
  revSubmitted: false, revLoading: false,
  adminEdit: null, adminMsg: '', adminSaving: false,
};

// ════════════════════════════════════════════════════════════
//  LANGUAGES & I18N
// ════════════════════════════════════════════════════════════
const LANGS = {
  en: { label:'English',  flag:'🇬🇧' },
  de: { label:'Deutsch',  flag:'🇩🇪' },
  es: { label:'Español',  flag:'🇪🇸' },
  it: { label:'Italiano', flag:'🇮🇹' },
  ko: { label:'한국어',   flag:'🇰🇷' },
  ja: { label:'日本語',   flag:'🇯🇵' },
};

const I18N = {
  en: {
    navNoDeposit:'No Deposit Bonus', navDeposit:'Deposit Bonus',
    navContest:'Contest', navAbout:'About',
    secNoDeposit:'Top No Deposit Bonuses', secDeposit:'Top Deposit Bonuses',
    secContest:'Top Trading Contests',
    filterAll:'All', filterActive:'Active', filterInactive:'Inactive',
    sortPopular:'Most Popular', sortRated:'Highest Rated',
    sortNewest:'Newest', sortOldest:'Oldest',
    statBonuses:'Bonuses', statActive:'Active', statReviews:'Reviews',
    viewDetails:'View Details ›', backTo:'Back to bonuses',
    claimNow:'Claim Bonus Now', submitReview:'Submit Review',
    bonusLabel:'BONUS', aboutBonus:'ABOUT THIS BONUS',
    requirements:'REQUIREMENTS', termsTitle:'TERMS & CONDITIONS',
    userReviews:'USER REVIEWS', brokerInfo:'BROKER INFO',
    bonusType:'BONUS TYPE', quickLinks:'QUICK LINKS',
    languages:'Languages', verified:'✓ Verified',
    statusActive:'Active', statusInactive:'Inactive',
    yourName:'Your Name', yourRating:'Your Rating', comment:'Comment',
    searchPlaceholder:'Search brokers, bonuses…',
    noResults:'No bonuses found.', loading:'Loading bonuses…',
    noReviews:'No reviews yet. Be the first!', loadingReviews:'Loading reviews…',
    reviewSubmitted:'✓ Review submitted! Thank you.',
    result:'result', results:'results',
    broker:'Broker:', regulation:'Regulation:', country:'Country:',
    minDep:'Min. Deposit:', statusLabel:'Status:', verifiedLabel:'Verified:',
    yes:'Yes', no:'No', adminPanel:'Admin Panel', allBonuses:'ALL BONUSES',
    addBonus:'ADD NEW BONUS', editBonus:'EDIT BONUS',
    morFrom:'MORE FROM', footerTag:'Your independent guide to the best Forex broker bonuses. Always verified, always up to date.',
    contact:'Questions?',
  },
  de: {
    navNoDeposit:'Kein Einzahlungsbonus', navDeposit:'Einzahlungsbonus',
    navContest:'Wettbewerb', navAbout:'Über uns',
    secNoDeposit:'Top Keine Einzahlungsboni', secDeposit:'Top Einzahlungsboni',
    secContest:'Top Trading-Wettbewerbe',
    filterAll:'Alle', filterActive:'Aktiv', filterInactive:'Inaktiv',
    sortPopular:'Beliebteste', sortRated:'Bestbewertet',
    sortNewest:'Neueste', sortOldest:'Älteste',
    statBonuses:'Boni', statActive:'Aktiv', statReviews:'Bewertungen',
    viewDetails:'Details ›', backTo:'Zurück zu Boni',
    claimNow:'Bonus jetzt beanspruchen', submitReview:'Bewertung einreichen',
    bonusLabel:'BONUS', aboutBonus:'ÜBER DIESEN BONUS',
    requirements:'ANFORDERUNGEN', termsTitle:'GESCHÄFTSBEDINGUNGEN',
    userReviews:'NUTZERBEWERTUNGEN', brokerInfo:'BROKER-INFO',
    bonusType:'BONUSTYP', quickLinks:'SCHNELLLINKS',
    languages:'Sprachen', verified:'✓ Verifiziert',
    statusActive:'Aktiv', statusInactive:'Inaktiv',
    yourName:'Ihr Name', yourRating:'Ihre Bewertung', comment:'Kommentar',
    searchPlaceholder:'Broker, Boni suchen…',
    noResults:'Keine Boni gefunden.', loading:'Boni werden geladen…',
    noReviews:'Noch keine Bewertungen. Seien Sie der Erste!', loadingReviews:'Bewertungen laden…',
    reviewSubmitted:'✓ Bewertung eingereicht! Danke.',
    result:'Ergebnis', results:'Ergebnisse',
    broker:'Broker:', regulation:'Regulierung:', country:'Land:',
    minDep:'Min. Einzahlung:', statusLabel:'Status:', verifiedLabel:'Verifiziert:',
    yes:'Ja', no:'Nein', adminPanel:'Admin-Bereich', allBonuses:'ALLE BONI',
    addBonus:'NEUEN BONUS HINZUFÜGEN', editBonus:'BONUS BEARBEITEN',
    morFrom:'MEHR VON', footerTag:'Ihr unabhängiger Leitfaden für die besten Forex-Broker-Boni. Immer verifiziert, immer aktuell.',
    contact:'Fragen?',
  },
  es: {
    navNoDeposit:'Bono sin depósito', navDeposit:'Bono de depósito',
    navContest:'Concurso', navAbout:'Acerca de',
    secNoDeposit:'Mejores bonos sin depósito', secDeposit:'Mejores bonos de depósito',
    secContest:'Mejores concursos de trading',
    filterAll:'Todos', filterActive:'Activo', filterInactive:'Inactivo',
    sortPopular:'Más popular', sortRated:'Mejor valorado',
    sortNewest:'Más reciente', sortOldest:'Más antiguo',
    statBonuses:'Bonos', statActive:'Activo', statReviews:'Reseñas',
    viewDetails:'Ver detalles ›', backTo:'Volver a bonos',
    claimNow:'Reclamar bono ahora', submitReview:'Enviar reseña',
    bonusLabel:'BONO', aboutBonus:'SOBRE ESTE BONO',
    requirements:'REQUISITOS', termsTitle:'TÉRMINOS Y CONDICIONES',
    userReviews:'RESEÑAS DE USUARIOS', brokerInfo:'INFO DEL BROKER',
    bonusType:'TIPO DE BONO', quickLinks:'ENLACES RÁPIDOS',
    languages:'Idiomas', verified:'✓ Verificado',
    statusActive:'Activo', statusInactive:'Inactivo',
    yourName:'Tu nombre', yourRating:'Tu calificación', comment:'Comentario',
    searchPlaceholder:'Buscar brokers, bonos…',
    noResults:'No se encontraron bonos.', loading:'Cargando bonos…',
    noReviews:'Sin reseñas aún. ¡Sé el primero!', loadingReviews:'Cargando reseñas…',
    reviewSubmitted:'✓ ¡Reseña enviada! Gracias.',
    result:'resultado', results:'resultados',
    broker:'Broker:', regulation:'Regulación:', country:'País:',
    minDep:'Dep. mínimo:', statusLabel:'Estado:', verifiedLabel:'Verificado:',
    yes:'Sí', no:'No', adminPanel:'Panel de Admin', allBonuses:'TODOS LOS BONOS',
    addBonus:'AÑADIR NUEVO BONO', editBonus:'EDITAR BONO',
    morFrom:'MÁS DE', footerTag:'Tu guía independiente para los mejores bonos de brokers Forex. Siempre verificados, siempre actualizados.',
    contact:'¿Preguntas?',
  },
  it: {
    navNoDeposit:'Bonus senza deposito', navDeposit:'Bonus deposito',
    navContest:'Concorso', navAbout:'Chi siamo',
    secNoDeposit:'Migliori bonus senza deposito', secDeposit:'Migliori bonus deposito',
    secContest:'Migliori concorsi trading',
    filterAll:'Tutti', filterActive:'Attivo', filterInactive:'Inattivo',
    sortPopular:'Più popolari', sortRated:'Meglio valutati',
    sortNewest:'Più recenti', sortOldest:'Più vecchi',
    statBonuses:'Bonus', statActive:'Attivo', statReviews:'Recensioni',
    viewDetails:'Vedi dettagli ›', backTo:'Torna ai bonus',
    claimNow:'Richiedi bonus ora', submitReview:'Invia recensione',
    bonusLabel:'BONUS', aboutBonus:'INFORMAZIONI BONUS',
    requirements:'REQUISITI', termsTitle:'TERMINI E CONDIZIONI',
    userReviews:'RECENSIONI UTENTI', brokerInfo:'INFO BROKER',
    bonusType:'TIPO DI BONUS', quickLinks:'LINK RAPIDI',
    languages:'Lingue', verified:'✓ Verificato',
    statusActive:'Attivo', statusInactive:'Inattivo',
    yourName:'Il tuo nome', yourRating:'La tua valutazione', comment:'Commento',
    searchPlaceholder:'Cerca broker, bonus…',
    noResults:'Nessun bonus trovato.', loading:'Caricamento bonus…',
    noReviews:'Nessuna recensione. Sii il primo!', loadingReviews:'Caricamento recensioni…',
    reviewSubmitted:'✓ Recensione inviata! Grazie.',
    result:'risultato', results:'risultati',
    broker:'Broker:', regulation:'Regolazione:', country:'Paese:',
    minDep:'Dep. minimo:', statusLabel:'Stato:', verifiedLabel:'Verificato:',
    yes:'Sì', no:'No', adminPanel:'Pannello Admin', allBonuses:'TUTTI I BONUS',
    addBonus:'AGGIUNGI BONUS', editBonus:'MODIFICA BONUS',
    morFrom:'ALTRO DA', footerTag:'La tua guida indipendente ai migliori bonus Forex. Sempre verificati, sempre aggiornati.',
    contact:'Domande?',
  },
  ko: {
    navNoDeposit:'무입금 보너스', navDeposit:'입금 보너스',
    navContest:'콘테스트', navAbout:'소개',
    secNoDeposit:'인기 무입금 보너스', secDeposit:'인기 입금 보너스',
    secContest:'인기 트레이딩 콘테스트',
    filterAll:'전체', filterActive:'활성', filterInactive:'비활성',
    sortPopular:'인기순', sortRated:'평점 높은순',
    sortNewest:'최신순', sortOldest:'오래된순',
    statBonuses:'보너스', statActive:'활성', statReviews:'리뷰',
    viewDetails:'자세히 보기 ›', backTo:'보너스 목록으로',
    claimNow:'지금 보너스 받기', submitReview:'리뷰 제출',
    bonusLabel:'보너스', aboutBonus:'보너스 정보',
    requirements:'요건', termsTitle:'이용약관',
    userReviews:'사용자 리뷰', brokerInfo:'브로커 정보',
    bonusType:'보너스 유형', quickLinks:'빠른 링크',
    languages:'언어', verified:'✓ 검증됨',
    statusActive:'활성', statusInactive:'비활성',
    yourName:'이름', yourRating:'평점', comment:'댓글',
    searchPlaceholder:'브로커, 보너스 검색…',
    noResults:'보너스를 찾을 수 없습니다.', loading:'보너스 로딩 중…',
    noReviews:'아직 리뷰가 없습니다. 첫 번째가 되세요!', loadingReviews:'리뷰 로딩 중…',
    reviewSubmitted:'✓ 리뷰가 제출되었습니다! 감사합니다.',
    result:'개 결과', results:'개 결과',
    broker:'브로커:', regulation:'규제:', country:'국가:',
    minDep:'최소 입금:', statusLabel:'상태:', verifiedLabel:'검증:',
    yes:'예', no:'아니오', adminPanel:'관리자 패널', allBonuses:'전체 보너스',
    addBonus:'새 보너스 추가', editBonus:'보너스 편집',
    morFrom:'더 보기', footerTag:'최고의 Forex 브로커 보너스를 위한 독립 가이드. 항상 검증되고 최신 상태.',
    contact:'문의사항?',
  },
  ja: {
    navNoDeposit:'入金不要ボーナス', navDeposit:'入金ボーナス',
    navContest:'コンテスト', navAbout:'概要',
    secNoDeposit:'人気の入金不要ボーナス', secDeposit:'人気の入金ボーナス',
    secContest:'人気のトレーディングコンテスト',
    filterAll:'すべて', filterActive:'アクティブ', filterInactive:'非アクティブ',
    sortPopular:'人気順', sortRated:'評価の高い順',
    sortNewest:'新着順', sortOldest:'古い順',
    statBonuses:'ボーナス', statActive:'アクティブ', statReviews:'レビュー',
    viewDetails:'詳細を見る ›', backTo:'ボーナス一覧に戻る',
    claimNow:'ボーナスを受け取る', submitReview:'レビューを送信',
    bonusLabel:'ボーナス', aboutBonus:'ボーナス情報',
    requirements:'要件', termsTitle:'利用規約',
    userReviews:'ユーザーレビュー', brokerInfo:'ブローカー情報',
    bonusType:'ボーナスタイプ', quickLinks:'クイックリンク',
    languages:'言語', verified:'✓ 認証済み',
    statusActive:'アクティブ', statusInactive:'非アクティブ',
    yourName:'お名前', yourRating:'評価', comment:'コメント',
    searchPlaceholder:'ブローカー、ボーナスを検索…',
    noResults:'ボーナスが見つかりません。', loading:'ボーナスを読み込み中…',
    noReviews:'まだレビューはありません。最初のレビューをどうぞ!', loadingReviews:'レビューを読み込み中…',
    reviewSubmitted:'✓ レビューを送信しました！ありがとうございます。',
    result:'件', results:'件',
    broker:'ブローカー:', regulation:'規制:', country:'国:',
    minDep:'最低入金:', statusLabel:'ステータス:', verifiedLabel:'認証:',
    yes:'はい', no:'いいえ', adminPanel:'管理者パネル', allBonuses:'全ボーナス',
    addBonus:'ボーナスを追加', editBonus:'ボーナスを編集',
    morFrom:'他のボーナス', footerTag:'最高のForexブローカーボーナスに関する独立したガイド。常に検証済み、常に最新。',
    contact:'お問い合わせ',
  },
};

function t(key) { return (I18N[S.lang] && I18N[S.lang][key]) || I18N.en[key] || key; }

// ── Dynamic translation cache (MyMemory API for Firebase content) ──────────
let TR_CACHE = {};
try { TR_CACHE = JSON.parse(localStorage.getItem('fbw_tr') || '{}'); } catch(e) {}

async function tr(text, lang) {
  if (!text || !lang || lang === 'en') return text;
  const key = lang + '|' + text;
  if (TR_CACHE[key]) return TR_CACHE[key];
  try {
    const url = 'https://api.mymemory.translated.net/get?q=' +
      encodeURIComponent(String(text).slice(0, 499)) + '&langpair=en|' + lang;
    const r = await fetch(url);
    const d = await r.json();
    const result = (d.responseStatus === 200 && d.responseData?.translatedText) ? d.responseData.translatedText : text;
    TR_CACHE[key] = result;
    try { localStorage.setItem('fbw_tr', JSON.stringify(TR_CACHE)); } catch(e) {}
    return result;
  } catch(e) { return text; }
}

// Translate key fields of a bonus for the detail view
async function translateDetailFields(b) {
  if (S.lang === 'en') return;
  const lang = S.lang;
  const ids = ['tr-title','tr-desc'];
  const tasks = [];
  if (b.title) tasks.push(tr(b.title, lang).then(v => { const el = document.getElementById('tr-title'); if(el && v !== b.title) el.textContent = v; }));
  if (b.description) tasks.push(tr(b.description, lang).then(v => { const el = document.getElementById('tr-desc'); if(el && v !== b.description) el.textContent = v; }));
  if (b.terms) tasks.push(tr(b.terms, lang).then(v => { const el = document.getElementById('tr-terms'); if(el && v !== b.terms) el.textContent = v; }));
  if (b.howToClaimSteps?.length) {
    b.howToClaimSteps.forEach((step, i) => {
      tasks.push(tr(step, lang).then(v => {
        const el = document.getElementById('tr-step-' + i);
        if (el && v !== step) el.textContent = v;
      }));
    });
  }
  await Promise.allSettled(tasks);
}

// Translate card titles (short texts, used in list view)
async function translateCardTitles() {
  if (S.lang === 'en') return;
  const lang = S.lang;
  const elements = document.querySelectorAll('[data-tr-card]');
  const tasks = Array.from(elements).map(async el => {
    const original = el.getAttribute('data-tr-card');
    if (!original) return;
    const translated = await tr(original, lang);
    if (translated !== original) el.textContent = translated;
  });
  await Promise.allSettled(tasks);
}

// ════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════
function esc(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function fmt(n) {
  n = +n || 0;
  if (n >= 1e6) return (n/1e6).toFixed(1)+'M';
  if (n >= 1e3) return (n/1e3).toFixed(1)+'K';
  return n.toLocaleString();
}
function amt(amount) {
  const s = String(amount ?? '0');
  return s.startsWith('$') ? s : '$' + s;
}
// Treat undefined/null/empty status as 'active' so old data without status shows correctly
function statusLC(b) { return ((b.status || 'active')).toLowerCase(); }

function starsSVG(filled) {
  return `<svg width="13" height="13" viewBox="0 0 24 24" fill="${filled?'#F59E0B':'none'}" stroke="#F59E0B" stroke-width="2" style="display:inline-block;vertical-align:middle"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
}
function starsRow(rating) {
  const r = Math.round(Math.max(0,Math.min(5,+rating||0)));
  return [1,2,3,4,5].map(i=>starsSVG(i<=r)).join('');
}

// چاککردنی کێشەی ئەستێرەکان (type="button" زیاد کرا)
function interactiveStars(cur, hov) {
  return [1,2,3,4,5].map(i=>`
    <button type="button" class="star-btn" data-action="rev-star" data-val="${i}"
      onmouseenter="hoverStar(${i})" onmouseleave="hoverStar(0)">
      <svg width="28" height="28" viewBox="0 0 24 24"
        fill="${(hov||cur)>=i?'#F59E0B':'none'}" stroke="#F59E0B" stroke-width="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    </button>`).join('');
}

function typeMeta(tp) {
  if (tp === 'deposit') return { label: t('navDeposit'), icon:'💰', desc:'Get a bonus when you make your first deposit.' };
  if (tp === 'contest') return { label: t('navContest'), icon:'🏆', desc:'Compete with other traders for prizes.' };
  return { label: t('navNoDeposit'), icon:'🎁', desc:'No initial deposit needed. Start trading with free funds.' };
}
function getSortLabels() {
  return { popular: t('sortPopular'), rating: t('sortRated'), newest: t('sortNewest'), oldest: t('sortOldest') };
}
function sortList(list) {
  return [...list].sort((a, b) => {
    if (S.sort === 'popular') return (+b.views||0)  - (+a.views||0);
    if (S.sort === 'rating')  return (+b.rating||0) - (+a.rating||0);
    if (S.sort === 'oldest')  return (+a.createdAt||0) - (+b.createdAt||0);
    return (+b.createdAt||0) - (+a.createdAt||0);
  });
}
function filteredBonuses() {
  return sortList(S.bonuses
    .filter(b => b.type === S.section)
    .filter(b => S.filter === 'all' || statusLC(b) === S.filter)
    .filter(b => !S.search || (b.brokerName||'').toLowerCase().includes(S.search.toLowerCase()))
  );
}
const SEC_KEY_MAP = { 'no-deposit':'secNoDeposit', deposit:'secDeposit', contest:'secContest' };
function secLabel(sec) { return t(SEC_KEY_MAP[sec]) || sec; }
const chevSVG = (open) => `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="transform:rotate(${open?180:0}deg);transition:transform .2s;flex-shrink:0"><polyline points="6 9 12 15 18 9"/></svg>`;

// ── Global event helpers ──────────────────────────────────────────────────
function hoverStar(n) {
  S.revHover = n;
  const el = document.getElementById('rev-stars');
  if (el) el.innerHTML = interactiveStars(S.revRating, S.revHover);
}
function onSearch(val) {
  S.search = val;
  const filtered = filteredBonuses();
  const cards = document.querySelector('.cards-list');
  const count = document.querySelector('.results-count');
  if (cards) { cards.innerHTML = filtered.map(renderCard).join(''); translateCardTitles(); }
  if (count) count.textContent = `${filtered.length} ${filtered.length!==1?t('results'):t('result')}`;
}

// ════════════════════════════════════════════════════════════
//  NAVIGATION
// ════════════════════════════════════════════════════════════
function navigate(sec) {
  S.section=sec; S.selectedId=null; S.menuOpen=false;
  S.filter='all'; S.search=''; S.sortOpen=false; S.secOpen=false;
  const map={'no-deposit':'',deposit:'/deposit',contest:'/contest',about:'/about',admin:'/admin'};
  window.location.hash=map[sec]||'';
  render();
}
function viewDetails(id) {
  S.selectedId=id; S.menuOpen=false;
  S.revName=''; S.revRating=0; S.revHover=0;
  S.revSubmitted=false; S.reviews=[]; S.revLoading=false;
  window.location.hash='/bonus/'+id;
}
function copyLink(id) {
  const url = window.location.origin + window.location.pathname + '#/bonus/' + id;
  navigator.clipboard.writeText(url).then(()=>{ alert('Link copied to clipboard!'); });
}

// ════════════════════════════════════════════════════════════
//  RENDERING COMPONENTS
// ════════════════════════════════════════════════════════════
function renderHeader() {
  const isD = S.theme==='dark';
  const thIco = isD
    ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
    : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
  
  return `
    <header class="header">
      <div class="h-inner">
        <div class="logo" onclick="navigate('no-deposit')">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M2 12C2 12 5 15 12 15C19 15 22 12 22 12C22 12 19 9 12 9C5 9 2 12 2 12ZM12 13.5C11.17 13.5 10.5 12.83 10.5 12C10.5 11.17 11.17 10.5 12 10.5C12.83 10.5 13.5 11.17 13.5 12C13.5 12.83 12.83 13.5 12 13.5Z"/></svg>
          ForexBonusWhale
        </div>
        <div class="h-acts">
          <button class="icon-btn" data-action="toggle-theme" title="Toggle Theme">${thIco}</button>
          <div class="lang-sel" data-action="toggle-lang">
            <span class="lang-flag">${LANGS[S.lang].flag}</span>
            <div class="lang-dropdown ${S.langOpen?'show':''}">
              ${Object.entries(LANGS).map(([k,v])=>`
                <div class="lang-opt ${S.lang===k?'active':''}" data-action="set-lang" data-val="${k}">
                  ${v.flag} ${v.label}
                </div>
              `).join('')}
            </div>
          </div>
          <button class="icon-btn m-menu" data-action="toggle-menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              ${S.menuOpen ? `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>` : `<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>`}
            </svg>
          </button>
        </div>
      </div>
      <div class="nav-drawer ${S.menuOpen?'open':''}">
        <nav class="nav-links">
          ${['no-deposit','deposit','contest'].map(k=>`
            <button class="nav-link ${S.section===k?'active':''}" data-action="nav" data-val="${k}">
              <span style="margin-right:8px">${typeMeta(k).icon}</span> ${t('nav'+k.split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(''))}
            </button>
          `).join('')}
          <button class="nav-link ${S.section==='about'?'active':''}" data-action="nav" data-val="about">
             <span style="margin-right:8px">ℹ️</span> ${t('navAbout')}
          </button>
        </nav>
      </div>
    </header>
  `;
}

// چاککردنی کێشەی لۆگۆ لە لیستی بۆنوسەکان
function renderCard(b) {
  const initial = esc((b.brokerName||'?')[0].toUpperCase());
  const tm = typeMeta(b.type);
  const isVerified = b.isVerified;
  const status = statusLC(b);

  const avatarContent = b.brokerLogo 
    ? `<img src="${esc(b.brokerLogo)}" alt="${esc(b.brokerName)}" style="width:100%;height:100%;object-fit:contain;border-radius:inherit;">`
    : `<div class="avatar-letter">${initial}</div>`;

  return `
    <article class="card" onclick="viewDetails('${b.id}')">
      <div class="card-header">
        <div class="card-avatar">
          ${avatarContent}
        </div>
        <div class="card-title-wrap">
          <div class="card-brok">${esc(b.brokerName)}</div>
          <div class="card-tags">
            <span class="tag tag-type">${tm.icon} ${tm.label}</span>
            <span class="tag tag-stat ${status==='active'?'tag-act':'tag-inact'}">
              <span class="dot"></span>${status==='active'?t('statusActive'):t('statusInactive')}
            </span>
          </div>
        </div>
      </div>
      <h3 class="card-title" data-tr-card="${esc(b.title)}">${esc(b.title)}</h3>
      <div class="card-amt-wrap">
        <div class="amt-lbl">${t('bonusLabel')}</div>
        <div class="amt-val">${amt(b.amount)}</div>
      </div>
      <div class="card-meta">
        <div class="meta-rate">
          <div class="stars">${starsRow(b.rating)}</div>
          <span style="font-weight:600;color:var(--text)">${Number(b.rating).toFixed(1)}</span>
          <span style="color:var(--text-muted)">(${b.reviews} ${t('statReviews').toLowerCase()})</span>
        </div>
        <div class="meta-views">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          ${fmt(b.views)}
        </div>
      </div>
      <button class="btn btn-primary" style="width:100%">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:8px"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        ${t('claimNow')}
      </button>
    </article>
  `;
}

function renderList() {
  const filtered = filteredBonuses();
  const tm = typeMeta(S.section);
  const sorts = getSortLabels();

  return `
    <div class="container fade-in">
      <div class="hero" style="text-align:center;margin-bottom:32px">
        <h1 class="hero-title">${tm.icon} ${secLabel(S.section)}</h1>
        <p class="hero-desc">${tm.desc}</p>
      </div>
      <div class="controls">
        <div class="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" class="search-input" placeholder="${t('searchPlaceholder')}" value="${esc(S.search)}" oninput="onSearch(this.value)">
        </div>
        <div class="filters">
          <div class="f-group">
            <button class="f-btn ${S.filter==='all'?'active':''}" data-action="set-filter" data-val="all">${t('filterAll')}</button>
            <button class="f-btn ${S.filter==='active'?'active':''}" data-action="set-filter" data-val="active">${t('filterActive')}</button>
            <button class="f-btn ${S.filter==='inactive'?'active':''}" data-action="set-filter" data-val="inactive">${t('filterInactive')}</button>
          </div>
          <div style="position:relative">
            <button class="f-btn" data-action="toggle-sort" style="min-width:140px;justify-content:space-between">
              <span style="display:flex;align-items:center;gap:6px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg> ${sorts[S.sort]}</span>
              ${chevSVG(S.sortOpen)}
            </button>
            <div class="lang-dropdown ${S.sortOpen?'show':''}" style="right:0;left:auto;min-width:160px;margin-top:8px">
              ${Object.entries(sorts).map(([k,v])=>`<div class="lang-opt ${S.sort===k?'active':''}" data-action="set-sort" data-val="${k}">${v}</div>`).join('')}
            </div>
          </div>
        </div>
      </div>
      <div style="margin-bottom:24px;font-size:14px;color:var(--text-muted);display:flex;justify-content:space-between;align-items:center">
        <span class="results-count">${filtered.length} ${filtered.length!==1?t('results'):t('result')}</span>
      </div>
      ${filtered.length ? `<div class="cards-list">${filtered.map(renderCard).join('')}</div>` : `<div class="empty-state"><div style="font-size:48px;margin-bottom:16px">🔍</div><h3 style="font-size:18px;color:var(--text);margin-bottom:8px">${t('noResults')}</h3><p style="color:var(--text-muted)">Try adjusting your search or filters.</p></div>`}
    </div>
  `;
}

// چاککردنی کێشەی لۆگۆ لە لاپەڕەی ناوەوەی بۆنوسەکە
function renderDetails() {
  const b = S.bonuses.find(x => x.id === S.selectedId);
  if (!b) return `<div class="container fade-in"><div class="empty-state">Bonus not found.</div></div>`;

  const initial = esc((b.brokerName||'?')[0].toUpperCase());
  const tm = typeMeta(b.type);

  const avatarContent = b.brokerLogo 
    ? `<img src="${esc(b.brokerLogo)}" alt="${esc(b.brokerName)}" style="width:100%;height:100%;object-fit:contain;border-radius:inherit;">`
    : `<div class="avatar-letter">${initial}</div>`;

  let html = `<div class="container fade-in" style="max-width:800px;padding-top:24px;padding-bottom:64px">`;

  html += `
    <div class="det-top">
      <button class="back-btn" onclick="navigate('${b.type}')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        ${t('backTo')}
      </button>
      <button class="share-btn" onclick="copyLink('${b.id}')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        Copy Link
      </button>
    </div>

    <div class="det-head">
      <div class="det-avatar">
        ${avatarContent}
      </div>
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;flex-wrap:wrap">
          <h2 style="font-size:20px;font-weight:700;color:var(--text);margin:0">${esc(b.brokerName)}</h2>
          <span class="tag tag-type">${tm.icon} ${tm.label}</span>
          <span class="tag tag-stat ${statusLC(b)==='active'?'tag-act':'tag-inact'}"><span class="dot"></span>${statusLC(b)==='active'?t('statusActive'):t('statusInactive')}</span>
        </div>
        <h1 class="det-title" id="tr-title">${esc(b.title)}</h1>
      </div>
    </div>

    <div class="det-amt">
      <div class="amt-lbl">${t('bonusLabel')}</div>
      <div class="amt-val" style="font-size:48px">${amt(b.amount)}</div>
    </div>

    <div class="det-stats">
      <div class="det-stat">
        <div class="stars">${starsRow(b.rating)}</div>
        <span style="font-weight:700;color:var(--text);font-size:16px">${Number(b.rating).toFixed(1)}</span>
        <span style="color:var(--text-muted)">(${b.reviews} ${t('statReviews').toLowerCase()})</span>
      </div>
      <div class="det-stat">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        ${fmt(b.views)}
      </div>
    </div>

    <a href="${esc(b.claimUrl)}" target="_blank" rel="nofollow noopener" class="btn btn-primary" style="width:100%;padding:16px;font-size:18px;margin-bottom:32px;box-shadow:0 8px 16px rgba(59,130,246,0.2)">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:8px"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      ${t('claimNow')}
    </a>
  `;

  html += `<div class="det-grid">`;
  html += `<div class="det-main">`;

  if (b.description) {
    html += `
      <section class="sec-box">
        <h3 class="sec-title">${t('aboutBonus')}</h3>
        <p style="color:var(--text);line-height:1.7;font-size:15px;white-space:pre-wrap" id="tr-desc">${esc(b.description)}</p>
      </section>
    `;
  }

  if (b.howToClaimSteps?.length) {
    html += `
      <section class="sec-box">
        <h3 class="sec-title">${t('requirements')}</h3>
        <div class="steps">
          ${b.howToClaimSteps.map((s,i)=>`
            <div class="step">
              <div class="step-num">${i+1}</div>
              <div class="step-txt" id="tr-step-${i}">${esc(s)}</div>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  }

  if (b.terms) {
    html += `
      <section class="sec-box">
        <h3 class="sec-title">${t('termsTitle')}</h3>
        <p style="color:var(--text-muted);line-height:1.6;font-size:14px;white-space:pre-wrap" id="tr-terms">${esc(b.terms)}</p>
      </section>
    `;
  }

  // Reviews section
  html += `
    <section class="sec-box" id="reviews-section">
      <h3 class="sec-title">${t('userReviews')}</h3>
      ${S.revSubmitted ? `
        <div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);color:#10B981;padding:16px;border-radius:12px;margin-bottom:24px;text-align:center;font-weight:500">
          ${t('reviewSubmitted')}
        </div>
      ` : `
        <form onsubmit="submitReview(event)" class="review-form">
          <div style="margin-bottom:16px">
            <label style="display:block;margin-bottom:8px;font-size:14px;font-weight:600;color:var(--text-muted)">${t('yourRating')}</label>
            <div id="rev-stars" style="display:flex;gap:4px">
              ${interactiveStars(S.revRating, S.revHover)}
            </div>
          </div>
          <div style="margin-bottom:16px">
             <label style="display:block;margin-bottom:8px;font-size:14px;font-weight:600;color:var(--text-muted)">${t('yourName')}</label>
             <input type="text" id="rev-name" class="search-input" style="width:100%" required value="${esc(S.revName)}" oninput="S.revName=this.value">
          </div>
          <div style="margin-bottom:16px">
             <label style="display:block;margin-bottom:8px;font-size:14px;font-weight:600;color:var(--text-muted)">${t('comment')}</label>
             <textarea id="rev-comment" class="search-input" style="width:100%;min-height:100px;resize:vertical" required></textarea>
          </div>
          <button type="submit" class="btn btn-primary" ${S.revLoading?'disabled':''} style="width:100%">
            ${S.revLoading ? '...' : t('submitReview')}
          </button>
        </form>
      `}
      <div class="reviews-list">
        ${S.revLoading ? `<div style="text-align:center;padding:32px;color:var(--text-muted)">${t('loadingReviews')}</div>` : 
          (S.reviews.length===0 ? `<div style="text-align:center;padding:32px;color:var(--text-muted);background:var(--bg);border-radius:12px;margin-top:24px">${t('noReviews')}</div>` : 
            S.reviews.map(r=>`
              <div class="review-item">
                <div style="display:flex;justify-content:space-between;margin-bottom:8px;align-items:flex-start">
                  <div>
                    <div style="font-weight:600;color:var(--text);margin-bottom:4px">${esc(r.name)}</div>
                    <div class="stars" style="transform:scale(0.8);transform-origin:left center">${starsRow(r.rating)}</div>
                  </div>
                  <div style="font-size:12px;color:var(--text-muted)">${new Date(r.createdAt).toLocaleDateString()}</div>
                </div>
                <div style="color:var(--text);font-size:14px;line-height:1.6">${esc(r.comment)}</div>
              </div>
            `).join('')
          )
        }
      </div>
    </section>
  `;

  html += `</div>`;
  html += `<div class="det-side">`;

  html += `
    <div class="sec-box side-box">
      <h3 class="sec-title">${t('brokerInfo')}</h3>
      <ul class="meta-list">
        <li><span>${t('broker')}</span> <strong>${esc(b.brokerName)}</strong></li>
        <li><span>${t('verifiedLabel')}</span> <strong>${b.isVerified ? `<span style="color:#10B981">${t('yes')}</span>` : `<span style="color:var(--text-muted)">${t('no')}</span>`}</strong></li>
        <li><span>${t('statusLabel')}</span> <strong>${statusLC(b)==='active' ? `<span style="color:#10B981">${t('statusActive')}</span>` : `<span style="color:var(--text-muted)">${t('statusInactive')}</span>`}</strong></li>
        ${b.regulation ? `<li><span>${t('regulation')}</span> <strong>${esc(b.regulation)}</strong></li>` : ''}
        ${b.country ? `<li><span>${t('country')}</span> <strong>${esc(b.country)}</strong></li>` : ''}
        ${b.minDeposit ? `<li><span>${t('minDep')}</span> <strong>${esc(b.minDeposit)}</strong></li>` : ''}
      </ul>
    </div>
  `;

  html += `</div></div></div>`;
  return html;
}

function renderAbout() {
  return `
    <div class="container fade-in" style="max-width:800px;text-align:center;padding:64px 24px">
      <div style="width:80px;height:80px;background:var(--primary);color:white;border-radius:24px;display:flex;align-items:center;justify-content:center;margin:0 auto 32px;font-size:40px;box-shadow:0 12px 24px rgba(59,130,246,0.3)">🐋</div>
      <h1 style="font-size:36px;font-weight:800;color:var(--text);margin-bottom:24px">ForexBonusWhale</h1>
      <p style="font-size:18px;color:var(--text-muted);line-height:1.8;margin-bottom:48px;max-width:600px;margin-left:auto;margin-right:auto">
        Your independent guide to the best Forex broker bonuses. We track, verify, and review the top no-deposit bonuses, deposit matches, and trading contests so you can trade with an edge.
      </p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:24px;text-align:left">
        <div class="sec-box" style="text-align:center;padding:32px">
          <div style="font-size:32px;margin-bottom:16px">🎯</div>
          <h3 style="font-size:18px;color:var(--text);margin-bottom:8px">Curated</h3>
          <p style="color:var(--text-muted);font-size:14px">Only the best offers from reputable brokers.</p>
        </div>
        <div class="sec-box" style="text-align:center;padding:32px">
          <div style="font-size:32px;margin-bottom:16px">🛡️</div>
          <h3 style="font-size:18px;color:var(--text);margin-bottom:8px">Verified</h3>
          <p style="color:var(--text-muted);font-size:14px">We check terms and conditions to ensure fairness.</p>
        </div>
        <div class="sec-box" style="text-align:center;padding:32px">
          <div style="font-size:32px;margin-bottom:16px">⚡</div>
          <h3 style="font-size:18px;color:var(--text);margin-bottom:8px">Up to Date</h3>
          <p style="color:var(--text-muted);font-size:14px">Constantly updated with the latest promos.</p>
        </div>
      </div>
    </div>
  `;
}

function renderFooter() {
  return `
    <footer class="footer">
      <div class="f-inner">
        <div class="f-brand">
          <div class="logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M2 12C2 12 5 15 12 15C19 15 22 12 22 12C22 12 19 9 12 9C5 9 2 12 2 12ZM12 13.5C11.17 13.5 10.5 12.83 10.5 12C10.5 11.17 11.17 10.5 12 10.5C12.83 10.5 13.5 11.17 13.5 12C13.5 12.83 12.83 13.5 12 13.5Z"/></svg>
            ForexBonusWhale
          </div>
          <p style="color:var(--text-muted);font-size:14px;line-height:1.6">${t('footerTag')}</p>
        </div>
        <div class="f-links">
          <h4 style="color:var(--text);font-weight:600;margin-bottom:16px">${t('quickLinks')}</h4>
          <a href="#/" onclick="navigate('no-deposit')">${t('navNoDeposit')}</a>
          <a href="#/deposit" onclick="navigate('deposit')">${t('navDeposit')}</a>
          <a href="#/contest" onclick="navigate('contest')">${t('navContest')}</a>
          <a href="#/about" onclick="navigate('about')">${t('navAbout')}</a>
        </div>
        <div class="f-links">
           <h4 style="color:var(--text);font-weight:600;margin-bottom:16px">${t('contact')}</h4>
           <p style="color:var(--text-muted);font-size:14px">admin@forexbonuswhale.com</p>
        </div>
      </div>
      <div class="f-bottom">
        &copy; ${new Date().getFullYear()} ForexBonusWhale. All rights reserved.
      </div>
    </footer>
  `;
}

// ════════════════════════════════════════════════════════════
//  MAIN RENDER & EVENTS
// ════════════════════════════════════════════════════════════
function render() {
  const app = document.getElementById('app');
  if (!app) return;
  if (S.loading) {
    app.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:var(--primary)">${t('loading')}</div>`;
    return;
  }
  let main = '';
  if      (S.selectedId)       main = renderDetails();
  else if (S.section==='about')main = renderAbout();
  else                         main = renderList();

  app.innerHTML = renderHeader() + `<main style="min-height:calc(100vh - 70px - 300px)">${main}</main>` + renderFooter();

  if(S.selectedId) {
    translateDetailFields(S.bonuses.find(x=>x.id===S.selectedId));
  } else if(['no-deposit','deposit','contest'].includes(S.section)) {
    translateCardTitles();
  }
}

async function fetchAndShowReviews(id) {
  S.revLoading=true; render();
  S.reviews = await loadReviews(id);
  S.revLoading=false; render();
}

window.submitReview = async function(e) {
  e.preventDefault();
  if(!S.selectedId) return;
  if(!S.revRating) { alert('Please select a rating!'); return; }
  const commentEl = document.getElementById('rev-comment');
  if(!commentEl || !commentEl.value.trim()) return;

  S.revLoading=true; render();
  const rev = {
    name: S.revName.trim() || 'Anonymous',
    rating: S.revRating,
    comment: commentEl.value.trim()
  };
  await postReview(S.selectedId, rev);
  
  // Update avg rating
  const b = S.bonuses.find(x=>x.id===S.selectedId);
  if (b) {
    const curR = +b.rating||0;
    const curC = +b.reviews||0;
    b.rating = ((curR * curC) + rev.rating) / (curC + 1);
    b.reviews = curC + 1;
    await updateBonus(S.selectedId, { rating: b.rating, reviews: b.reviews });
  }

  S.revSubmitted=true;
  S.reviews = await loadReviews(S.selectedId);
  S.revLoading=false;
  render();
};

document.body.addEventListener('click', e => {
  const action = e.target.closest('[data-action]');
  if (!action) {
    if(S.langOpen) { S.langOpen=false; render(); }
    if(S.sortOpen) { S.sortOpen=false; render(); }
    if(S.secOpen)  { S.secOpen=false; render(); }
    return;
  }
  const act = action.dataset.action;
  const val = action.dataset.val;

  if (act==='toggle-theme') {
    S.theme = S.theme==='dark'?'light':'dark';
    document.documentElement.className = S.theme;
    localStorage.setItem('fbw_theme', S.theme);
    render();
  }
  else if (act==='toggle-lang') { S.langOpen=!S.langOpen; render(); }
  else if (act==='set-lang') {
    S.lang=val; localStorage.setItem('fbw_lang',val);
    S.langOpen=false; document.documentElement.lang=val;
    render();
  }
  else if (act==='toggle-menu') { S.menuOpen=!S.menuOpen; render(); }
  else if (act==='nav') { navigate(val); }
  else if (act==='set-filter') { S.filter=val; render(); }
  else if (act==='toggle-sort') { S.sortOpen=!S.sortOpen; e.stopPropagation(); render(); }
  else if (act==='set-sort') { S.sort=val; S.sortOpen=false; render(); }
  else if (act==='toggle-sec') { S.secOpen=!S.secOpen; e.stopPropagation(); render(); }
  else if (act==='rev-star') {
    S.revRating = +val;
    hoverStar(0);
  }
});

// ════════════════════════════════════════════════════════════
//  HASH ROUTING
// ════════════════════════════════════════════════════════════
function parseHash() {
  const h = window.location.hash.replace('#','');
  if      (h.startsWith('/bonus/')) { S.selectedId=h.replace('/bonus/',''); }
  else if (h==='/deposit')          { S.section='deposit';    S.selectedId=null; }
  else if (h==='/contest')          { S.section='contest';    S.selectedId=null; }
  else if (h==='/about')            { S.section='about';      S.selectedId=null; }
  else if (h==='/admin')            { S.section='admin';      S.selectedId=null; }
  else                              { S.section='no-deposit'; S.selectedId=null; }
}

window.addEventListener('hashchange', ()=>{
  parseHash();
  S.menuOpen=false;
  render();
  if(S.selectedId){
    fetchAndShowReviews(S.selectedId);
    const bonus=S.bonuses.find(b=>b.id===S.selectedId);
    if(bonus) incrementViews(S.selectedId,+bonus.views||0).then(v=>{if(bonus)bonus.views=v;});
  }
});

// ════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════
async function init() {
  parseHash();
  S.bonuses = await loadBonuses();
  S.loading = false;
  render();
  if(S.selectedId){
    fetchAndShowReviews(S.selectedId);
    const bonus=S.bonuses.find(b=>b.id===S.selectedId);
    if(bonus) incrementViews(S.selectedId,+bonus.views||0).then(v=>{if(bonus)bonus.views=v;});
  }
}

init();
