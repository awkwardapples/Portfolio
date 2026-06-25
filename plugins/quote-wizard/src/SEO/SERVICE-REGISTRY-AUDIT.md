# Phase 0 Audit — Wizard Service Registry (Step 5.10b)

Audit performed prior to ServiceSchemaEmitter implementation.

## Key finding

The wizard service registry is purely TypeScript
(`apps/wizard/src/domain/registry/verticals.ts`). There is no PHP equivalent.
The PHP plugin has `goqw_enabled_services` (comma-separated service IDs) but
no service names or descriptions.

## TypeScript registry structure

Each `Vertical` in `VERTICALS` has:

- `id: string` — stable key (e.g., `'fencing'`, `'general-repairs'`)
- `label: string` — display name (e.g., `'Fencing'`, `'General Repairs'`)
- `categoryId: string` — one of: `'landscaping'`, `'decorating'`, `'exterior-cleaning'`, `'handyman'`
- `wizard: WizardConfig` — step definitions
- `pricing: PricingConfig` — pricing rules

Service descriptions (for schema.org) come from `apps/wizard/src/site/content/services-content.ts`
which has a `description` field per service. These are longer prose descriptions
suitable for schema.org Service entries.

## ServiceSchemaEmitter implementation approach

Since there is no PHP service registry, `ServiceSchemaEmitter` maintains a
static `SERVICES` constant that mirrors the TypeScript VERTICALS + service
descriptions from `services-content.ts`. This is a deliberate tradeoff:

- Adds 11 services as a static PHP map (easy to maintain).
- Must be kept in sync with the TypeScript registry when services are added or removed.
- The `goqw_enabled_services` option filters which services are included in the
  emitted schema (same filter logic as the React side's `listEnabledServiceIds()`).

## All 11 registered services

| ID                | Label                 | Category          |
| ----------------- | --------------------- | ----------------- |
| `fencing`         | Fencing               | landscaping       |
| `decking`         | Decking               | landscaping       |
| `patio`           | Patio & Paving        | landscaping       |
| `driveway`        | Driveway              | landscaping       |
| `steps`           | Garden Steps          | landscaping       |
| `painting`        | Painting & Decorating | decorating        |
| `jetwash`         | Pressure Washing      | exterior-cleaning |
| `general-repairs` | General Repairs       | handyman          |
| `plumbing`        | Plumbing              | handyman          |
| `electrical`      | Electrical            | handyman          |
| `carpentry`       | Carpentry             | handyman          |

## goqw_enabled_services filtering

- Empty string → all 11 services included in schema.
- `'fencing,decking'` → only fencing and decking included.
- Unrecognized IDs → silently ignored (same as JS behavior).

## Sync discipline

When a new service is added to `verticals.ts` or a service is renamed in
`services-content.ts`, `ServiceSchemaEmitter::SERVICES` must be updated in the
same commit. The service registry divergence is a known tradeoff documented in
ADR-0023 (amendment, Step 5.10b).
