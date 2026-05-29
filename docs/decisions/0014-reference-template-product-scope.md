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
