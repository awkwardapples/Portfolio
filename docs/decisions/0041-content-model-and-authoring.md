# ADR-0041: Content model and authoring

**Status:** Accepted
**Date:** 2026-10-04 (Portfolio Pass 2)

## Context

Josh publishes projects, papers and posts without touching application code (spec T). Content must be validated, with mistakes reported by file and field, and placeholders for missing facts must never reach the live site (spec T.4), while the gates stay green so the passes can continue and merges can deploy.

## Decision

**Collections** (`apps/site/src/content.config.ts`), each entry a folder with its assets beside it:

| Collection | Files                                         | Entry id and URL                               |
| ---------- | --------------------------------------------- | ---------------------------------------------- |
| `work`     | `content/work/<slug>/index.mdx`               | `<slug>`, page at `/work/<slug>`               |
| `posts`    | `content/posts/<yyyy-mm-dd>-<slug>/index.mdx` | `<slug>` (date dropped), page at `/log/<slug>` |
| `profile`  | `content/profile/profile.yaml`                | `profile` (single entry)                       |

Schemas follow spec H.2 to H.5 and the content pack (Y.2, Y.3), written with Astro's Zod 4 (`astro/zod`); the wizard's Zod 3 never meets them. Objects are strict, so a mistyped key is an error naming the key.

**Placeholders.** A field that can be missing accepts `TODO(josh): what is needed`. The rule that keeps both the spec's guard and green gates:

- `TODO(josh)` values appear only in drafts: whole entries marked `draft: true`, or, in the profile, list items (experience, education, photos) marked `draft: true`.
- Optional facts that have not arrived are left out of published content, with a YAML comment saying what is needed. Missing optional sections are omitted (spec T.4).
- A production build fails if a published entry or published part of the profile contains `TODO(josh)` in its data or body, naming the file and field. A final step fails the build if `TODO(josh)` appears in any built file.
- `astro dev` shows drafts, marked as drafts, and highlights every placeholder on the page. `pnpm content:todo` lists every placeholder and note.

The content pack wrote some placeholders into published profile fields (LinkedIn, Spotify, CV, the long bio), with the intent that they trip the guard. Taken literally, that would fail every build and every deploy until all of them arrived, so those fields are absent (with notes) instead, and items that cannot render without a missing fact (the three experience entries without start dates) are drafts.

**Checks** (`content/checks.ts`, unit-tested): placeholders, alt text in bodies, lowercase-hyphenated folder names, unique `featuredOrder` among published entries, references to drafts or missing entries, and documents that are missing or unrecorded. They run in a wrapper around Astro's glob loader: a production build stops with every problem listed; `astro dev` prints them as warnings and re-checks on every change. A post's `project` (a cross-collection reference) is checked when pages build, in `lib/content.ts`.

**Documents.** PDFs live in `apps/site/public/documents/` under clean names, so each has a permanent URL (`/documents/<name>.pdf`), which spec H.7 allows; hashed asset URLs would change with every edit and break citations. `pnpm media:pdf` copies the PDF there, renders page one to `<name>.cover.png` beside the entry (so Astro optimises it), and records page count, size and embedded metadata in `src/data/documents.json`.

**Deviations from the spec's wording:**

- The work field the spec calls `layout` is `template`: Astro's MDX handling reads a frontmatter `layout` as a layout file to import.
- No remark plugins. Astro 7's default Markdown processor is native (Sätteri) and `markdown.remarkPlugins` is deprecated. Body checks run in the loader, dev highlighting is a dev-only script, and the authoring conveniences of spec T.2 (a YouTube or Spotify link on its own line becoming a facade, images becoming figures, PDF links becoming document cards) are MDX component overrides, added with the pages in Pass 5.

**Authoring routes** (spec T.1): editing files by hand; `pnpm new` (a draft entry folder, optionally ingesting a folder of media); and Sveltia CMS at `/admin`, pinned to 0.227.4 with a Subresource Integrity hash and signed in with a fine-grained personal access token. The CMS commits to `main`, which deploys. Saving the profile through the CMS drops its YAML comments.

**Dev-only pages** are injected by an integration only for `astro dev` (`/dev/content` now, the style guide in Pass 3), so they never reach a production build or the sitemap.

## Alternatives considered

- **A preview mode that hides placeholders instead of failing.** Rejected: it would weaken the spec's guard into a convention; drafts express the same thing explicitly.
- **PDFs beside each entry, served through the bundler.** Rejected: hashed file names change when a file changes, and citations need permanent URLs.
- **The unified (remark) Markdown processor, to keep plugins.** Rejected for now: the needs are covered without it, and Astro is moving away from it.

## Consequences

- Josh sees every gap in dev and in `pnpm content:todo`; the live site only ever shows finished content.
- Publishing a draft is one edit: fill in the placeholders and remove `draft: true`. The build says exactly what is left if any remain.
- Two of Josh's three PDFs are published. The deep-learning paper stays a draft: its PDF carries his personal email address (spec U.8 forbids it on the site), its own title differs from the old site's, and it names a second author.
