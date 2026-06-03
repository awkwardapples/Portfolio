/**
 * Answer value and map types shared across the runtime domain layer.
 *
 * Defined here so both condition-evaluator.ts and state.ts (Commit 3) can
 * import from a single source without a circular dependency.
 */

import type { PhotoAnswerValue } from '@/domain/runtime/photos';

/** A single field's answer. Arrays represent multi-select checkbox state. */
export type AnswerValue =
  | string
  | ReadonlyArray<string>
  | number
  | boolean
  | null
  | PhotoAnswerValue;

/** All answers for the current wizard session, keyed by field.key. */
export type AnswerMap = Readonly<Record<string, AnswerValue>>;
