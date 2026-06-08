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
async function fbPut(path, data) {
  try {
    const r = await fetch(`${FB_URL}${path}.json`, {
      method:'PUT', body:JSON.stringify(data), headers:{'Content-Type':'application/json'}
    });
    return await r.json();
  } catch(e) { console.error('fbPut', path, e); return null; }
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
async function incrementClaimCount(id, cur) {
  const n = (+cur||0) + 1;
  await fbPatch(`/bonuses/${id}`, {claimCount: n});
  return n;
}

// ── Seed test bonus for expiry verification ─────────────────
async function seedTestExpiryBonus() {
  try {
    const existing = await fbGet('/bonuses/test-expiry-9sep2026');
    if (existing && existing.brokerName) return;
    await fbPut('/bonuses/test-expiry-9sep2026', {
      brokerId: 'test-expiry-broker',
      brokerName: 'TestBroker',
      brokerImageUrl: '',
      title: 'Expiry Test — Active until 2026.9.9',
      amount: '50',
      type: 'deposit',
      status: 'active',
      verified: false,
      regulation: 'Test',
      country: 'Global',
      minDeposit: '$0',
      rating: 4.5,
      reviews: 0,
      views: 0,
      claimUrl: '',
      imageUrl: '',
      description: 'Test bonus for the auto-expiry feature. This bonus is set to expire on 2026.9.9. After that date passes, the status badge automatically changes from Active to Inactive — no manual update needed. You can edit the expiry date in the admin panel to test the behaviour.',
      terms: 'This is a test entry only. No real bonus is offered.',
      howToClaimSteps: [],
      bonusExpiry: '2026-09-09',
      createdAt: Date.now(),
      currency: 'USD',
    });
  } catch(e) {}
}

// ── Review helpers ──────────────────────────────────────────
const REVIEWS_PER_PAGE = 5;
function countryFlag(code) {
  if (!code || code.length !== 2) return '';
  try { return [...code.toUpperCase()].map(c=>String.fromCodePoint(0x1F1E6-65+c.charCodeAt(0))).join(''); } catch(e){return '';}
}
function hasReviewed(bonusId) {
  try { return JSON.parse(localStorage.getItem('fbw_reviewed')||'[]').includes(bonusId); } catch(e){return false;}
}
function markReviewed(bonusId) {
  try {
    const a=JSON.parse(localStorage.getItem('fbw_reviewed')||'[]');
    if(!a.includes(bonusId)){a.push(bonusId);localStorage.setItem('fbw_reviewed',JSON.stringify(a));}
  } catch(e){}
}
function saveMyReview(bonusId, reviewId) {
  try {
    const o=JSON.parse(localStorage.getItem('fbw_my_reviews')||'{}');
    o[bonusId]=reviewId; localStorage.setItem('fbw_my_reviews',JSON.stringify(o));
  } catch(e){}
}
function getMyReviewId(bonusId) {
  try { return JSON.parse(localStorage.getItem('fbw_my_reviews')||'{}')[bonusId]||null; } catch(e){return null;}
}
function clearMyReview(bonusId) {
  try {
    const o=JSON.parse(localStorage.getItem('fbw_my_reviews')||'{}');
    delete o[bonusId]; localStorage.setItem('fbw_my_reviews',JSON.stringify(o));
    const a=JSON.parse(localStorage.getItem('fbw_reviewed')||'[]');
    const i=a.indexOf(bonusId); if(i>-1){a.splice(i,1);localStorage.setItem('fbw_reviewed',JSON.stringify(a));}
  } catch(e){}
}

// ════════════════════════════════════════════════════════════
//  STATE
// ════════════════════════════════════════════════════════════
const S = {
  theme:   localStorage.getItem('fbw_theme') || 'light',
  lang:    localStorage.getItem('fbw_lang')  || 'en',
  section: 'deposit',   // default = Deposit Bonus
  bonuses: [],
  reviews: [],
  loading: true,
  selectedId: null,
  menuOpen:   false,
  filter: 'all',
  sort:   localStorage.getItem('fbw_sort') || 'newest',  // default = Newest, persisted
  search: '',
  sortOpen: false,
  secOpen:  false,
  revName: '', revRating: 0, revHover: 0, revPage: 0,
  revSubmitted: false, revLoading: false,
  userCountry: '',
  adminEdit: null, adminMsg: '', adminSaving: false,
  bonusPage: 0,
};

// ════════════════════════════════════════════════════════════
//  LANGUAGES & I18N
// ════════════════════════════════════════════════════════════
const LANGS = {
  en: { label:'English',  flag:'🇬🇧' },
  fr: { label:'Français', flag:'🇫🇷' },
  de: { label:'Deutsch',  flag:'🇩🇪' },
  es: { label:'Español',  flag:'🇪🇸' },
  it: { label:'Italiano', flag:'🇮🇹' },
  ko: { label:'한국어',   flag:'🇰🇷' },
  ja: { label:'日本語',   flag:'🇯🇵' },
};

const I18N = {
  en: {
    navDeposit:'Deposit Bonus', navNoDeposit:'No Deposit Bonus',
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
    minDep:'Min. Deposit:', maxDep:'Max. Deposit:', maxBon:'Max. Bonus:', statusLabel:'Status:', verifiedLabel:'Verified:',
    bonusActiveUntil:'Active Until:', bonusExpired:'Expired:',
    yes:'Yes', no:'No', adminPanel:'Admin Panel', allBonuses:'ALL BONUSES',
    addBonus:'ADD NEW BONUS', editBonus:'EDIT BONUS',
    morFrom:'MORE FROM', footerTag:'Your independent guide to the best Forex broker bonuses. Always up to date.',
    contact:'Contact Us',
  },
  fr: {
    navDeposit:'Bonus de dépôt', navNoDeposit:'Bonus sans dépôt',
    navContest:'Concours', navAbout:'À propos',
    secNoDeposit:'Meilleurs bonus sans dépôt', secDeposit:'Meilleurs bonus de dépôt',
    secContest:'Meilleurs concours de trading',
    filterAll:'Tous', filterActive:'Actif', filterInactive:'Inactif',
    sortPopular:'Plus populaires', sortRated:'Mieux notés',
    sortNewest:'Plus récents', sortOldest:'Plus anciens',
    statBonuses:'Bonus', statActive:'Actif', statReviews:'Avis',
    viewDetails:'Voir les détails ›', backTo:'Retour aux bonus',
    claimNow:'Réclamez le bonus maintenant', submitReview:'Soumettre un avis',
    bonusLabel:'BONUS', aboutBonus:'À PROPOS DE CE BONUS',
    requirements:'EXIGENCES', termsTitle:'CONDITIONS GÉNÉRALES',
    userReviews:'AVIS DES UTILISATEURS', brokerInfo:'INFO COURTIER',
    bonusType:'TYPE DE BONUS', quickLinks:'LIENS RAPIDES',
    languages:'Langues', verified:'✓ Vérifié',
    statusActive:'Actif', statusInactive:'Inactif',
    yourName:'Votre nom', yourRating:'Votre note', comment:'Commentaire',
    searchPlaceholder:'Rechercher des courtiers, bonus…',
    noResults:'Aucun bonus trouvé.', loading:'Chargement des bonus…',
    noReviews:"Pas encore d'avis. Soyez le premier !", loadingReviews:'Chargement des avis…',
    reviewSubmitted:'✓ Avis soumis ! Merci.',
    result:'résultat', results:'résultats',
    broker:'Courtier :', regulation:'Régulation :', country:'Pays :',
    minDep:'Dépôt min. :', maxDep:'Dépôt max. :', maxBon:'Bonus max. :', statusLabel:'Statut :', verifiedLabel:'Vérifié :',
    bonusActiveUntil:'Actif jusqu\'au :', bonusExpired:'Expiré :',
    yes:'Oui', no:'Non', adminPanel:'Panneau Admin', allBonuses:'TOUS LES BONUS',
    addBonus:'AJOUTER UN BONUS', editBonus:'MODIFIER LE BONUS',
    morFrom:'PLUS DE', footerTag:'Votre guide indépendant des meilleurs bonus Forex. Toujours à jour.',
    contact:'Contactez-nous',
  },
  de: {
    navDeposit:'Einzahlungsbonus', navNoDeposit:'Kein Einzahlungsbonus',
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
    minDep:'Min. Einzahlung:', maxDep:'Max. Einzahlung:', maxBon:'Max. Bonus:', statusLabel:'Status:', verifiedLabel:'Verifiziert:',
    bonusActiveUntil:'Aktiv bis:', bonusExpired:'Abgelaufen:',
    yes:'Ja', no:'Nein', adminPanel:'Admin-Bereich', allBonuses:'ALLE BONI',
    addBonus:'NEUEN BONUS HINZUFÜGEN', editBonus:'BONUS BEARBEITEN',
    morFrom:'MEHR VON', footerTag:'Ihr unabhängiger Leitfaden für die besten Forex-Broker-Boni. Immer aktuell.',
    contact:'Kontakt',
  },
  es: {
    navDeposit:'Bono de depósito', navNoDeposit:'Bono sin depósito',
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
    minDep:'Dep. mínimo:', maxDep:'Dep. máx.:', maxBon:'Bono máx.:', statusLabel:'Estado:', verifiedLabel:'Verificado:',
    bonusActiveUntil:'Activo hasta:', bonusExpired:'Expirado:',
    yes:'Sí', no:'No', adminPanel:'Panel de Admin', allBonuses:'TODOS LOS BONOS',
    addBonus:'AÑADIR NUEVO BONO', editBonus:'EDITAR BONO',
    morFrom:'MÁS DE', footerTag:'Tu guía independiente para los mejores bonos de brokers Forex. Siempre actualizados.',
    contact:'Contáctanos',
  },
  it: {
    navDeposit:'Bonus deposito', navNoDeposit:'Bonus senza deposito',
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
    minDep:'Dep. minimo:', maxDep:'Dep. massimo:', maxBon:'Bonus max.:', statusLabel:'Stato:', verifiedLabel:'Verificato:',
    bonusActiveUntil:'Attivo fino a:', bonusExpired:'Scaduto:',
    yes:'Sì', no:'No', adminPanel:'Pannello Admin', allBonuses:'TUTTI I BONUS',
    addBonus:'AGGIUNGI BONUS', editBonus:'MODIFICA BONUS',
    morFrom:'ALTRO DA', footerTag:'La tua guida indipendente ai migliori bonus Forex. Sempre aggiornati.',
    contact:'Contattaci',
  },
  ko: {
    navDeposit:'입금 보너스', navNoDeposit:'무입금 보너스',
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
    minDep:'최소 입금:', maxDep:'최대 입금:', maxBon:'최대 보너스:', statusLabel:'상태:', verifiedLabel:'검증:',
    bonusActiveUntil:'활성 만료일:', bonusExpired:'만료됨:',
    yes:'예', no:'아니오', adminPanel:'관리자 패널', allBonuses:'전체 보너스',
    addBonus:'새 보너스 추가', editBonus:'보너스 편집',
    morFrom:'더 보기', footerTag:'최고의 Forex 브로커 보너스를 위한 독립 가이드. 항상 최신 상태.',
    contact:'문의',
  },
  ja: {
    navDeposit:'入金ボーナス', navNoDeposit:'入金不要ボーナス',
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
    minDep:'最低入金:', maxDep:'最大入金:', maxBon:'最大ボーナス:', statusLabel:'ステータス:', verifiedLabel:'認証:',
    bonusActiveUntil:'有効期限:', bonusExpired:'期限切れ:',
    yes:'はい', no:'いいえ', adminPanel:'管理者パネル', allBonuses:'全ボーナス',
    addBonus:'ボーナスを追加', editBonus:'ボーナスを編集',
    morFrom:'他のボーナス', footerTag:'最高のForexブローカーボーナスのための独立したガイド。常に最新。',
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

async function translateDetailFields(b) {
  if (S.lang === 'en') return;
  const lang = S.lang;
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

// Compute effective status: checks bonusExpiry date for auto-expiry
function statusLC(b) {
  const base = ((b.status || 'active')).toLowerCase();
  if (b.bonusExpiry) {
    try {
      const expiry = new Date(b.bonusExpiry + 'T23:59:59');
      if (!isNaN(expiry) && new Date() > expiry) return 'inactive';
    } catch(e) {}
  }
  return base;
}

// Format expiry date as YYYY.M.D
function formatExpiry(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d)) return dateStr;
    return d.getFullYear() + '.' + (d.getMonth()+1) + '.' + d.getDate();
  } catch(e) { return dateStr; }
}

function starsSVG(filled) {
  return `<svg width="13" height="13" viewBox="0 0 24 24" fill="${filled?'#F59E0B':'none'}" stroke="#F59E0B" stroke-width="2" style="display:inline-block;vertical-align:middle"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
}
function starsRow(rating) {
  const r = Math.round(Math.max(0,Math.min(5,+rating||0)));
  return [1,2,3,4,5].map(i=>starsSVG(i<=r)).join('');
}

function interactiveStars(cur) {
  const btns = [5,4,3,2,1].map(i=>
    `<button type="button" class="star-inp${cur>=i?' sel':''}" data-action="set-star" data-val="${i}" aria-label="${i} star"><svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="pointer-events:none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></button>`
  ).join('');
  return `<div class="star-selector" id="rev-stars">${btns}</div>`;
}

function typeMeta(tp) {
  if (tp === 'deposit') return { label: t('navDeposit'), icon:'💰', desc:'Get a bonus when you make your first deposit.' };
  if (tp === 'contest') return { label: t('navContest'), icon:'🏆', desc:'Compete with other traders for prizes.' };
  return { label: t('navNoDeposit'), icon:'🎁', desc:'No initial deposit needed. Start trading with free funds.' };
}
function getSortLabels() {
  return { newest: t('sortNewest'), oldest: t('sortOldest'), popular: t('sortPopular'), rating: t('sortRated') };
}
function sortList(list) {
  return [...list].sort((a, b) => {
    if (S.sort === 'popular') return (+b.views||0)  - (+a.views||0);
    if (S.sort === 'rating')  return (+b.rating||0) - (+a.rating||0);
    if (S.sort === 'oldest')  return (+a.createdAt||0) - (+b.createdAt||0);
    return (+b.createdAt||0) - (+a.createdAt||0); // newest (default)
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

function onSearch(val) {
  S.search = val;
  S.bonusPage = 0;
  render();
}

// ════════════════════════════════════════════════════════════
//  NAV ITEMS — order: Deposit, No Deposit, Contest, About
// ════════════════════════════════════════════════════════════
const NAV_ITEMS = [
  {id:'deposit',    key:'navDeposit'},
  {id:'no-deposit', key:'navNoDeposit'},
  {id:'contest',    key:'navContest'},
  {id:'about',      key:'navAbout'},
];

// SVG icons for nav items
const NAV_ICONS = {
  'deposit':    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  'no-deposit': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12v10H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>`,
  'contest':    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>`,
  'about':      `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12.01" y2="8"/><line x1="12" y1="12" x2="12" y2="16"/></svg>`,
};

// ════════════════════════════════════════════════════════════
//  IMAGE UPLOAD HELPERS
// ════════════════════════════════════════════════════════════
function uploadImage(input, urlFieldId, previewId) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    const urlField = document.getElementById(urlFieldId);
    if (urlField) urlField.value = dataUrl;
    const prevEl = document.getElementById(previewId);
    if (prevEl) prevEl.innerHTML = `<img src="${esc(dataUrl)}" style="width:52px;height:52px;object-fit:contain;border-radius:10px;border:1px solid var(--border);margin-top:4px" alt="preview"/>`;
  };
  reader.readAsDataURL(file);
}

// ════════════════════════════════════════════════════════════
//  NAVIGATION — uses hash routing without scroll-to-top side effects
// ════════════════════════════════════════════════════════════
const HASH_MAP = {
  'deposit':    '/deposit',
  'no-deposit': '/no-deposit',
  'contest':    '/contest',
  'about':      '/about',
  'admin':      '/admin',
};

function navigate(sec) {
  S.section=sec; S.selectedId=null; S.menuOpen=false;
  S.filter='all'; S.search=''; S.sortOpen=false; S.secOpen=false; S.bonusPage=0;
  const newPath = HASH_MAP[sec] || '/deposit';
  if (window.location.pathname !== newPath) {
    history.pushState(null, '', newPath);
  }
  render();
}
function viewDetails(id) {
  S.selectedId=id; S.menuOpen=false;
  S.revName=''; S.revRating=0; S.revHover=0; S.revPage=0; S.revSubmitted=false;
  S.revSubmitted=false; S.reviews=[]; S.revLoading=false;
  history.pushState(null, '', `/bonus/${id}`);
  render();
  fetchAndShowReviews(id);
  const bonus=S.bonuses.find(b=>b.id===id);
  if (bonus) incrementViews(id,+bonus.views||0).then(v=>{if(bonus)bonus.views=v;});
  window.scrollTo({top:0,behavior:'smooth'});
  if (S.lang !== 'en' && bonus) setTimeout(()=>translateDetailFields(bonus), 100);
}
function goBack() {
  S.selectedId=null;
  const newPath = HASH_MAP[S.section] || '/deposit';
  history.pushState(null, '', newPath);
  render();
  window.scrollTo({top:0});
}

// ════════════════════════════════════════════════════════════
//  FIREBASE ACTIONS
// ════════════════════════════════════════════════════════════
async function refreshBonuses() {
  S.loading=true; render();
  S.bonuses=await loadBonuses();
  S.loading=false; render();
}
async function fetchAndShowReviews(bonusId) {
  S.revLoading=true;
  const el=document.getElementById('reviews-list');
  if(el) el.innerHTML=`<p class="empty-revs">${t('loadingReviews')}</p>`;
  S.reviews=await loadReviews(bonusId);
  S.revLoading=false;
  showReviews();
}
function showReviews() {
  const el=document.getElementById('reviews-list');
  if(!el) return;
  if(!S.reviews.length){el.innerHTML=`<p class="empty-revs">${esc(t('noReviews'))}</p>`;return;}
  const total=S.reviews.length;
  const totalPages=Math.ceil(total/REVIEWS_PER_PAGE);
  const page=Math.min(S.revPage,totalPages-1);
  const start=page*REVIEWS_PER_PAGE;
  const pageRevs=S.reviews.slice(start,start+REVIEWS_PER_PAGE);
  const myId=getMyReviewId(S.selectedId);
  let html=pageRevs.map(r=>{
    const flag=r.countryCode?countryFlag(r.countryCode):'';
    const isOwn=r.id&&r.id===myId;
    return `<div class="review-item">
      <div class="review-top">
        ${flag?`<span class="review-flag">${flag}</span>`:''}
        <span class="review-name">${esc(r.name||'Anonymous')}</span>
        <span class="review-stars">${starsRow(r.rating)}</span>
        <span class="review-date">${r.createdAt?new Date(+r.createdAt).toLocaleDateString():''}</span>
        ${isOwn?`<button class="rev-del-btn" data-action="del-review" data-bid="${esc(S.selectedId)}" data-rid="${esc(r.id)}" title="Delete your review">✕ Delete</button>`:''}
      </div>
      ${r.comment?`<p class="review-comment">${esc(r.comment)}</p>`:''}</div>`;
  }).join('');
  if(totalPages>1){
    html+=`<div class="rev-pagination">${Array.from({length:totalPages},(_,i)=>`<button class="rev-page-btn${i===page?' rev-page-active':''}" data-action="rev-page" data-val="${i}">${i+1}</button>`).join('')}</div>`;
  }
  el.innerHTML=html;
}
async function submitReview(bonusId) {
  const nameEl=document.getElementById('rev-name');
  const commentEl=document.getElementById('rev-comment');
  const name=(nameEl?.value||'').trim()||'Anonymous';
  const comment=(commentEl?.value||'').trim();
  const rating=S.revRating;
  if(!rating){alert('Please select a star rating before submitting.');return;}
  if(hasReviewed(bonusId)){alert('You have already submitted a review for this bonus.');return;}
  const bonus=S.bonuses.find(b=>b.id===bonusId);
  if(!bonus) return;
  const oldR=+bonus.rating||0, oldN=+bonus.reviews||0;
  const newN=oldN+1;
  const newR=Math.round(((oldR*oldN)+rating)/newN*10)/10;
  const fbResult=await postReview(bonusId,{name,rating,comment,countryCode:S.userCountry});
  const reviewId=fbResult?.name||('new_'+Date.now());
  await updateBonus(bonusId,{rating:newR,reviews:newN});
  bonus.rating=newR; bonus.reviews=newN;
  markReviewed(bonusId);
  saveMyReview(bonusId,reviewId);
  S.revSubmitted=true; S.revRating=0; S.revPage=0;
  S.reviews.unshift({id:reviewId,name,rating,comment,countryCode:S.userCountry,createdAt:Date.now()});
  const revSection=document.getElementById('user-reviews-section');
  if(revSection) revSection.innerHTML=renderReviewsSection(bonusId);
  showReviews();
}
async function handleAdminSubmit(e) {
  e.preventDefault();
  S.adminSaving=true;
  const formCard=document.getElementById('admin-form-card');
  if(formCard){const btn=formCard.querySelector('.submit-btn');if(btn)btn.disabled=true;}
  const fd=new FormData(e.target);
  const steps=(fd.get('steps')||'').split('\n').filter(Boolean);
  const data={
    brokerId:       (fd.get('brokerId')||'').trim(),
    brokerName:     (fd.get('brokerName')||'').trim(),
    brokerImageUrl: (fd.get('brokerImageUrl')||'').trim(),
    title:          (fd.get('title')||'').trim(),
    amount:         (fd.get('amount')||'').trim(),
    type:           fd.get('type')||'deposit',
    status:         fd.get('status')||'active',
    verified:       fd.get('verified')==='on',
    regulation:     (fd.get('regulation')||'').trim(),
    country:        (fd.get('country')||'').trim(),
    minDeposit:     (fd.get('minDeposit')||'').trim(),
    maxDeposit:     (fd.get('maxDeposit')||'').trim(),
    maxBonus:       (fd.get('maxBonus')||'').trim(),
    rating:         parseFloat(fd.get('rating'))||0,
    reviews:        parseInt(fd.get('reviews'))||0,
    views:          parseInt(fd.get('views'))||0,
    claimUrl:       (fd.get('claimUrl')||'').trim(),
    imageUrl:       (fd.get('imageUrl')||'').trim(),
    description:    (fd.get('description')||'').trim(),
    terms:          (fd.get('terms')||'').trim(),
    howToClaimSteps:steps,
    bonusExpiry:    (fd.get('bonusExpiry')||'').trim(),
    currency:'USD',
  };
  if(S.adminEdit){
    await updateBonus(S.adminEdit.id,data);
    S.adminMsg='✓ Updated successfully!';
    S.adminEdit=null;
  } else {
    await addBonus(data);
    S.adminMsg='✓ Bonus added!';
  }
  S.adminSaving=false;
  await refreshBonuses();
  setTimeout(()=>{S.adminMsg='';const el=document.querySelector('.success-msg');if(el)el.remove();},3000);
}

// ════════════════════════════════════════════════════════════
//  RENDER: HEADER
// ════════════════════════════════════════════════════════════
function renderHeader() {
  const sunSVG=`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
  const moonSVG=`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  const menuSVG=`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
  const closeSVG=`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  return `
<header class="header">
  <div class="header-inner">
    <button class="logo-btn" data-action="nav" data-sec="deposit">
      <img src="favicon.svg" class="logo-whale" alt="ForexBonusWhale" width="32" height="32"/>
      <span class="logo-text">ForexBonusWhale</span>
    </button>
    <div style="display:flex;align-items:center;gap:8px">
      <button class="icon-hdr-btn" data-action="theme" title="Toggle theme">${S.theme==='dark'?sunSVG:moonSVG}</button>
      <button class="icon-hdr-btn" data-action="menu-toggle" title="Menu">${S.menuOpen?closeSVG:menuSVG}</button>
    </div>
  </div>
</header>`;
}

// ════════════════════════════════════════════════════════════
//  RENDER: MOBILE MENU — redesigned full panel
// ════════════════════════════════════════════════════════════
function renderMenu() {
  const sunSVG=`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
  const moonSVG=`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  const closeSVG=`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

  const total   = S.bonuses.length;
  const active  = S.bonuses.filter(b=>statusLC(b)==='active').length;
  const reviews = S.bonuses.reduce((s,b)=>s+(+b.reviews||0),0);

  return `
<div class="menu-backdrop" data-action="menu-close"></div>
<nav class="mobile-menu">
  <div class="menu-top-bar">
    <div class="menu-top-logo">
      <img src="favicon.svg" width="28" height="28" alt="whale" style="flex-shrink:0"/>
      <span class="menu-top-logo-text">ForexBonusWhale</span>
    </div>
    <div class="menu-top-actions">
      <button class="icon-hdr-btn" data-action="theme" title="Toggle theme">${S.theme==='dark'?sunSVG:moonSVG}</button>
      <button class="icon-hdr-btn" data-action="menu-toggle" title="Close">${closeSVG}</button>
    </div>
  </div>
  <div class="menu-nav-section">
    ${NAV_ITEMS.map(item=>`
    <button class="menu-item${S.section===item.id&&!S.selectedId?' menu-item-active':''}"
      data-action="nav" data-sec="${item.id}">
      <span class="menu-item-icon">${NAV_ICONS[item.id]||''}</span>
      ${esc(t(item.key))}
    </button>`).join('')}
  </div>

</nav>`;
}

function onMenuSearch(val) {
  S.search = val;
  S.bonusPage = 0;
  S.menuOpen = false;
  // Navigate to current section to show filtered results
  render();
}

// ════════════════════════════════════════════════════════════
//  RENDER: STATS BAR
// ════════════════════════════════════════════════════════════
function renderStats() {
  const total   = S.bonuses.length;
  const active  = S.bonuses.filter(b=>statusLC(b)==='active').length;
  const reviews = S.bonuses.reduce((s,b)=>s+(+b.reviews||0),0);
  return `
<div class="stats-bar">
  <div class="stat-item">
    <div class="stat-icon stat-blue"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div>
    <div><div class="stat-lbl">${esc(t('statBonuses'))}</div><div class="stat-val">${total}</div></div>
  </div>
  <div class="stat-item">
    <div class="stat-icon stat-green"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>
    <div><div class="stat-lbl">${esc(t('statActive'))}</div><div class="stat-val">${active}</div></div>
  </div>
  <div class="stat-item">
    <div class="stat-icon stat-sky"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
    <div><div class="stat-lbl">${esc(t('statReviews'))}</div><div class="stat-val">${fmt(reviews)}</div></div>
  </div>
</div>`;
}

// ════════════════════════════════════════════════════════════
//  RENDER: BROKER CARD — image fills full width
// ════════════════════════════════════════════════════════════
function renderCard(b) {
  const rating  = +b.rating  || 0;
  const reviews = +b.reviews || 0;
  const views   = +b.views   || 0;
  const initial = (b.brokerName||'B')[0].toUpperCase();
  const isActive = statusLC(b) === 'active';
  return `
<div class="broker-card">
  <div class="card-top-row">
    <div class="card-broker-info">
      ${b.brokerImageUrl
        ? `<img src="${esc(b.brokerImageUrl)}" class="card-broker-img" alt="${esc(b.brokerName)}" onerror="this.style.display='none'">`
        : `<div class="card-avatar">${esc(initial)}</div>`}
      <div>
        <div class="card-broker-name">${esc(b.brokerName)}</div>
        <div class="card-broker-sub" data-tr-card="${esc(b.title)}">${esc(b.title)}</div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
      <span class="status-badge ${isActive?'s-active':'s-inactive'}">● ${isActive?t('statusActive'):t('statusInactive')}</span>
    </div>
  </div>
  ${b.imageUrl?`<div class="card-bonus-img-wrap"><img src="${esc(b.imageUrl)}" class="card-bonus-img" alt="${esc(b.title||b.brokerName)}" onerror="this.parentElement.style.display='none'"></div>`:''}
  <div class="card-bonus-label">${esc(t('bonusLabel'))}</div>
  <div class="card-bonus-amount">${amt(b.amount)}</div>
  <div class="card-meta-row">
    <div style="display:flex;align-items:center;gap:5px">
      ${starsRow(rating)}
      <span class="meta-num">${rating.toFixed(1)}</span>
      <span class="meta-muted">(${fmt(reviews)})</span>
    </div>
    <div class="meta-views"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> ${fmt(views)}</div>
  </div>
  <button class="view-btn" data-action="view" data-id="${esc(b.id)}">${esc(t('viewDetails'))}</button>
</div>`;
}

// ════════════════════════════════════════════════════════════
//  RENDER: BONUS LIST
// ════════════════════════════════════════════════════════════
const BONUSES_PER_PAGE = 10;
function renderList() {
  const allFiltered = filteredBonuses();
  const totalBonusPages = Math.ceil(allFiltered.length / BONUSES_PER_PAGE);
  const bonusPage = Math.min(S.bonusPage, Math.max(0, totalBonusPages - 1));
  const filtered = allFiltered.slice(bonusPage * BONUSES_PER_PAGE, (bonusPage + 1) * BONUSES_PER_PAGE);
  const sortLabels = getSortLabels();
  const secDrop = S.secOpen ? `
<div class="section-dropdown">
  ${['deposit','no-deposit','contest'].map(s=>`
    <button class="section-drop-item${s===S.section?' section-drop-active':''}" data-action="nav" data-sec="${s}">
      ${secLabel(s)}
    </button>`).join('')}
</div>` : '';

  const sortDrop = S.sortOpen ? `
<div class="sort-dropdown">
  ${Object.entries(sortLabels).map(([k,v])=>`
    <button class="sort-option${S.sort===k?' sort-option-active':''}" data-action="sort-set" data-val="${k}">
      ${esc(v)}
    </button>`).join('')}
</div>` : '';

  const filterKeys = ['all','active','inactive'];
  const filterLabels = [t('filterAll'), t('filterActive'), t('filterInactive')];

  return `
${renderStats()}
<div class="page-content">
  <div class="search-bar">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:.5;flex-shrink:0"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    <input id="search-input" class="search-input" placeholder="${esc(t('searchPlaceholder'))}"
      value="${esc(S.search)}" oninput="onSearch(this.value)"/>
  </div>

  <div class="sec-heading-wrap" style="position:relative">
    <button class="sec-heading-btn" data-action="sec-toggle">
      <span class="sec-heading-bar"></span>
      <span class="sec-heading-text">${secLabel(S.section)}</span>
      ${chevSVG(S.secOpen)}
    </button>
    ${secDrop}
  </div>

  <div class="filter-row">
    ${filterKeys.map((f,i)=>`
      <button class="filter-tab${S.filter===f?' filter-tab-active':''}" data-action="filter" data-val="${f}">
        ${esc(filterLabels[i])}
      </button>`).join('')}
  </div>

  <div class="sort-row">
    <button class="sort-btn" data-action="sort-toggle">
      ${esc(sortLabels[S.sort]||sortLabels.newest)} ${chevSVG(S.sortOpen)}
    </button>
    ${sortDrop}
  </div>

  <div class="results-count">${allFiltered.length} ${allFiltered.length!==1?t('results'):t('result')}</div>

  ${S.loading
    ? `<div class="state-msg">${esc(t('loading'))}</div>`
    : allFiltered.length===0
      ? `<div class="state-msg">${esc(t('noResults'))}</div>`
      : `<div class="cards-list">${filtered.map(renderCard).join('')}</div>
        ${totalBonusPages > 1 ? `<div class="bonus-pagination">${Array.from({length:totalBonusPages},(_,i)=>`<button class="bonus-page-btn${i===bonusPage?' bonus-page-active':''}" data-action="bonus-page" data-val="${i}">${i+1}</button>`).join('')}</div>` : ''}`}
</div>`;
}

// ════════════════════════════════════════════════════════════
//  RENDER: REVIEWS SECTION
// ════════════════════════════════════════════════════════════
function renderReviewsSection(bonusId) {
  const alreadyReviewed = hasReviewed(bonusId);
  let formContent;
  if (alreadyReviewed) {
    formContent = `<p class="already-reviewed">✓ You have already submitted a review for this bonus.</p>`;
  } else if (S.revSubmitted) {
    formContent = `<div class="submit-success">${esc(t('reviewSubmitted'))}</div>`;
  } else {
    formContent = `<div class="rev-form">
  <div class="form-field">
    <label class="form-label">${esc(t('yourName'))}</label>
    <input id="rev-name" class="form-input" placeholder="e.g. John D." value="${esc(S.revName)}" oninput="S.revName=this.value"/>
  </div>
  <div class="form-field">
    <label class="form-label">${esc(t('yourRating'))}</label>
    ${interactiveStars(S.revRating)}
  </div>
  <div class="form-field">
    <label class="form-label">${esc(t('comment'))}</label>
    <textarea id="rev-comment" class="form-input" rows="4" placeholder="${esc(t('comment'))}…"></textarea>
  </div>
  <button type="button" class="submit-review-btn" data-action="submit-review" data-bid="${esc(bonusId)}">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
    ${esc(t('submitReview'))}
  </button>
</div>`;
  }
  return `
<div class="dsec-title">${esc(t('userReviews'))}</div>
${formContent}
<div class="rev-divider"></div>
<div id="reviews-list"><p class="empty-revs">${esc(t('loadingReviews'))}</p></div>`;
}

// ════════════════════════════════════════════════════════════
//  RENDER: DETAIL
// ════════════════════════════════════════════════════════════
function renderDetail(b) {
  if(!b) return `<div class="page-content"><div class="state-msg">${esc(t('noResults'))}</div></div>`;
  const rating  = +b.rating  || 0;
  const reviews = +b.reviews || 0;
  const views   = +b.views   || 0;
  const initial = (b.brokerName||'B')[0].toUpperCase();
  const tm = typeMeta(b.type);
  const related = S.bonuses.filter(x => x.id !== b.id && (
    (b.brokerId && x.brokerId && x.brokerId === b.brokerId) ||
    (!b.brokerId && (x.brokerName||'').toLowerCase() === (b.brokerName||'').toLowerCase())
  ));
  const isActive = statusLC(b) === 'active';
  const expiryFormatted = b.bonusExpiry ? formatExpiry(b.bonusExpiry) : '';
  const expiryLabel = isActive ? t('bonusActiveUntil') : t('bonusExpired');

  return `
<div class="page-content" style="padding-top:0">
  <div style="display:flex;align-items:center;justify-content:space-between">
    <button class="back-btn" data-action="back" style="padding:12px 0 10px">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
      ${esc(t('backTo'))}
    </button>
    <button class="copy-link-btn" id="copy-link-btn" data-action="copy-link">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
      Copy Link
    </button>
  </div>

  <div class="detail-card">
    <div class="detail-broker-row">
      ${b.brokerImageUrl
        ? `<img src="${esc(b.brokerImageUrl)}" class="detail-broker-img" alt="${esc(b.brokerName)}" onerror="this.style.display='none'">`
        : `<div class="card-avatar" style="width:52px;height:52px;font-size:22px;border-radius:12px;flex-shrink:0">${esc(initial)}</div>`}
      <div style="flex:1;min-width:0">
        <div class="detail-broker-name-caps">${esc((b.brokerName||'').toUpperCase())}</div>
        <div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px">
          <span class="type-badge">${tm.icon} ${esc(tm.label)}</span>
          <span class="status-badge ${isActive?'s-active':'s-inactive'}">● ${isActive?t('statusActive'):t('statusInactive')}</span>
          ${b.verified?`<span class="verified-badge">${esc(t('verified'))}</span>`:''}
        </div>
      </div>
    </div>
    <div class="detail-title"><span id="tr-title">${esc(b.title||'')}</span></div>
    ${b.imageUrl?`<div class="bonus-img-standalone"><img src="${esc(b.imageUrl)}" class="bonus-highlight-img" alt="${esc(b.title||b.brokerName)}" onerror="this.parentElement.style.display='none'"></div>`:''}
    <div class="bonus-amount-card">
      <div class="bh-label">${esc(t('bonusLabel'))}</div>
      <div class="bh-amount">${amt(b.amount)}</div>
    </div>
    <div class="card-meta-row" style="margin-top:12px;margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:5px">
        ${starsRow(rating)}
        <span class="meta-num">${rating.toFixed(1)}</span>
        <span class="meta-muted">(${fmt(reviews)} ${t('statReviews').toLowerCase()})</span>
      </div>
      <div class="meta-views"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> ${fmt(views)}</div>
    </div>
    <button class="claim-btn" data-action="claim" data-id="${esc(b.id)}" data-url="${esc(b.claimUrl||'')}">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
      ${esc(t('claimNow'))}
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
    </button>
    ${b.claimCount?`<p style="text-align:center;font-size:11px;color:var(--text3);margin-top:6px">🔥 ${fmt(b.claimCount)} traders claimed this bonus</p>`:''}
  </div>

  ${b.description?`
  <div class="detail-sec-card">
    <div class="dsec-title">${esc(t('aboutBonus'))}</div>
    <p class="detail-text" id="tr-desc">${esc(b.description)}</p>
  </div>`:''}

  ${b.howToClaimSteps?.length?`
  <div class="detail-sec-card">
    <div class="dsec-title">${esc(t('requirements'))}</div>
    <ol class="steps-list">
      ${b.howToClaimSteps.map((s,i)=>`
      <li class="step-item"><span class="step-num">${i+1}</span><span id="tr-step-${i}">${esc(s)}</span></li>`).join('')}
    </ol>
  </div>`:''}

  ${b.terms?`
  <div class="detail-sec-card">
    <div class="dsec-title">${esc(t('termsTitle'))}</div>
    <p class="detail-text terms-text" id="tr-terms">${esc(b.terms)}</p>
  </div>`:''}

  <div class="detail-sec-card">
    <div class="dsec-title">${esc(t('brokerInfo'))}</div>
    <div class="broker-info-list">
      <div class="bi-row">
        <span class="bi-icon" style="color:#3b82f6"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span>
        <span class="bi-key">${esc(t('broker'))}</span>
        <span class="bi-val">${esc(b.brokerName)}</span>
      </div>
      ${b.regulation?`
      <div class="bi-row">
        <span class="bi-icon" style="color:#10b981"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span>
        <span class="bi-key">${esc(t('regulation'))}</span>
        <span class="bi-val">${esc(b.regulation)}</span>
      </div>`:''}
      ${b.country?`
      <div class="bi-row">
        <span class="bi-icon" style="color:#f59e0b"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></span>
        <span class="bi-key">${esc(t('country'))}</span>
        <span class="bi-val">${esc(b.country)}</span>
      </div>`:''}
      ${b.minDeposit!==undefined&&b.minDeposit!==''?`
      <div class="bi-row">
        <span class="bi-icon" style="color:#f59e0b"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></span>
        <span class="bi-key">${esc(t('minDep'))}</span>
        <span class="bi-val">${esc(b.minDeposit)}</span>
      </div>`:''}
      ${b.maxDeposit!==undefined&&b.maxDeposit!==''?`
      <div class="bi-row">
        <span class="bi-icon" style="color:#f59e0b"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></span>
        <span class="bi-key">${esc(t('maxDep'))}</span>
        <span class="bi-val">${esc(b.maxDeposit)}</span>
      </div>`:''}
      ${b.maxBonus!==undefined&&b.maxBonus!==''?`
      <div class="bi-row">
        <span class="bi-icon" style="color:#10b981"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></span>
        <span class="bi-key">${esc(t('maxBon'))}</span>
        <span class="bi-val">${esc(b.maxBonus)}</span>
      </div>`:''}
      <div class="bi-row">
        <span style="width:16px;display:inline-block;flex-shrink:0"></span>
        <span class="bi-key">${esc(t('statusLabel'))}</span>
        <span class="bi-val ${isActive?'color-green':'color-muted'}">${isActive?t('statusActive')+' ✓':t('statusInactive')}</span>
      </div>
      ${expiryFormatted?`
      <div class="bi-row">
        <span class="bi-icon" style="color:${isActive?'#10b981':'#64748b'}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>
        <span class="bi-key">${esc(expiryLabel)}</span>
        <span class="bi-val ${isActive?'color-green':'color-muted'}">${esc(expiryFormatted)}</span>
      </div>`:''}
      <div class="bi-row">
        <span class="bi-icon" style="color:${b.verified?'#3b82f6':'#64748b'}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></span>
        <span class="bi-key">${esc(t('verifiedLabel'))}</span>
        <span class="bi-val ${b.verified?'color-blue':''}">${b.verified?t('yes'):t('no')}</span>
      </div>
    </div>
  </div>

  ${related.length?`
  <div class="detail-sec-card">
    <div class="dsec-title">${esc(t('morFrom'))} ${esc((b.brokerName||'').toUpperCase())}</div>
    <div class="related-list">
      ${related.map(rb=>{
        const rbInitial = (rb.brokerName||'B')[0].toUpperCase();
        return `
      <button class="related-btn" data-action="view" data-id="${esc(rb.id)}">
        ${rb.brokerImageUrl
          ? `<img src="${esc(rb.brokerImageUrl)}" class="related-logo" alt="${esc(rb.brokerName)}" onerror="this.style.display='none'"/>`
          : `<div class="related-logo-av">${esc(rbInitial)}</div>`}
        <div style="flex:1;min-width:0">
          <div class="related-type">${typeMeta(rb.type).label}</div>
          <div class="related-title">${esc(rb.title)}</div>
        </div>
        <span class="related-amount">${amt(rb.amount)}</span>
      </button>`;
      }).join('')}
    </div>
  </div>`:''}

  <div class="detail-sec-card">
    <div class="dsec-title">${esc(t('bonusType'))}</div>
    <div style="display:flex;align-items:flex-start;gap:10px">
      <span style="font-size:24px;line-height:1;margin-top:1px">${tm.icon}</span>
      <div>
        <div class="btype-label">${esc(tm.label)}</div>
        <p class="detail-text" style="margin-top:4px">${esc(tm.desc)}</p>
      </div>
    </div>
  </div>

  <div id="user-reviews-section" class="detail-sec-card">
    ${renderReviewsSection(b.id)}
  </div>
</div>`;
}

// ════════════════════════════════════════════════════════════
//  RENDER: ABOUT — restructured to match design screenshots
// ════════════════════════════════════════════════════════════
function renderAbout() {
  const warnTriangle = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;color:#ef4444"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
  const shieldSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="color:#ef4444;flex-shrink:0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
  const infoSVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12.01" y2="8"/><line x1="12" y1="12" x2="12" y2="16"/></svg>`;
  const scaleSVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3l1.88 5.76H19.5l-5 3.63 1.88 5.76L12 15.16l-4.38 3-1.88-5.76-5-3.63h5.62z" style="display:none"/><line x1="12" y1="3" x2="12" y2="21"/><path d="M3 6l4.5 9"/><path d="M21 6l-4.5 9"/><path d="M3 6h18"/><path d="M3 15h4"/><path d="M17 15h4"/></svg>`;
  return `
<div class="page-content">
  <div class="detail-sec-card" style="margin-top:14px">
    <div class="about-sec-hdr">
      <div class="about-sec-icon" style="background:var(--sb-blue-bg);color:var(--sb-blue)">${infoSVG}</div>
      <span style="font-size:16px;font-weight:700;color:var(--text)">What We Do</span>
    </div>
    <p class="about-body">ForexBonusWhale is an independent information platform that curates and presents Forex broker bonus offers — including no-deposit bonuses, deposit match bonuses, and trading contests. We help traders discover promotional opportunities and make informed decisions before engaging with a broker.</p>
  </div>

  <div class="detail-sec-card">
    <div class="about-sec-hdr">
      <div class="about-sec-icon" style="background:var(--sb-blue-bg);color:var(--sb-blue)">${scaleSVG}</div>
      <span style="font-size:16px;font-weight:700;color:var(--text)">Our Standards</span>
    </div>
    <p class="about-body">We only list brokers regulated by recognized financial authorities. All bonus information is reviewed for accuracy and updated regularly. However, bonus terms can change without notice — always verify directly with the broker before claiming.</p>
  </div>

  <div class="disclaimer-outer">
    <div class="disclaimer-inner">
      <div class="disclaimer-hdr">
        ${shieldSVG}
        Important Legal Disclaimer
      </div>
      <p class="disclaimer-intro">Please read this disclaimer carefully before using ForexBonusWhale. By accessing this website, you acknowledge and accept the following terms in full:</p>

      <div class="disclaimer-section">
        <div class="disclaimer-sub-hdr">${warnTriangle}<strong>No Financial Advice</strong></div>
        <p class="disclaimer-section-body">Nothing on ForexBonusWhale constitutes financial, investment, legal, or tax advice. All content is for informational purposes only. Trading foreign exchange carries substantial risk, including the possible loss of your entire invested capital. You are solely responsible for any financial decisions you make.</p>
      </div>

      <div class="disclaimer-section">
        <div class="disclaimer-sub-hdr">${warnTriangle}<strong>No Liability for Financial Losses</strong></div>
        <p class="disclaimer-section-body">ForexBonusWhale, its owners, operators, editors, and contributors shall not be held liable, under any circumstances, for any financial losses, trading losses, loss of capital, or any other damages — direct, indirect, incidental, or consequential — arising from your use of any bonus offer, broker, or information on this website. The use of any bonus listed is entirely at your own risk.</p>
      </div>

      <div class="disclaimer-section">
        <div class="disclaimer-sub-hdr">${warnTriangle}<strong>Duplicate Account &amp; Bonus Abuse Responsibility</strong></div>
        <p class="disclaimer-section-body">Many brokers strictly prohibit the creation of multiple accounts to claim bonuses repeatedly. ForexBonusWhale bears absolutely no responsibility for any account suspensions, fund forfeitures, bans, or legal consequences arising from violations of a broker's terms of service, including duplicate account creation or bonus abuse. It is your sole responsibility to read and comply with each broker's terms before claiming any offer.</p>
      </div>

      <div class="disclaimer-section">
        <div class="disclaimer-sub-hdr">${warnTriangle}<strong>Information Accuracy</strong></div>
        <p class="disclaimer-section-body">While we make every effort to ensure accuracy, bonus terms, availability, and conditions are subject to change by brokers without prior notice. ForexBonusWhale does not guarantee the accuracy, completeness, or currency of any information on this platform. Always verify bonus terms directly with the relevant broker before making any financial commitment.</p>
      </div>

      <div class="disclaimer-section" style="margin-bottom:0">
        <div class="disclaimer-sub-hdr">${warnTriangle}<strong>Third-Party Relationships</strong></div>
        <p class="disclaimer-section-body">Some links on this website may be affiliate links. ForexBonusWhale may receive compensation when you click on links to broker websites. This compensation does not influence our editorial content, but you should be aware of this relationship. We are not responsible for the practices, terms, or conduct of any third-party broker or website.</p>
      </div>

      <div class="disclaimer-warning-box">
        ⚠️ Trading Forex involves significant risk of loss. Never invest money you cannot afford to lose. Consult a licensed financial advisor before trading.
      </div>

      <p class="disclaimer-ack">By using this website, you acknowledge that you have read and agreed to this disclaimer in its entirety.</p>
    </div>
  </div>

  <div class="detail-sec-card">
    <h2 class="about-h" style="margin-top:0">Contact Us</h2>
    <p class="about-body">Have a bonus to list or found incorrect information? <a href="mailto:forexbonuswhale@gmail.com" class="link-email">forexbonuswhale@gmail.com</a></p>
    <p class="about-copy">© 2026 ForexBonusWhale</p>
  </div>
</div>`;
}

// ════════════════════════════════════════════════════════════
//  RENDER: ADMIN
// ════════════════════════════════════════════════════════════
function renderAdminForm() {
  const b=S.adminEdit||{};
  return `
<div id="admin-form-card" class="detail-sec-card">
  <div class="dsec-title">${S.adminEdit?t('editBonus'):t('addBonus')}</div>
  ${S.adminMsg?`<div class="success-msg">${esc(S.adminMsg)}</div>`:''}
  <form id="admin-form" onsubmit="handleAdminSubmit(event)">
    <div class="form-grid">
      <div class="form-field">
        <label class="form-label">Broker Name *</label>
        <input class="form-input" name="brokerName" value="${esc(b.brokerName||'')}" required/>
      </div>
      <div class="form-field">
        <label class="form-label">Broker ID (unique key)</label>
        <input class="form-input" name="brokerId" value="${esc(b.brokerId||'')}"/>
      </div>

      <div class="form-field" style="grid-column:1/-1">
        <label class="form-label">Broker Logo</label>
        <input class="form-input" id="broker-img-url" name="brokerImageUrl"
          value="${esc(b.brokerImageUrl||'')}" placeholder="https://example.com/logo.png or upload below"
          oninput="previewLogo(this.value)"/>
        <label class="img-upload-label">
          <input type="file" accept="image/*" style="display:none"
            onchange="uploadImage(this,'broker-img-url','logo-preview')"/>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Upload image file
        </label>
        <div id="logo-preview" style="margin-top:4px">
          ${b.brokerImageUrl?`<img src="${esc(b.brokerImageUrl)}" style="width:52px;height:52px;object-fit:contain;border-radius:10px;border:1px solid var(--border)" onerror="this.style.display='none'"/>`:''}
        </div>
      </div>

      <div class="form-field">
        <label class="form-label">Bonus Title *</label>
        <input class="form-input" name="title" value="${esc(b.title||'')}" required/>
      </div>
      <div class="form-field">
        <label class="form-label">Amount (e.g. 50)</label>
        <input class="form-input" name="amount" value="${esc(b.amount||'')}"/>
      </div>
      <div class="form-field">
        <label class="form-label">Bonus Type</label>
        <select class="form-input" name="type">
          <option value="deposit"${(b.type||'deposit')==='deposit'?' selected':''}>Deposit</option>
          <option value="no-deposit"${b.type==='no-deposit'?' selected':''}>No Deposit</option>
          <option value="contest"${b.type==='contest'?' selected':''}>Contest</option>
        </select>
      </div>
      <div class="form-field">
        <label class="form-label">Status</label>
        <select class="form-input" name="status">
          <option value="active"${(b.status||'active')==='active'?' selected':''}>Active</option>
          <option value="inactive"${b.status==='inactive'?' selected':''}>Inactive</option>
        </select>
      </div>
      <div class="form-field">
        <label class="form-label">Bonus Expiry Date (auto-expires on this date)</label>
        <input class="form-input" type="date" name="bonusExpiry" value="${esc(b.bonusExpiry||'')}"/>
      </div>
      <div class="form-field">
        <label class="form-label">Regulation (e.g. CySEC, FCA)</label>
        <input class="form-input" name="regulation" value="${esc(b.regulation||'')}"/>
      </div>
      <div class="form-field">
        <label class="form-label">Country</label>
        <input class="form-input" name="country" value="${esc(b.country||'')}"/>
      </div>
      <div class="form-field">
        <label class="form-label">Min. Deposit (e.g. $0)</label>
        <input class="form-input" name="minDeposit" value="${esc(b.minDeposit||'')}"/>
      </div>
      <div class="form-field">
        <label class="form-label">Max. Deposit (e.g. $10,000)</label>
        <input class="form-input" name="maxDeposit" value="${esc(b.maxDeposit||'')}"/>
      </div>
      <div class="form-field">
        <label class="form-label">Max. Bonus (e.g. $500)</label>
        <input class="form-input" name="maxBonus" value="${esc(b.maxBonus||'')}"/>
      </div>
      <div class="form-field">
        <label class="form-label">Rating (0–5)</label>
        <input class="form-input" type="number" name="rating" min="0" max="5" step="0.1" value="${esc(b.rating??4.5)}"/>
      </div>
      <div class="form-field">
        <label class="form-label">Reviews count</label>
        <input class="form-input" type="number" name="reviews" min="0" value="${esc(b.reviews??0)}"/>
      </div>
      <div class="form-field">
        <label class="form-label">Views count</label>
        <input class="form-input" type="number" name="views" min="0" value="${esc(b.views??0)}"/>
      </div>
      <div class="form-field">
        <label class="form-label">Claim URL</label>
        <input class="form-input" name="claimUrl" value="${esc(b.claimUrl||'')}"/>
      </div>

      <div class="form-field">
        <label class="form-label">Bonus Image URL (fills card width)</label>
        <input class="form-input" id="bonus-img-url" name="imageUrl"
          value="${esc(b.imageUrl||'')}" placeholder="https://example.com/image.png or upload below"/>
        <label class="img-upload-label">
          <input type="file" accept="image/*" style="display:none"
            onchange="uploadImage(this,'bonus-img-url','bonus-img-preview')"/>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Upload image file
        </label>
        <div id="bonus-img-preview" style="margin-top:4px">
          ${b.imageUrl?`<img src="${esc(b.imageUrl)}" style="width:52px;height:52px;object-fit:contain;border-radius:10px;border:1px solid var(--border)" onerror="this.style.display='none'"/>`:''}
        </div>
      </div>

      <div class="form-field" style="display:flex;flex-direction:row;align-items:center;gap:8px;margin-top:4px">
        <input type="checkbox" id="chk-verified" name="verified" style="width:16px;height:16px;cursor:pointer" ${b.verified?'checked':''}/>
        <label for="chk-verified" class="form-label" style="margin:0;cursor:pointer;font-size:13px">Verified Broker</label>
      </div>
    </div>
    <div class="form-field" style="margin-top:10px">
      <label class="form-label">Description</label>
      <textarea class="form-input" name="description" rows="3">${esc(b.description||'')}</textarea>
    </div>
    <div class="form-field">
      <label class="form-label">Terms &amp; Conditions</label>
      <textarea class="form-input" name="terms" rows="3">${esc(b.terms||'')}</textarea>
    </div>
    <div class="form-field">
      <label class="form-label">How to Claim / Requirements (one step per line)</label>
      <textarea class="form-input" name="steps" rows="4">${esc((b.howToClaimSteps||[]).join('\n'))}</textarea>
    </div>
    <div style="display:flex;gap:10px;margin-top:14px">
      <button type="submit" class="submit-btn" ${S.adminSaving?'disabled':''}>
        ${S.adminSaving?'Saving…':S.adminEdit?'Update Bonus':'Add Bonus'}
      </button>
      ${S.adminEdit?`<button type="button" class="cancel-btn" data-action="admin-cancel">Cancel</button>`:''}
    </div>
  </form>
</div>`;
}

function renderAdmin() {
  return `
<div class="page-content">
  <div class="admin-title">${esc(t('adminPanel'))}</div>
  ${renderAdminForm()}
  <div style="margin-top:20px">
    <div class="dsec-title" style="margin-bottom:12px">${esc(t('allBonuses'))} (${S.bonuses.length})</div>
    ${S.bonuses.length===0?`<p class="state-msg" style="padding:16px 0">No bonuses yet.</p>`:''}
    ${S.bonuses.map(b=>`
    <div class="admin-bonus-row">
      <div style="flex:1;font-size:13px;min-width:0">
        <strong>${esc(b.brokerName)}</strong> — ${esc(b.title)} (${amt(b.amount)})
        <span class="meta-muted"> [${esc(b.type)}]</span>
        ${b.bonusExpiry?`<span class="meta-muted"> exp:${esc(formatExpiry(b.bonusExpiry))}</span>`:''}
        ${b.verified?`<span class="verified-badge" style="margin-left:6px;font-size:10px">✓</span>`:''}
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        <button class="icon-btn edit-btn" data-action="admin-edit" data-id="${esc(b.id)}" title="Edit">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="icon-btn del-btn" data-action="admin-del" data-id="${esc(b.id)}" title="Delete">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
      </div>
    </div>`).join('')}
  </div>
</div>`;
}

// ════════════════════════════════════════════════════════════
//  RENDER: FOOTER — icons in quick links, updated contact text
// ════════════════════════════════════════════════════════════
function renderFooter() {
  const langButtons = Object.entries(LANGS).map(([code,l])=>`
    <button class="lang-flag-btn${S.lang===code?' lang-flag-btn-active':''}"
      data-action="lang-set" data-lang="${code}" title="${l.label}">
      <span class="lang-flag-emoji">${l.flag}</span>
      <span>${l.label}</span>
    </button>`).join('');

  return `
<footer class="footer">
  <div class="footer-inner">
    <button class="logo-btn" style="margin-bottom:10px" data-action="nav" data-sec="deposit">
      <img src="favicon.svg" width="22" height="22" alt="whale"/>
      <span class="logo-text">ForexBonusWhale</span>
    </button>
    <p class="footer-tag">${esc(t('footerTag'))}</p>
    <div class="footer-bottom-row">
      <div class="footer-links">
        <span class="footer-links-hdr">${esc(t('quickLinks'))}</span>
        ${NAV_ITEMS.map(item=>`
        <button class="footer-link" data-action="nav" data-sec="${item.id}">
          <span class="footer-link-icon">${NAV_ICONS[item.id]||''}</span>
          ${esc(t(item.key))}
        </button>`).join('')}
      </div>
      <div class="lang-section">
        <div class="lang-section-hdr">${esc(t('languages'))}</div>
        <div class="lang-flags">${langButtons}</div>
      </div>
    </div>
    <div class="footer-divider"></div>
    <p class="footer-contact-hdr">${esc(t('contact'))}</p>
    <p class="footer-contact-sub">Have a bonus to list or found incorrect information? <a href="mailto:forexbonuswhale@gmail.com" class="link-email">forexbonuswhale@gmail.com</a></p>
    <p class="footer-copy">© 2026 ForexBonusWhale</p>
    <p class="footer-disc">Trading Forex involves significant risk. Content is for informational purposes only.</p>
  </div>
</footer>`;
}

// ════════════════════════════════════════════════════════════
//  LOGO PREVIEW HELPER
// ════════════════════════════════════════════════════════════
function previewLogo(url) {
  const el=document.getElementById('logo-preview');
  if(!el) return;
  if(!url){el.innerHTML='';return;}
  el.innerHTML=`<img src="${esc(url)}" style="width:52px;height:52px;object-fit:contain;border-radius:10px;border:1px solid var(--border);margin-top:4px" onerror="this.style.display='none'"/>`;
}

// ════════════════════════════════════════════════════════════
//  MAIN RENDER
// ════════════════════════════════════════════════════════════
function render() {
  document.documentElement.className = S.theme;
  const bonus = S.selectedId ? S.bonuses.find(b=>b.id===S.selectedId) : null;
  let mainHTML = '';
  if (S.selectedId)             mainHTML = renderDetail(bonus);
  else if (S.section==='about') mainHTML = renderAbout();
  else if (S.section==='admin') mainHTML = renderAdmin();
  else                          mainHTML = renderList();

  document.getElementById('app').innerHTML =
    renderHeader() +
    (S.menuOpen ? renderMenu() : '') +
    `<main>${mainHTML}</main>` +
    renderFooter() +
    `<button style="position:fixed;bottom:8px;right:8px;width:40px;height:40px;opacity:0;z-index:999"
      data-action="nav" data-sec="admin" aria-hidden="true"></button>`;

  if (S.selectedId) {
    showReviews();
    if (S.lang !== 'en' && bonus) translateDetailFields(bonus);
  }
  if (!S.selectedId && S.section !== 'about' && S.section !== 'admin' && S.lang !== 'en') {
    translateCardTitles();
  }
}

// ════════════════════════════════════════════════════════════
//  EVENT DELEGATION
// ════════════════════════════════════════════════════════════
document.addEventListener('click', function(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) {
    if (S.sortOpen||S.secOpen) { S.sortOpen=false; S.secOpen=false; render(); }
    return;
  }
  const action = btn.dataset.action;

  if      (action==='nav')         { navigate(btn.dataset.sec); }
  else if (action==='menu-toggle') { S.menuOpen=!S.menuOpen; render(); }
  else if (action==='menu-close')  { S.menuOpen=false; render(); }
  else if (action==='theme')       {
    S.theme=S.theme==='dark'?'light':'dark';
    localStorage.setItem('fbw_theme',S.theme);
    render();
  }
  else if (action==='lang-set')    {
    S.lang=btn.dataset.lang;
    localStorage.setItem('fbw_lang',S.lang);
    render();
  }
  else if (action==='back')           { goBack(); }
  else if (action==='copy-link')      {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(()=>{
      const el=document.getElementById('copy-link-btn');
      if(el){el.classList.add('copied');el.innerHTML='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Copied!';}
      setTimeout(()=>{const el2=document.getElementById('copy-link-btn');if(el2){el2.classList.remove('copied');el2.innerHTML='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Copy Link';}},2000);
    }).catch(()=>{ try{const ta=document.createElement('textarea');ta.value=url;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);}catch(e){} });
  }
  else if (action==='view')           { viewDetails(btn.dataset.id); }
  else if (action==='filter')         { S.filter=btn.dataset.val; S.bonusPage=0; S.sortOpen=false; S.secOpen=false; render(); }
  else if (action==='sort-toggle')    { S.sortOpen=!S.sortOpen; S.secOpen=false; render(); }
  else if (action==='sort-set')       {
    S.sort=btn.dataset.val;
    S.bonusPage=0; S.sortOpen=false;
    localStorage.setItem('fbw_sort', S.sort);
    render();
  }
  else if (action==='bonus-page')     { S.bonusPage=+btn.dataset.val; render(); window.scrollTo({top:0,behavior:'smooth'}); }
  else if (action==='sec-toggle')     { S.secOpen=!S.secOpen; S.sortOpen=false; render(); }
  else if (action==='claim')           {
    const claimId=btn.dataset.id;
    const claimUrl=btn.dataset.url;
    const claimBonus=S.bonuses.find(b=>b.id===claimId);
    if(claimBonus){
      const n=(+claimBonus.claimCount||0)+1;
      claimBonus.claimCount=n;
      fbPatch(`/bonuses/${claimId}`,{claimCount:n});
      const countEl=btn.nextElementSibling;
      if(countEl&&countEl.tagName==='P') countEl.textContent=`🔥 ${fmt(n)} traders claimed this bonus`;
      else { const p=document.createElement('p'); p.style.cssText='text-align:center;font-size:11px;color:var(--text3);margin-top:6px'; p.textContent=`🔥 ${fmt(n)} traders claimed this bonus`; btn.after(p); }
    }
    if(claimUrl) window.open(claimUrl,'_blank','noopener,noreferrer');
  }
  else if (action==='rev-page')        {
    S.revPage=+btn.dataset.val;
    showReviews();
    const revEl=document.getElementById('reviews-list');
    if(revEl) revEl.scrollIntoView({behavior:'smooth',block:'start'});
  }
  else if (action==='set-star')        {
    S.revRating = +btn.dataset.val;
    const container = document.getElementById('rev-stars');
    if (container) container.querySelectorAll('.star-inp').forEach(b => {
      b.classList.toggle('sel', +b.dataset.val <= S.revRating);
    });
  }
  else if (action==='del-review')     {
    const bid=btn.dataset.bid, rid=btn.dataset.rid;
    if(confirm('Delete your review? This cannot be undone.')) {
      S.reviews=S.reviews.filter(r=>r.id!==rid);
      clearMyReview(bid);
      const bonus=S.bonuses.find(b=>b.id===bid);
      if(bonus&&+bonus.reviews>0){ bonus.reviews=+bonus.reviews-1; }
      const revSection=document.getElementById('user-reviews-section');
      if(revSection) revSection.innerHTML=renderReviewsSection(bid);
      showReviews();
      fbDelete(`/reviews/${bid}/${rid}`);
      if(bonus) updateBonus(bid,{reviews:+bonus.reviews});
    }
  }
  else if (action==='submit-review')  { submitReview(btn.dataset.bid); }
  else if (action==='admin-edit')     {
    S.adminEdit=S.bonuses.find(b=>b.id===btn.dataset.id)||null;
    window.scrollTo({top:0,behavior:'smooth'});
    render();
  }
  else if (action==='admin-cancel')   { S.adminEdit=null; render(); }
  else if (action==='admin-del')      {
    if(confirm('Delete this bonus?')){
      deleteBonus(btn.dataset.id).then(()=>refreshBonuses());
    }
  }
});

// ════════════════════════════════════════════════════════════
//  HISTORY-MODE ROUTING (HTML5 pushState — no hash)
// ════════════════════════════════════════════════════════════
function parsePath() {
  const p = window.location.pathname;
  if      (p.startsWith('/bonus/')) { S.selectedId=p.replace('/bonus/',''); }
  else if (p==='/deposit' || p==='/' || p==='') { S.section='deposit';    S.selectedId=null; }
  else if (p==='/no-deposit')       { S.section='no-deposit'; S.selectedId=null; }
  else if (p==='/contest')          { S.section='contest';    S.selectedId=null; }
  else if (p==='/about')            { S.section='about';      S.selectedId=null; }
  else if (p==='/admin')            { S.section='admin';      S.selectedId=null; }
  else                              { S.section='deposit';    S.selectedId=null; }
}

window.addEventListener('popstate', ()=>{
  parsePath();
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
(async()=>{try{const r=await fetch('https://api.country.is/');const d=await r.json();S.userCountry=d.country||'';}catch(e){}})();

parsePath();
render();
loadBonuses().then(list=>{
  S.bonuses=list;
  S.loading=false;
  render();
  if(S.selectedId){
    fetchAndShowReviews(S.selectedId);
    const bonus=S.bonuses.find(b=>b.id===S.selectedId);
    if(bonus) incrementViews(S.selectedId,+bonus.views||0).then(v=>{if(bonus)bonus.views=v;});
  }
  // Seed test expiry bonus (runs once, only if it doesn't exist)
  seedTestExpiryBonus();
});
