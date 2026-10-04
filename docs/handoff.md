# Handoff

How to pick this work up. The final version is written in Pass 10; until then this page gives the minimum to continue.

1. **Read** [`docs/portfolio-spec.md`](portfolio-spec.md) section 0 (working rules) and the pass you are about to start in section V, then [`current-state.md`](current-state.md) for what is done and what is open.
2. **Set up** Node 24 and pnpm (`nvm use 24.21.0`, `corepack enable pnpm`, `pnpm install`). If `astro check` asks to install `@astrojs/check`, delete every `node_modules` folder and install again ([`technical-debt.md`](technical-debt.md)).
3. **Check the gates** before changing anything: `pnpm gates`. Do not start a pass with a red gate.
4. **Work on** `portfolio-transformation`, keep the draft pull request open, run the gates, update `current-state.md`, and merge to `main` with a merge commit at the end of the pass ([`CONTRIBUTING.md`](../CONTRIBUTING.md)).
5. **Stop and ask Josh** when the spec says to: missing content without a placeholder strategy, a dependency outside spec U.6, anything that could publish confidential Mercor material, real SCB customer data or images of unknown provenance.

Where things live: the site in `apps/site`, the Worker in `apps/edge`, the engine in `apps/wizard`, decisions in `docs/decisions/` ([index](decisions/README.md)), hosting in [`deployment.md`](deployment.md).
