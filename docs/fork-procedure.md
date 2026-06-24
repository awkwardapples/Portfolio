# Fork Procedure

How to fork the Quote Wizard template repository for a new client and keep it
synchronized with template updates over time.

**Audience:** A developer (typically the project owner) creating a new client
clone of the template. Assumes comfort with git, pnpm, WordPress, wp-cli,
LocalWP, and the project's conventions.

**Scope:** The mechanical workflow of creating a client clone, deploying it to
LocalWP for development, and pulling subsequent template improvements. Does not
cover client-specific customization (see `docs/adaptation-runbook.md`).

**Reading flow:** Top to bottom for a new fork. Refer to the reference sections
at the end for ongoing operations and pitfalls.

**Last updated:** 2026-06-09

---

## Prerequisites

- Local copy of the canonical template repository.
- Node.js 20.x and pnpm 9.x installed (see `package.json` `engines` field for
  exact versions).
- PHP 8.1 and Composer 2.x installed.
- LocalWP installed and operational.
- wp-cli available in your shell path (LocalWP provides a site shell where `wp`
  is already on the path — use that shell).

---

## Directory layout

The expected layout places the template and all client clones as sibling
directories under a common parent. Example:

```
C:\Agency_Files\Github_Repos\
  ├── handy-man\           ← canonical template (source of truth)
  └── scb-handyman\        ← first client clone
  └── future-client\       ← future clones go here, also sibling-level
```

This sibling layout matters because the procedure configures the template as a
local-path git remote, and sibling-relative paths are easy to manage and
unambiguous when `git clone` is run from the parent directory.

---

## Step 1 — Create the LocalWP site for the new client

In LocalWP, create a new site for the client. Use a hostname matching the
client's intended slug (e.g., `<client-slug>.local`). Default LocalWP settings
are fine; the site does not need any special PHP or MySQL version beyond what
the template requires.

After creation, verify the site is operational via LocalWP's site shell:

```powershell
wp eval "echo 'OK';"
wp option get siteurl
```

The first command should print `OK`. The second should print
`http://<client-slug>.local`. If either fails, resolve the LocalWP site setup
before continuing — a non-operational site cannot be deployed to.

---

## Step 2 — Clone the template

From the parent directory (sibling to the template):

```powershell
git clone <path-to-template> <client-slug>
cd <client-slug>
```

With the template at `C:\Agency_Files\Github_Repos\handy-man`:

```powershell
cd C:\Agency_Files\Github_Repos
git clone handy-man scb-handyman
cd scb-handyman
```

**Immediately after cloning, rename the default `origin` remote to `template`:**

```powershell
git remote rename origin template
git remote -v
```

The output should show only `template` pointing at the template path — no
`origin`. This is the fork-and-customize naming convention:

- `template` — upstream; used only for fetching template improvements
- `origin` — the client's own repository; added later when the client gets a
  remote repo (typically at Step 6.0 production prep)

**Why this matters:** If `origin` continues to point at the canonical template,
an accidental `git push` from the clone would push client-specific commits into
the template repository, contaminating it with content meant only for this
client. The 5.5a-remediation episode encountered this footgun on the first SCB
deploy; this step prevents it on every subsequent fork.

---

## Step 3 — Verify clean clone state

Install all dependencies:

```powershell
pnpm install
composer install --working-dir=plugins/quote-wizard
```

Run all gates and confirm they pass at the same level as the template:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
composer test --working-dir=plugins/quote-wizard
composer lint --working-dir=plugins/quote-wizard
```

All must pass. If any fails on a fresh clone, the template itself has a problem
— halt and investigate; do not proceed with this clone until the template's
gates are green.

The `pnpm build` command runs both stages:

1. `pnpm -r build` — Vite compiles TypeScript/React source into `apps/wizard/dist/`
2. `pnpm build-plugin` — stages the output into `plugins/quote-wizard/assets/dist/`

After `pnpm build` completes, confirm both locations contain a `wizard.*.js`
file with matching hash. If only `apps/wizard/dist/` has the file, the plugin
staging stage did not run — this indicates a problem with the `build` script
in `package.json`.

---

## Step 4 — Initial client-specific commit

Create at least one commit on the clone's `main` branch ahead of the template.
This establishes the structural divergence between template and client and
exercises the fork-and-customize pattern before any real customization begins.

A minimal example (change one line in `package.json`'s `description` field):

```powershell
# Edit package.json: change the description to something client-specific
git add package.json
git commit -m "chore: initialize scb-handyman client clone"
```

After this commit, the clone has exactly one commit ahead of `template/main`:

```powershell
git log --oneline --decorate -5
# e.g.:
# abc1234 (HEAD -> main) chore: initialize scb-handyman client clone
# def5678 (template/main) docs: 5.5b fork procedure documentation
```

The divergence matters: it confirms the fork-and-customize architecture is in
place before deployment, not after.

---

## Step 5 — Initial deployment to LocalWP

Deploy the unmodified clone to the LocalWP site created in Step 1. Follow the
deploy procedure in `docs/onboarding.md`'s "Deploying the plugin to a WordPress
install" section (deactivate → delete → copy → activate → flush rewrite rules).

At this point the clone contains only the template's content plus the trivial
initialization commit from Step 4. The deployed site should look identical to
the canonical template's LocalWP site.

**Verify the deployment:**

1. The five routes (`/`, `/services`, `/our-work`, `/contact`, `/quote`) all
   render the React app without WordPress/theme chrome surrounding it. See
   the architectural note below about the expected rendering behavior.
2. The wizard at `/quote` completes end-to-end and produces an HTTP 502
   response with the message "Your submission was saved. We could not notify
   our team automatically." — this is architecturally correct (Make.com is not
   configured for this clone yet).
3. A submission row appears in `wp_goqw_submissions` with
   `status='forward_failed'`. Verify via LocalWP's Database tab → Adminer
   link, or via wp-cli:

   ```powershell
   wp db query "SELECT id, wizard_id, status, created_at FROM wp_goqw_submissions ORDER BY id DESC LIMIT 3;" --skip-column-names
   ```

   If wp-cli reports a MySQL connectivity error, use LocalWP UI → Database
   tab → Adminer instead. The site itself works correctly; only the wp-cli
   query is affected. See `docs/technical-debt.md` (LocalWP MySQL
   connectivity) for context.

If all three verification points pass, the clone is functional and the fork is
ready for client-specific customization.

---

## Step 6 — Receiving ongoing template updates

When the canonical template receives improvements — bug fixes, new capabilities,
ADR amendments, documentation updates — the clone receives them via standard git
merge:

```powershell
cd <client-slug-directory>
git fetch template
git log template/main --oneline -10     # review what's incoming
```

If the incoming commits look expected:

```powershell
git merge template/main
```

This produces a merge commit linking the template's latest HEAD into the
clone's history. Confirm completion:

```powershell
git status          # should show: nothing to commit, working tree clean
git log --oneline --decorate -10    # merge commit should appear with two parents noted
```

If the merge has conflicts (the client has customized files the template also
changed), resolve them: prefer the template version for shared infrastructure
(test configs, CI, shared PHP source), prefer the client version for
client-specific content (site copy, wizard configs, branding).

After a successful merge, rebuild and redeploy:

```powershell
pnpm build
# then deploy per docs/onboarding.md
```

Run gates to confirm nothing broke:

```powershell
pnpm lint && pnpm typecheck && pnpm test
composer test --working-dir=plugins/quote-wizard
```

---

## Step 7 — Client-specific customization

After the fork is verified working, proceed to adapt the clone for the specific
client: site content, services, branding, wizard configs. See
`docs/adaptation-runbook.md` for the complete customization workflow.

### SEO setup (Layer 1)

Per-client SEO customization is documented separately in
`docs/seo-adaptation-guide.md`. Complete the per-client SEO checklist
during initial customization to ensure each route has appropriate titles
and descriptions before deployment. The plugin ships with Acme Fencing
demo copy — this must be replaced for every real client.

---

## What this procedure does NOT cover

- LocalWP UI setup details (creating sites, configuring database settings) —
  refer to LocalWP's own documentation.
- Production hosting deployment — see Step 6.0 documentation when ready.
- Make.com configuration — see `docs/make-com-integration.md`.
- Pushing the clone to a remote repository — handled when the client's
  deployment reaches production; not required during template-clone development.
- Client-specific customization — see `docs/adaptation-runbook.md`.

---

## Common pitfalls

These are real failure modes from 5.5a-remediation that this procedure prevents:

**Pitfall 1 — `pnpm -r build` instead of `pnpm build`.**

Only `pnpm build` (the composed script) stages the bundle into the plugin
directory. Running `pnpm -r build` alone produces Vite output in
`apps/wizard/dist/` but does NOT copy it to
`plugins/quote-wizard/assets/dist/`. Deploys against the previous bundle.

Use `pnpm build` exclusively unless deliberately running stages separately for
diagnosis (e.g., `pnpm -r build` to inspect Vite output, then `pnpm build-plugin`
to stage). Never use `pnpm -r build` as the production build command.

**Pitfall 2 — Working with a forgotten merge in progress.**

If `git merge template/main` is started but `git status` is not checked
afterward, an unfinished merge can sit dormant. Symptoms: working tree has
unexpected staged changes; `git log` doesn't show a new merge commit.

Always run `git status` after every merge to confirm completion. If a merge
is partially complete, either finish it (`git commit`) or abort it
(`git merge --abort`).

**Pitfall 3 — `origin` pointing at the template.**

If `git remote rename origin template` is skipped in Step 2, the clone's
`origin` is the template. Any `git push` lands client-specific commits in the
template. Always rename immediately after cloning; verify with `git remote -v`.

**Pitfall 4 — LocalWP MySQL connectivity issues.**

`wp db query` sometimes fails to connect to LocalWP's MySQL even when the site
appears to be running. If verification needs database queries and they fail with
"Can't connect to MySQL server on 'localhost:3306'", use LocalWP's UI → Database
tab → Adminer link instead. Each Local site may use a non-standard MySQL port.
The wizard submission pipeline is unaffected — only wp-cli connectivity is
impacted.

**Pitfall 5 — Stale browser cache.**

After redeploying the plugin, hard-reload the browser (`Ctrl+Shift+R`) to
bypass cached JS/CSS. Without a hard reload, the browser may continue loading
the previous bundle despite the server having been updated.

---

## Reference — relationship between template and clones

The template repository (`handy-man`) is the source of truth for all shared
infrastructure: wizard framework, domain registry, REST submission pipeline,
rendering architecture, CI configuration, and documentation conventions.

Each client clone inherits this infrastructure by being forked from the template
at a point in time. The clone then diverges with client-specific customizations:
site content, service configs, branding, and (eventually) production deployment
credentials.

Template improvements propagate to clones via `git merge template/main`. The
clones do not push back to the template. The template's evolution is driven by
needs discovered across multiple client deployments, captured in the template
repository via normal commits, then made available to all clones.

**If a clone discovers a bug or improvement that should benefit all clients:**

1. Apply the fix first in the template repository (not in the clone).
2. Merge it into the clone via `git fetch template && git merge template/main`.
3. Apply to other clones via the same merge mechanism.

This preserves the template's role as the single source of truth for shared
work and prevents fragmentation across client deployments.

**Remote naming convention summary:**

| Remote     | What it points at                | When to add              |
| ---------- | -------------------------------- | ------------------------ |
| `template` | Canonical template (`handy-man`) | Step 2 — immediately     |
| `origin`   | Client's own remote repository   | Step 6.0 production prep |

Only `template` is present during development. `origin` is added when the
client's deployment is ready to be pushed to a hosting provider's git remote
or a GitHub/GitLab repository.
