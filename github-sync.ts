import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const FIREBASE_URL =
  process.env.FIREBASE_URL ||
  "https://froexbonuswhale-default-rtdb.firebaseio.com";
const GITHUB_TOKEN =
  process.env.GITHUB_PERSONAL_ACCESS_TOKEN || process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER || "forexbonuswhale";
const GITHUB_REPO =
  process.env.GITHUB_REPO || "forexbonuswhale.github.io";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";
const BASE_URL =
  process.env.SITE_BASE_URL || "https://forexbonuswhale.github.io";

interface Bonus {
  id: string;
  type?: string;
  status?: string;
  bonusExpiry?: string;
  createdAt?: number;
  [key: string]: unknown;
}

async function fetchBonuses(): Promise<Bonus[]> {
  const res = await fetch(`${FIREBASE_URL}/bonuses.json`);
  const data = (await res.json()) as Record<
    string,
    Omit<Bonus, "id">
  > | null;
  if (!data || typeof data !== "object") return [];
  return Object.entries(data).map(([id, v]) => ({ id, ...v }));
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0]!;
}

function bonusLastMod(b: Bonus): string {
  if (b.createdAt) {
    try {
      return new Date(+b.createdAt).toISOString().split("T")[0]!;
    } catch {
      // fall through
    }
  }
  return todayISO();
}

function generateSitemap(bonuses: Bonus[]): string {
  const today = todayISO();

  const staticUrls = [
    {
      loc: `${BASE_URL}/`,
      changefreq: "daily",
      priority: "1.0",
      lastmod: today,
    },
    {
      loc: `${BASE_URL}/deposit`,
      changefreq: "daily",
      priority: "0.9",
      lastmod: today,
    },
    {
      loc: `${BASE_URL}/no-deposit`,
      changefreq: "daily",
      priority: "0.9",
      lastmod: today,
    },
    {
      loc: `${BASE_URL}/contest`,
      changefreq: "daily",
      priority: "0.9",
      lastmod: today,
    },
  ];

  const bonusUrls = bonuses.map((b) => ({
    loc: `${BASE_URL}/bonus/${b.id}`,
    changefreq: "weekly",
    priority: "0.8",
    lastmod: bonusLastMod(b),
  }));

  const allUrls = [...staticUrls, ...bonusUrls];

  const urlEntries = allUrls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

async function pushFileToGitHub(
  content: string,
  filePath: string,
  commitMessage: string
): Promise<void> {
  if (!GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN is not configured");
  }

  const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };

  // Get current file SHA (required for updates; omit for brand-new files)
  let sha: string | undefined;
  try {
    const getRes = await fetch(`${apiUrl}?ref=${GITHUB_BRANCH}`, { headers });
    if (getRes.ok) {
      const fileData = (await getRes.json()) as { sha?: string };
      sha = fileData.sha;
    }
  } catch {
    // File may not exist yet — that's fine
  }

  const contentBase64 = Buffer.from(content, "utf-8").toString("base64");
  const body: Record<string, unknown> = {
    message: commitMessage,
    content: contentBase64,
    branch: GITHUB_BRANCH,
  };
  if (sha) body.sha = sha;

  const putRes = await fetch(apiUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });

  if (!putRes.ok) {
    const errText = await putRes.text();
    throw new Error(`GitHub API error ${putRes.status}: ${errText}`);
  }
}

// POST /api/github-sync
// Called by the admin panel after every add / edit / delete bonus operation.
// 1. Fetches all current bonuses from Firebase.
// 2. Regenerates sitemap.xml.
// 3. Commits & pushes the new sitemap.xml to GitHub.
router.post("/github-sync", async (req, res): Promise<void> => {
  req.log.info("GitHub sync triggered");

  try {
    const bonuses = await fetchBonuses();
    req.log.info({ count: bonuses.length }, "Fetched bonuses from Firebase");

    const sitemap = generateSitemap(bonuses);
    const timestamp = new Date().toISOString();
    await pushFileToGitHub(
      sitemap,
      "sitemap.xml",
      `chore: regenerate sitemap.xml — ${bonuses.length} bonus(es) [${timestamp}]`
    );

    req.log.info("Successfully pushed sitemap.xml to GitHub");
    res.json({ ok: true, bonusCount: bonuses.length, timestamp });
  } catch (err) {
    req.log.error({ err }, "GitHub sync failed");
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// GET /api/github-sync/status — quick health check for the sync endpoint
router.get("/github-sync/status", (_req, res): void => {
  res.json({
    ok: true,
    configured: !!GITHUB_TOKEN,
    repo: `${GITHUB_OWNER}/${GITHUB_REPO}`,
    branch: GITHUB_BRANCH,
    firebaseUrl: FIREBASE_URL,
  });
});

export default router;
