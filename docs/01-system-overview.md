# System Overview

**Project:** Growth Operations Platform for Local Trades Businesses
**Document version:** 1.0
**Status:** Phase 1 — Architecture (pre-implementation)
**Audience:** Engineering team, agency operators, future maintainers

---

## 1. What we are building

A WordPress-based lead generation website with an embedded React quote wizard, designed for local trades businesses (fencing first, extensible to handyman, landscaping, garden services).

The system has two faces:

- **For the trades business owner:** a website that produces qualified leads with indicative pricing already attached, reducing wasted survey visits and increasing job conversion rate.
- **For the agency:** a repeatable deployment template — the same architectural blueprint, plugin code, React engine, and Make.com scenarios can be redeployed for the next client in days rather than weeks.

This is **not a SaaS platform**. Each client gets their own WordPress install, their own plugin instance, their own Make.com scenario, their own HubSpot account. The reusability lives at the level of source code, configuration shape, and operational playbook — not a multi-tenant runtime.

## 2. Why this exists

The agency's commercial model depends on:

- Producing client outcomes (leads, conversions) that justify a monthly retainer
- Deploying new clients fast enough to make the project margin work
- Maintaining many small client sites without the maintenance cost growing linearly with the client count

A bespoke website per client breaks all three. A SaaS platform solves them but is the wrong shape for the buyer (small local businesses want their own asset, not a tenant slot). This system is the middle path: a templated deployment.

## 3. Who it serves

**Primary user:** the homeowner submitting a quote request. They are on a phone, in a hurry, comparing two or three local trades, and want a sense of price before they commit to a site visit.

**Secondary user:** the trades business owner. They check email and WhatsApp. They want pre-qualified leads with enough detail to bid sensibly.

**Tertiary user:** the agency operator. They configure pricing, run reports, manage GBP and SEO, and need to deploy the next client without re-inventing anything.

All three users matter. The architecture must serve all three. UX decisions in the wizard prioritise the homeowner; operational decisions in the plugin and automation layer prioritise the agency.

## 4. Success criteria

The system is successful when, for a deployed client:

- A homeowner can submit a fencing quote request from a mobile device in under 3 minutes
- The submission produces a HubSpot contact, an owner email, and a customer confirmation email within 60 seconds
- The owner email contains enough information (measurements, photos, indicative range, contact) that no further qualification call is needed before scheduling a site visit
- The client can self-serve basic content edits in WordPress without breaking the wizard
- The agency can deploy the next client by cloning the plugin, editing a JSON config, and duplicating a Make.com scenario — measured target: under 2 working days for the technical deployment

The system is successful for the agency when:

- A second client deployment requires zero code changes inside the React wizard
- A third trade vertical (e.g. landscaping) can be added by writing a new config and adding 1–2 vertical-specific question components
- Hosting, monitoring, and backup playbooks are documented well enough that a new agency team member can take over a client site within a day

## 5. Explicit non-goals (v1)

Naming what we are not building is as important as naming what we are. The following are out of scope for v1 and should be challenged if they creep back in:

- Multi-tenant SaaS architecture, shared databases, cross-client analytics dashboards
- A bookable calendar built into the wizard (Calendly link is the v1 answer)
- Payment collection or deposit handling
- A customer-facing portal, login, or account system
- WhatsApp Business API integration (deferred — SMS via Make.com is the v1 fallback if needed)
- A full pricing admin UI in wp-admin (deferred — JSON file for v1)
- AI-driven pricing, image analysis, or chatbot
- Native mobile apps
- Server-side rendering or Next.js (the wizard is a client-side React island inside WordPress)

## 6. The reusability principle

We build for **client #1**. Reusability is a constraint on how we organise code, not a feature we ship.

Concretely, this means:

- The React wizard is built as a generic engine that reads a config; client-specific content lives in the config, not the components.
- The WordPress plugin is namespaced and version-controlled; deploying to client #2 means cloning the repo, changing the plugin slug and webhook URL, and shipping.
- The Make.com scenario is documented as a blueprint (exported JSON) that can be imported into a new Make.com account.
- The pricing engine accepts a config object and produces a result; it has no knowledge of fencing specifically.

We do **not** build:

- A central config server
- A shared database of pricing
- Per-tenant authentication
- A control plane

When client #3 is deployed and we have learned what genuinely varies vs. what is stable, we revisit whether any of those abstractions earn their keep. Not before.

## 7. Top-level architecture (one paragraph)

A WordPress site running the Kadence theme hosts content pages and embeds a custom plugin. The plugin exposes a shortcode (and/or block) that mounts a React/TypeScript single-page application built with Vite. The React app runs the quote wizard entirely client-side, reading a pricing config bundled at build time. On submission, the app POSTs to a WordPress REST endpoint registered by the plugin; that endpoint stores uploaded images in the WordPress media library, builds a structured payload, and forwards it to a Make.com webhook. Make.com creates a HubSpot contact, sends the owner notification email, sends the customer confirmation email, and optionally sends an SMS. No custom backend exists beyond the WordPress plugin's REST handler.

## 8. Stakes and risks at a glance

The three risks I'd ask the team to take most seriously are detailed in `05-risk-analysis.md`, but in short:

- **Make.com operation quotas** are the single most likely source of operational pain at scale; the free tier is 1,000 operations/month and our flow uses 4–6 per submission.
- **HubSpot free-tier limits** on automation and contact properties will bite if the agency wants to do anything sophisticated downstream.
- **Hosting variance across clients** — even with Cloudways as the floor, plugin conflicts and PHP version drift will be the most common support ticket category.

Mitigations are designed into the architecture, not retrofitted.
