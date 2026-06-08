# ForexBonusWhale — Project Files

## What is included

  site/      — Your 8 static files for GitHub Pages (index.js has been updated)
  backend/   — Node.js/Express backend source code

---
## What changed in site/index.js  (3 minimal additions)
---
1. BACKEND_URL constant at the top — set this to your deployed Replit URL.
2. triggerBackendSync() helper — calls POST /api/github-sync silently.
3. Two call-sites: after every add/edit (handleAdminSubmit) and delete (admin-del).

Your UI, design, and all Firebase logic are completely unchanged.

---
## Backend endpoints
---
  POST /api/github-sync
    Called by the admin panel after each bonus change.
    1. Reads all bonuses from Firebase.
    2. Regenerates sitemap.xml with correct URLs and lastmod dates.
    3. Commits and pushes the file to GitHub via the GitHub API.

  GET /api/github-sync/status
    Returns JSON with backend config status.

---
## One-time setup
---
Step 1 - Add GITHUB_TOKEN secret in Replit:
  Secrets tab -> GITHUB_TOKEN = <your GitHub Personal Access Token>
  The token needs Contents:Read+Write on forexbonuswhale/forexbonuswhale.github.io

Step 2 - Update BACKEND_URL in site/index.js:
  Replace  https://YOUR_REPLIT_DOMAIN/api
  with     https://<your-repl-slug>.replit.app/api

Step 3 - Push the updated site/ files to GitHub Pages as usual.

After setup, every add/edit/delete in your admin panel automatically
regenerates and commits sitemap.xml to your GitHub repo.
