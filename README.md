

## TSP Fund Tracker public handoff

This project is a **public, read-only TSP fund glance app**. Visitors can open the dashboard without signing in. Official daily share prices are sourced from TSP.gov, while the intraday panel provides clearly labeled estimates based on market proxies; the G Fund carries forward its latest official close between daily updates. Theme selection is stored locally on the visitor's device, and the service worker provides the app shell and cached-data fallback when offline.

### Export this project to GitHub from Manus

1. Open the project's **Management UI**.
2. Open **Settings → GitHub**.
3. Choose the GitHub owner/account and enter the destination repository name.
4. Confirm the export. Manus will create or update the selected repository with the current project code.
5. In GitHub, review the exported files and repository visibility, then add any branch protections or collaborators you need.

If you prefer a file-based handoff, use the **⋯ menu → Download as ZIP**, extract the archive locally, initialize a Git repository, and push it to a repository that you create on GitHub:

```bash
git init
git add .
git commit -m "Initial TSP Fund Tracker PWA"
git branch -M main
git remote add origin https://github.com/<owner>/<repository>.git
git push -u origin main
```

### Run locally after export

Use Node.js 22 or a compatible current Node.js release and pnpm:

```bash
pnpm install
pnpm dev
```

The application expects the project environment to provide the configured database and server environment variables. Do not commit `.env` files or credentials. For a production handoff, run `pnpm test`, `pnpm check`, and `pnpm build` before publishing through the hosting workflow.

### Data and attribution notes

The app should retain its source labels for **TSP.gov official data** and **Nasdaq market-proxy estimates**. Intraday values are estimates rather than official TSP share prices and should not be represented as an official TSP.gov quote.

### Current validation

The public-access router boundary, TSP synchronization behavior, MACD and momentum calculations, intraday estimation logic, and offline-related support code are covered by the project's Vitest suite. The latest validation completed with 32 passing tests, a clean TypeScript check, and a successful production build.

> Before sharing a deployment publicly, open the published URL in a private/incognito window and confirm that the dashboard loads without a login prompt, the official data timestamp is visible, and unavailable upstream data is presented as a safe status rather than as fabricated values.


### GitHub Pages deployment

The repository includes a static `docs/` bundle for GitHub Pages and a root `CNAME` file containing `TSPFundTracker.com`. To rebuild the Pages bundle after source changes, run:

```bash
pnpm install
pnpm build:pages
git add .
git commit -m "Build GitHub Pages site"
git push origin main
```

In GitHub, open **Settings → Pages**, select **Deploy from a branch**, choose `main`, select the `/docs` folder, and save. Set the custom domain to `TSPFundTracker.com` and enable HTTPS after GitHub reports that the domain is verified.

For an apex domain, configure the DNS provider with these GitHub Pages `A` records:

| Host | Type | Value |
| --- | --- | --- |
| `@` | A | `185.199.108.153` |
| `@` | A | `185.199.109.153` |
| `@` | A | `185.199.110.153` |
| `@` | A | `185.199.111.153` |

If you also want `www.TSPFundTracker.com`, add a `CNAME` record for `www` pointing to `mnucer.github.io`, then configure the preferred canonical domain in GitHub Pages. DNS propagation and HTTPS certificate issuance can take time after the records are saved.

The GitHub Pages bundle is static. It contains the public client and cached app shell, but the full tRPC/database server is not hosted by GitHub Pages. If live synchronization and intraday refreshes are required on the Pages domain, the API server must remain available at a compatible public origin and the client must be configured to use that API origin; otherwise, use the Manus deployment for the complete full-stack experience.
