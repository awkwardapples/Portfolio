import type { Field } from '@/domain/config/wizard-config';
import type { AnswerValue } from '@/domain/runtime/answer-types';

/**
 * Props received by every field renderer component.
 *
 * All field renderers are pure presentational functions that derive their
 * display state from these props. The sole exception is ReviewField, which
 * uses useWizardSelector internally (Option A decision, documented there).
 */
export interface FieldRendererProps {
  field: Field;
  value: AnswerValue | undefined;
  error: string | undefined;
  onChange: (value: AnswerValue) => void;
  onBlur: () => void;
}

/** The shape every entry in the field registry must satisfy. */
export type FieldRenderer = (props: FieldRendererProps) => JSX.Element;
