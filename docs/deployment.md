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

## The contact form (Pass 6)

The form works as soon as the site deploys, but until these steps are done messages are stored in D1 and not forwarded, and there is no Turnstile check (honeypot and rate limit still apply). Do them in this order. Every value is typed at a prompt or into a dashboard, never into a file or a message.

### 4. Turnstile

1. Cloudflare dashboard > **Turnstile > Add widget**. Name it "joshlennon.com contact", mode **Managed**.
2. Hostnames: `joshlennon.com` and your `joshlennon-site.<subdomain>.workers.dev` while the site lives there.
3. Copy the **site key** (public) and the **secret key** (secret).
4. GitHub: **Settings > Secrets and variables > Actions > Variables > New repository variable**: `PUBLIC_TURNSTILE_SITE_KEY` = the site key. It is public by design and built into the page.
5. Set the secret key on the Worker (step 6 below) **in the same sitting**: a secret without the widget refuses every message, and the widget without the secret is not checked.

### 5. Make.com

Follow [`make-com.md`](make-com.md): a new webhook, the shared-secret filter, the Sheet and the email. You end with the webhook address and the shared secret.

### 6. Worker secrets

From `apps/edge`, after `pnpm exec wrangler login` (see "Running Wrangler" below), run each command and paste the value when asked:

```bash
pnpm exec wrangler secret put TURNSTILE_SECRET_KEY   # the Turnstile secret key
pnpm exec wrangler secret put MAKE_WEBHOOK_URL       # the Make.com webhook address
pnpm exec wrangler secret put MAKE_WEBHOOK_SECRET    # the shared secret from make-com.md step 3
pnpm exec wrangler secret put RATE_LIMIT_SALT        # any long random value
```

For the two random values, a password manager's generator works, or in PowerShell:

```powershell
[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Secrets take effect immediately; no redeploy is needed. Run a deploy anyway after setting `PUBLIC_TURNSTILE_SITE_KEY`, so the page includes the widget. Then send yourself a message from `/contact`: it should reach the Sheet and your inbox, with the reference the success screen showed. [`data-protection.md`](data-protection.md) shows how to check what is stored.

## GitHub on the homepage (Pass 8)

The homepage's GitHub calendar comes from a snapshot in the repository until this is set; with it, every deploy (including the daily one) fetches fresh data.

### 7. A read-only GitHub token

1. GitHub > **Settings > Developer settings > Personal access tokens > Fine-grained tokens > Generate new token**.
2. Name it "joshlennon.com build", expiry up to a year, **Repository access: Public repositories (read-only)**. No other permissions are needed.
3. Copy the token, then in **awkwardapples/Portfolio > Settings > Secrets and variables > Actions > New repository secret** add `GH_PROFILE_TOKEN` with it (or `gh secret set GH_PROFILE_TOKEN --repo awkwardapples/Portfolio`).
4. The repositories the homepage lists are chosen in `profile.yaml` (`githubRepos`), not by pinning.

## The domain and launch (Pass 10)

Do these once the site is live on `workers.dev` (step 3). Each step ends with a check.

### 8. Put joshlennon.com on Cloudflare

1. Cloudflare dashboard > **Add a domain** > `joshlennon.com` > the Free plan. If the domain was bought through Cloudflare Registrar it is already there; go to step 9.
2. Cloudflare shows two nameservers. At the registrar where the domain is registered, replace its nameservers with those two.
3. If Cloudflare imported DNS records for an old host, delete the `A`, `AAAA` and `CNAME` records for `joshlennon.com` and `www`; step 9 cannot attach the domain while they exist.
4. Check: the domain's overview page says **Active** (this can take from minutes to a day).

### 9. Attach the domain to the Worker

1. **Workers & Pages > joshlennon-site > Settings > Domains & Routes > Add > Custom domain**: `joshlennon.com`. Cloudflare creates the DNS record and the certificate.
2. Check: `https://joshlennon.com` shows the site and `https://joshlennon.com/api/health` returns `{"status":"ok"}`.

### 10. Send www to the apex

1. **DNS > Records > Add record**: type `AAAA`, name `www`, IPv6 address `100::`, proxy status **Proxied**. The address is a placeholder; Cloudflare answers for it.
2. **Rules > Redirect Rules > Create rule**, from the template **Redirect from WWW to root**. Use status 301 and keep the query string.
3. Check: `https://www.joshlennon.com/work` ends at `https://joshlennon.com/work`.

### 11. Switch off the workers.dev address

Spec S asks for one address, so once steps 9 and 10 work the `workers.dev` copy goes. Tell Claude "the domain is live", or make this change in `apps/edge/wrangler.jsonc` yourself and merge it to `main`:

```jsonc
  "routes": [{ "pattern": "joshlennon.com", "custom_domain": true }],
  "workers_dev": false,
```

The routes line records in the repository the domain you attached in step 9, so a deploy never detaches it. Check: after the deploy, the `workers.dev` address no longer serves the site and `joshlennon.com` still does. Then remove the `workers.dev` hostname from the Turnstile widget (step 4).

### 12. Search engines (optional)

1. Google Search Console > **Add property > Domain** `joshlennon.com`, verified with the TXT record (Cloudflare can add it for you). Then **Sitemaps** > `https://joshlennon.com/sitemap-index.xml`. Bing Webmaster Tools can import the property from Search Console.
2. Run `/`, `/about` and `/work/kerr-microscopy-dissertation` through Google's Rich Results Test and validator.schema.org. The browser tests already check the structured data against schema.org's definitions; these confirm it on the live pages.

### 13. The old domain

If `superdan1505.com` stays registered, replace the GitHub Pages site behind it with one page that links to `https://joshlennon.com`, so old links do not dead-end (spec S). Claude can make that page in the repository that serves it.

### 14. Visitor counts (optional)

Cloudflare Web Analytics is cookieless (spec P.2). First add it to `/privacy`, which says the site runs no analytics. Then **Analytics & Logs > Web Analytics > Add a site**. The Content Security Policy already allows its two hosts (ADR-0048).

## Running Wrangler on your machine

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
