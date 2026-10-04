/**
 * Validating a submission (spec Q.2, Q.3), in two calls so consent can be
 * checked between them, as in the plugin (shape, then consent):
 *
 * 1. validateSubmission: the wire shape the plugin checked: contract version
 *    3, a quote mode, a wizard id and an answers object (pricing ignored:
 *    every portfolio intent is manual).
 * 2. validateAnswers, new in the port: the answers against the intent's own
 *    WizardConfig,
 *    with the engine's validateStep, the same code the browser runs. Unknown
 *    intents and unknown answer keys are rejected, as are answers that fail
 *    a field's type, options, format or maximum length.
 */
import type { AnswerMap } from '../../../wizard/src/domain/runtime/answer-types';
import { validateStep } from '../../../wizard/src/domain/runtime/answer-validation';
import { buildFieldKeyMap } from '../../../wizard/src/domain/runtime/condition-evaluator';
import {
  CONTACT_WIZARDS,
  isContactIntent,
  type ContactIntentId,
} from '../../../site/src/wizard/intents';

export const CONTRACT_VERSION = 3;

export interface ValidSubmission {
  intent: ContactIntentId;
  schemaVersion: number;
  quoteMode: 'manual';
  answers: Record<string, unknown>;
  clientTimestamp: string;
}

export type ValidationOutcome =
  | { ok: true; value: ValidSubmission }
  | { ok: false; reason: string };

/** Keys a wizard can hold answers under: every field key of every step. */
function allowedKeys(intent: ContactIntentId): Set<string> {
  const keys = new Set<string>();
  for (const step of CONTACT_WIZARDS[intent].steps) {
    if ('fields' in step) for (const field of step.fields) keys.add(field.key);
  }
  return keys;
}

export function validateSubmission(payload: unknown): ValidationOutcome {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false, reason: 'payload must be a JSON object' };
  }
  const p = payload as Record<string, unknown>;
  if (p.contractVersion !== CONTRACT_VERSION) return { ok: false, reason: 'contract version' };
  if (p.quoteMode !== 'instant' && p.quoteMode !== 'manual')
    return { ok: false, reason: 'quoteMode' };
  if (typeof p.wizardId !== 'string' || p.wizardId === '') return { ok: false, reason: 'wizardId' };
  if (!isContactIntent(p.wizardId)) return { ok: false, reason: 'unknown intent' };
  const answers = p.answers;
  if (answers === null || typeof answers !== 'object' || Array.isArray(answers)) {
    return { ok: false, reason: 'answers' };
  }
  const intent = p.wizardId;
  const config = CONTACT_WIZARDS[intent];
  if (p.quoteMode !== (config.quoteMode ?? 'instant')) return { ok: false, reason: 'quoteMode' };

  const answerMap = answers as Record<string, unknown>;
  return {
    ok: true,
    value: {
      intent,
      schemaVersion:
        typeof p.schemaVersion === 'number' && Number.isInteger(p.schemaVersion)
          ? p.schemaVersion
          : 1,
      quoteMode: 'manual',
      answers: answerMap,
      clientTimestamp: typeof p.clientTimestamp === 'string' ? p.clientTimestamp.slice(0, 40) : '',
    },
  };
}

/** The answers against the intent's WizardConfig, with the engine's own validateStep. */
export function validateAnswers(
  intent: ContactIntentId,
  answers: Readonly<Record<string, unknown>>,
): { ok: true } | { ok: false; reason: string } {
  const config = CONTACT_WIZARDS[intent];
  const keys = allowedKeys(intent);
  const unknown = Object.keys(answers).filter((key) => !keys.has(key));
  if (unknown.length > 0)
    return { ok: false, reason: `unknown answer keys: ${unknown.join(', ')}` };

  const fieldKeyById = buildFieldKeyMap(config);
  for (const step of config.steps) {
    const snapshot = validateStep(step, answers as AnswerMap, fieldKeyById);
    if (!snapshot.valid) {
      return {
        ok: false,
        reason: `step ${step.id}: ${snapshot.issues.map((i) => i.fieldKey).join(', ')}`,
      };
    }
  }
  return { ok: true };
}
