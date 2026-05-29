import { Input } from '@/components/primitives';
import { FieldGroup } from '@/components/composites';

import type { FieldRendererProps } from '../types';

export function TextField({
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
        value={typeof value === 'string' ? value : ''}
        invalid={error !== undefined}
        aria-required={field.required || undefined}
        aria-describedby={describedBy}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
    </FieldGroup>
  );
}
