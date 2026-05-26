/**
 * Config schema migrations (RESERVED — no migrations exist yet).
 *
 * v1 is the only schema version today. This folder and interface are reserved
 * now so that when a breaking schema change is needed, v2 migration work slots
 * in without restructuring.
 *
 * When v2 arrives:
 *   1. Bump the schema's `schemaVersion` literal to 2 in the relevant schema.
 *   2. Add `migrate_v1_to_v2(input: unknown): unknown` below as a PURE function.
 *   3. Register it in the `MIGRATIONS` chain keyed by source version.
 *   4. The loader runs migrations in sequence to bring any older config up to
 *      the current version before validation.
 *   5. Unit-test the migration with before/after fixtures.
 *
 * Forward-compatible additions (a new OPTIONAL field) do NOT require a
 * migration or a version bump.
 */

/**
 * A migration is a pure transform from one schema version's shape to the next.
 * Input/output are `unknown` because a migration operates on not-yet-validated
 * data (it runs before the target-version schema validates the result).
 */
export type Migration = (input: unknown) => unknown;

/**
 * Ordered migration chain, keyed by the SOURCE version each migration upgrades
 * FROM. Empty in v1. Example future shape:
 *
 *   export const MIGRATIONS: Record<number, Migration> = {
 *     1: migrate_v1_to_v2,
 *   };
 */
export const MIGRATIONS: Record<number, Migration> = {};

/**
 * The current schema version targeted by the loader. Bump alongside adding a
 * migration that reaches it.
 */
export const CURRENT_SCHEMA_VERSION = 1 as const;
