# Architecture Decision Records

Each ADR records one decision: its context, the options considered and the consequences. The template is in [`CONTRIBUTING.md`](../../CONTRIBUTING.md#architecture-decision-records).

## ADRs 0001 to 0038: the GrowTrades platform

ADRs 0001 to 0038 record the GrowTrades platform this repository was before it became Josh Lennon's portfolio: a WordPress plugin hosting the React quote wizard. They are kept as history and as case-study evidence. They are not instructions for the portfolio, and the documents they link to now live in [`docs/archive/growtrades-platform/`](../archive/growtrades-platform/README.md).

The decisions about the wizard engine and the tooling still hold where they are reused: pnpm workspaces (0002), the closed Tailwind theme (0003, 0012), React Hook Form and Zod (0004), the ESLint flat config (0006), the vertical registry (0013), the submission pipeline's ports (0015, 0018), new step kinds (0024), bot protection on the client (0027) and the Turnstile gate on both submit buttons (0038).

Superseded or adapted for this repository:

- The WordPress host, the PHP boundary, and the plugin's build pipeline and CI (0001, 0008, 0009, 0010, 0011, 0016, 0019, 0030) are superseded by [ADR-0039](0039-portfolio-architecture.md).
- The SEO layers (0023) are kept but emitted by Astro at build time instead of by PHP (Pass 10).
- The synchronous forward to Make.com (0005) and photo storage on the server (0026, 0031, 0032) are superseded by ADR-0043 when the submission pipeline is ported (Pass 6).

## ADRs 0039 onwards: the portfolio

| ADR                                           | Decision                                                                          |
| --------------------------------------------- | --------------------------------------------------------------------------------- |
| [0039](0039-portfolio-architecture.md)        | Portfolio architecture: Astro static site plus Worker; WordPress leaves this repo |
| [0040](0040-cloudflare-hosting-and-deploy.md) | Hosting on Cloudflare Workers static assets, D1 and Turnstile; deploy via Actions |
| [0041](0041-content-model-and-authoring.md)   | Content model, placeholders as drafts, documents, `pnpm new`, Sveltia CMS         |

Planned (spec U.7): 0042 the "What brings you here?" wizard, 0043 the submission pipeline port, 0044 the SCB demo build, 0045 visual identity and theming, 0046 media pipeline and third-party facades.
