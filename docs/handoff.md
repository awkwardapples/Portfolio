# Development Handoff

## Project

WordPress-based local lead generation wizard platform.

## Current Phase

Phase 4 — Wizard Runtime.

## Completed

- Phase 1 complete
- Phase 2 complete
- Phase 3 complete
- Step 4.1 complete (Config Schema + Validation Architecture)

## Current Target

Step 4.2 — Wizard State Machine Architecture implementation.

## Core Constraints

- React-free pure domain layer in src/domain/\*\*
- No side effects in transition()
- Zod-first schemas
- Deterministic pricing
- No arbitrary code evaluation
- Config-driven architecture
- Optimistic UI with no false success states
- Bundle budget enforcement
- No source maps in production
- All state serializable
- Fail-closed validation

## Architectural Decisions

Read all ADRs in docs/decisions/.

Critical:

- ADR-0001
- ADR-0005
- ADR-0009
- ADR-0012

## Workflow Discipline

Always:

1. Plan first
2. Wait for approval
3. Implement incrementally
4. Verify:
   - lint
   - typecheck
   - tests
   - build
5. Package artifact
6. Produce evidence report

## Testing

Vitest in apps/wizard.

## Current Step Plan

(Include the approved Step 4.2 plan here or link to it.)

## Non-goals

- No Redux/Zustand
- No server-side wizard rendering
- No arbitrary pricing formulas
- No UI coupling in domain layer
