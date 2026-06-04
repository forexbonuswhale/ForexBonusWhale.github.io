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
  S.revName=''; S.revRating=0; S.re
