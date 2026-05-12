# `@growth-ops/wizard`

The React + TypeScript quote wizard. Built with Vite. Embedded into WordPress as a static bundle.

This README covers **this package specifically**. For the project as a whole, see the [repository root README](../../README.md) and [`docs/`](../../docs).

---

## Scripts

| Command                                      | What it does                                                                                                                   |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm --filter @growth-ops/wizard dev`       | Starts the Vite dev server on `http://localhost:5173`. HMR is enabled. The dev `index.html` provides a `#qw-root` mount point. |
| `pnpm --filter @growth-ops/wizard build`     | Runs `tsc --noEmit` for type-checking, then `vite build`. Output lands in `dist/`.                                             |
| `pnpm --filter @growth-ops/wizard typecheck` | Type-checks without building. Faster feedback loop than `build`.                                                               |
| `pnpm --filter @growth-ops/wizard preview`   | Serves the built `dist/` locally to preview the production bundle.                                                             |

You can also `cd apps/wizard` and run `pnpm dev`, `pnpm build`, etc. directly.

---

## How the app mounts

The wizard expects a DOM element with `id="qw-root"` to exist on the page:

```html
<div id="qw-root"></div>
```

The bundle is enqueued by the WordPress plugin, which renders this `<div>` via the `[quote_wizard]` shortcode. In development, the same `<div>` is provided by `index.html`.

If `#qw-root` is missing, the app logs a warning to the console and does nothing — it does not throw, so it cannot break the rest of the WordPress page.

---

## Build output contract

The production build produces (filenames include content hashes):

```
dist/
├── manifest.json          # Vite manifest — resolves hashed filenames
├── wizard.[hash].js       # Single JS bundle (no top-level code splitting)
├── wizard.[hash].css      # Single CSS bundle
└── wizard.[hash].js.map   # Source map
```

The WordPress plugin's `AssetLoader` reads `manifest.json` to discover the current filenames and enqueues them.

**This contract is consumed by**:

- `scripts/build-plugin.sh` (top-level repo script) — copies these files into the plugin's `assets/dist/`.
- The WordPress plugin's `AssetLoader` PHP class (added in step 3D).

Any change to the output filenames or structure is a breaking change to the plugin and must be coordinated.

---

## Styling

Tailwind CSS v3, configured in `tailwind.config.ts`.

The primary brand colour is driven by a CSS variable (`--qw-primary`) so the WordPress plugin can override it per-client without rebuilding the bundle. Use `bg-primary`, `text-primary`, etc. as Tailwind utilities.

Tailwind's content scanner reads `index.html` and `src/**/*.{ts,tsx}` — if you add a new file type that contains class names, update `tailwind.config.ts` accordingly.

---

## Adding a dependency

Read `CONTRIBUTING.md` at the repo root first. Every new dependency requires justification in the PR.

Install with:

```bash
pnpm --filter @growth-ops/wizard add <package>
pnpm --filter @growth-ops/wizard add -D <dev-package>
```

---

## Limitations of the Step 3B scaffold

- No business logic. The wizard renders a placeholder.
- No linting yet — that's step 3C.
- No tests yet — Vitest will be installed when the engine is built in Phase 4.
- Path alias `@/` is configured but not exercised by any real imports yet.
