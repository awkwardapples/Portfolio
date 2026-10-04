# Deployment

How the portfolio reaches the internet, and the one-time steps only Josh can do. The architecture is in [ADR-0040](decisions/0040-cloudflare-hosting-and-deploy.md).

## How a deploy happens

Every push to `main` runs `.github/workflows/deploy.yml`:

1. **Preflight.** If the `CLOUDFLARE_API_TOKEN` or `CLOUDFLARE_ACCOUNT_ID` repository secret is missing, the deploy is skipped and the run summary says "Deploy skipped". The run still passes.
2. **Build.** `pnpm build` builds the wizard, the site and a dry run of the Worker.
3. **Database.** On the first deploy the workflow creates the D1 database `joshlennon-site` in Western Europe. After that it finds it by name.
4. **Migrations.** `wrangler d1 migrations apply DB --remote` applies any new files in `apps/edge/migrations/`.
5. **Deploy.** `wrangler deploy` uploads the Worker and the site's files.

The same workflow runs once a day (to refresh the GitHub data from Pass 8) and can be started by hand: **Actions > Deploy > Run workflow**, or `gh workflow run Deploy --repo awkwardapples/Portfolio`.

## One-time set-up (Josh)

### 1. Cloudflare account and workers.dev subdomain

1. Sign in to the Cloudflare dashboard (create a free account if needed).
2. Open **Workers & Pages** once. The first visit asks you to choose a `workers.dev` subdomain; choose one (for example `joshlennon`). Deploys fail until this exists.
3. Copy your **Account ID** from the right-hand side of the Workers & Pages overview (or **Account Home > Account details**).

### 2. API token for GitHub Actions

1. **My Profile > API Tokens > Create Token**, and start from the **Edit Cloudflare Workers** template.
2. Add one more permission: **Account > D1 > Edit**.
3. Under **Account Resources**, select your account. Under **Zone Resources**, select **All zones** (or just `joshlennon.com` once the domain is on Cloudflare).
4. Create the token and copy it. It is shown once.

### 3. Repository secrets

In GitHub: **awkwardapples/Portfolio > Settings > Secrets and variables > Actions > New repository secret**:

| Name                    | Value                      |
| ----------------------- | -------------------------- |
| `CLOUDFLARE_API_TOKEN`  | the token from step 2      |
| `CLOUDFLARE_ACCOUNT_ID` | the Account ID from step 1 |

Or from a terminal, pasting each value when asked:

```bash
gh secret set CLOUDFLARE_API_TOKEN --repo awkwardapples/Portfolio
gh secret set CLOUDFLARE_ACCOUNT_ID --repo awkwardapples/Portfolio
```

Then start a deploy (**Actions > Deploy > Run workflow**). When it finishes, `https://joshlennon-site.<your-subdomain>.workers.dev/api/health` should return `{"status":"ok"}`.

## Needed in later passes

These are listed here so they can be done in one sitting; the passes that need them say so when they arrive.

| When    | What                                                                                                                                                             | How                                                                                       |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Pass 6  | A Turnstile widget for `joshlennon.com` (add the `workers.dev` hostname too while the site lives there)                                                          | Dashboard > Turnstile > Add widget; mode "Managed"                                        |
| Pass 6  | The widget's site key as a repository **variable** `PUBLIC_TURNSTILE_SITE_KEY` (it is public by design)                                                          | Settings > Secrets and variables > Actions > Variables                                    |
| Pass 6  | Worker secrets `MAKE_WEBHOOK_URL`, `MAKE_WEBHOOK_SECRET`, `TURNSTILE_SECRET_KEY`, `RATE_LIMIT_SALT`                                                              | `wrangler secret put <NAME>` from `apps/edge` (see below); paste each value at the prompt |
| Pass 6  | The Make.com scenario changes (secret filter, new Sheet columns, email instead of WhatsApp)                                                                      | Step-by-step in `docs/data-protection.md` (written in Pass 6)                             |
| Pass 8  | `GH_PROFILE_TOKEN`: a fine-grained personal access token with read-only access to public repositories, as a repository **secret**                                | GitHub > Settings > Developer settings > Fine-grained tokens                              |
| Pass 10 | The domain `joshlennon.com` on Cloudflare, attached to the Worker as a custom domain, `www` redirected to the apex, and Email Routing for `hello@joshlennon.com` | Steps in this file, added in Pass 10                                                      |

### Running Wrangler on your machine

The repository needs Node 24 (Astro 7 and Wrangler 4 require Node 22.12 or newer). With nvm for Windows:

```bash
nvm install 24.21.0
nvm use 24.21.0
corepack enable pnpm
pnpm install
cd apps/edge
pnpm exec wrangler login
pnpm exec wrangler secret put MAKE_WEBHOOK_URL
```

Secret values are typed at the prompt and go straight to Cloudflare. They never belong in a file, a commit, a test or a chat message.
