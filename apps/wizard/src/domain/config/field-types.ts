/**
 * Canonical field-type registry.
 *
 * The single source of truth for which field types the wizard supports. Every
 * other part of the domain layer (schemas, validators, conditional evaluators)
 * and, later, the renderer's component lookup (4.4) references THESE constants
 * rather than scattering string literals. This prevents string drift across
 * layers — a misspelled 'slect' becomes a type error, not a silent miss.
 *
 * The registry is domain-only. It says nothing about how a field type is
 * rendered (no component references, no styling) — that mapping lives in the
 * UI layer (4.4). Here we only enumerate the operational structure.
 */

/**
 * The supported field types. Frozen tuple so it can drive both a runtime Zod
 * enum and a compile-time union type.
 */
export const FIELD_TYPES = [
  'text', // single-line free text
  'textarea', // multi-line free text
  'select', // choose one from a dropdown
  'radio', // choose one from visible options
  'checkbox', // boolean, or multi-select set
  'number', // numeric entry
  'dimensions', // structured measurement input (e.g. length in metres)
  'photo', // image upload
  'review', // terminal step: review answers before submit
] as const;

/**
 * Union of supported field-type identifiers, derived from the registry.
 */
export type FieldType = (typeof FIELD_TYPES)[number];

/**
 * Type guard: is an arbitrary string a supported field type?
 * Useful at boundaries where a value's origin is untyped.
 */
export function isFieldType(value: string): value is FieldType {
  return (FIELD_TYPES as readonly string[]).includes(value);
}
