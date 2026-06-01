# ADR-0014: Reference Template Product Scope

**Status:** Accepted
**Date:** 2026-05-29

## Context

The project began as a single fencing quote wizard. The product direction
has been updated to a reusable lead-generation platform for trade/service
businesses, where:

- the wizard engine is shared infrastructure,
- each client is defined by configuration,
- the WordPress plugin selects a "vertical",
- site templates (Home, Services, Our Work, Contact, plus a quote page) will
  later (Phase 5) provide a consistent client site structure.

There are three possible interpretations of "reusable platform":

- (a) Same engine + per-client config + theme only.
- (b) Same engine + per-client config + theme + a generated WordPress site
  (template pages, theme, content), curated in-repo.
- (c) A full operator-editing platform with CMS/editor UI and runtime
  authoring.

## Decision

The product target is **(b)**, explicitly and exclusively.

- (a) is insufficient: clients need full sites, not just the wizard.
- (c) is out of scope and not justified by current demand. We do not build
  CMS/editor mechanics. Operator-facing tooling can be revisited when a real
  operational requirement exists (named trigger: a non-engineer needs to
  produce a client site without engineering involvement).

The five reference pages (Home, Services, Our Work, Contact, Get a Free
Quote) are a **canonical reference set**, not a hard schema. Client sites
will be encouraged to use them, and the fencing reference template ships
them, but a future client may add, rename, or omit pages without breaking
the platform. Architecture supports this set; it does not enforce it.

## Alternatives considered

- (a) single config layer. Rejected: leaves the site itself out of the
  shared template, which is the actual repeatable work.
- (c) operator platform. Rejected as premature; revisit when triggered.
- Hard five-page schema. Rejected: encodes a content decision as an
  architectural constraint and will not survive client variation.

## Consequences

**Easier:**

- A new client = a new WordPress install + new vertical entry + new content
  config + same templates. Days, not weeks.
- The wizard engine remains stable; site templates layer on top.

**Harder:**

- We must keep two registries cleanly separated: the wizard/vertical
  registry (ADR-0013), and a future site-template/content registry (Phase 5).
  Conflating them is the main risk to flag.
- Content authoring workflow needs documenting (Phase 5).

## Status note

This ADR records the strategic decision. The technical implementation lands
across Step 4.5 (vertical registry) and Phase 5 (site templates).

---

## Amendment — 2026-06-01: Concrete pages, not schema-driven (Step 5.0)

Step 5.0 implements the five reference pages as **concrete React components
with content in typed TypeScript modules**, not as schema-driven templates.

This is the architectural commitment that makes the template-clone workflow
real: a cloner edits files, not configurations. There is no abstraction
between "what the page renders" and "what's in the content file" — the page
imports the const and reads its fields. Type-checking catches mistakes.

The five-page set (Home / Services / Our Work / Contact / Quote) is the
canonical reference set, not a hard schema. Future clients may add, rename,
or omit pages by editing the route table; no platform code enforces the
five-page structure.

This explicitly does NOT pave the road to an operator-editing platform (c).
Operator content editing would require: a content schema, a content API,
admin UI, preview tooling, content sync, validation tooling. None of those
exist; none are planned. Revisit only on explicit demand.
