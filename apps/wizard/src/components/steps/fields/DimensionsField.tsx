import { Input } from '@/components/primitives';
import { FieldGroup } from '@/components/composites';

import type { FieldRendererProps } from '../types';

/**
 * Renders a structured "width x height" text input.
 * The answer is stored as a plain string (e.g. "3.5 x 1.8") so it
 * fits the AnswerValue type without protocol changes.
 */
export function DimensionsField({
  field,
  value,
  error,
  onChange,
  onBlur,
}: FieldRendererProps): JSX.Element {
  const id = field.key;
  const describedBy =
    [field.help ? `${id}-help` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') ||
    undefined;

  return (
    <FieldGroup
      id={id}
      label={field.label}
      help={field.help}
      error={error}
      required={field.required}
    >
      <Input
        id={id}
        type="text"
        placeholder="e.g. 3.5 x 1.8"
        value={typeof value === 'string' ? value : ''}
        invalid={error !== undefined}
        aria-required={field.required || undefined}
        aria-describedby={describedBy}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
      <p className="text-sm text-text-muted">Width x height in metres</p>
    </FieldGroup>
  );
}
