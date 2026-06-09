#!/usr/bin/env node
/**
 * generate-sitemap.js
 *
 * Fetches all bonuses from Firebase and pushes an updated sitemap.xml
 * directly to GitHub using the GitHub Contents API.
 *
 * Run automatically by GitHub Actions — no npm install required,
 * no extra packages, plain Node.js 18+ (uses built-in fetch).
 *
 * Environment variables (all provided automatically by GitHub Actions):
 *   PAT_TOKEN          — Fine-grained PAT secret with Contents: write on this repo
 *   GITHUB_REPOSITORY  — "owner/repo" (e.g. forexbonuswhale/forexbonuswhale.github.io)
 */

'use strict';

const FIREBASE_URL = 'https://froexbonuswhale-default-rtdb.firebaseio.com';
const SITE_URL     = 'https://forexbonuswhale.github.io';
const GITHUB_TOKEN = process.env.PAT_TOKEN || process.env.GITHUB_TOKEN;
const REPO         = process.env.GITHUB_REPOSITORY || 'forexbonuswhale/forexbonuswhale.github.io';
const [GH_OWNER, GH_REPO] = REPO.split('/');
const GH_BRANCH    = 'main';

// ── 1. Fetch bonuses ──────────────────────────────────────────────────────────
async function fetchBonuses() {
  const res = await fetch(`${FIREBASE_URL}/bonuses.json`);
  if (!res.ok) throw new Error(`Firebase returned HTTP ${res.status}`);
  const data = await res.json();
  if (!data || typeof data !== 'object') return [];
  return Object.entries(data).map(([id, v]) => ({ id, ...v }));
}

// ── 2. Generate sitemap XML ───────────────────────────────────────────────────
function generateSitemap(bonuses) {
  const today = new Date().toISOString().split('T')[0];

  const staticPages = [
    { loc: SITE_URL + '/',           lastmod: today, changefreq: 'daily',  priority: '1.0' },
    { loc: SITE_URL + '/deposit',    lastmod: today, changefreq: 'daily',  priority: '0.9' },
    { loc: SITE_URL + '/no-deposit', lastmod: today, changefreq: 'daily',  priority: '0.9' },
    { loc: SITE_URL + '/contest',    lastmod: today, changefreq: 'daily',  priority: '0.9' },
  ];

  const bonusPages = bonuses.map(b => {
    let lastmod = today;
    try { if (b.createdAt) lastmod = new Date(+b.createdAt).toISOString().split('T')[0]; } catch (e) {}
    return { loc: `${SITE_URL}/bonus/${b.slug || b.id}`, lastmod, changefreq: 'weekly', priority: '0.8' };
  });

  const allPages = [...staticPages, ...bonusPages];

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    allPages.map(u =>
      `  <url>\n` +
      `    <loc>${u.loc}</loc>\n` +
      `    <lastmod>${u.lastmod}</lastmod>\n` +
      `    <changefreq>${u.changefreq}</changefreq>\n` +
      `    <priority>${u.priority}</priority>\n` +
      `  </url>`
    ).join('\n') +
    '\n</urlset>'
  );
}

// ── 3. Push sitemap.xml to GitHub ─────────────────────────────────────────────
async function pushSitemapToGitHub(content) {
  if (!GITHUB_TOKEN) throw new Error('No token available — set PAT_TOKEN secret in repository settings');

  const apiUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/sitemap.xml`;
  const headers = {
    'Authorization': `Bearer ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };

  // GitHub requires the current file SHA to update an existing file
  let sha;
  const getRes = await fetch(`${apiUrl}?ref=${GH_BRANCH}`, { headers });
  if (getRes.ok) {
    sha = (await getRes.json()).sha;
  }

  const body = {
    // [skip ci] prevents this commit from re-triggering the workflow
    message: `chore: regenerate sitemap.xml [skip ci] — ${new Date().toISOString()}`,
    content: Buffer.from(content, 'utf-8').toString('base64'),
    branch: GH_BRANCH,
  };
  if (sha) body.sha = sha;

  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });

  if (!putRes.ok) {
    const err = await putRes.text();
    throw new Error(`GitHub API error ${putRes.status}: ${err}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log('Fetching bonuses from Firebase...');
  const bonuses = await fetchBonuses();
  console.log(`Found ${bonuses.length} bonus(es).`);

  const sitemap = generateSitemap(bonuses);
  console.log('Pushing sitemap.xml to GitHub...');

  await pushSitemapToGitHub(sitemap);
  console.log(`✅ sitemap.xml updated — ${bonuses.length} bonus(es) included.`);
})().catch(err => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});
