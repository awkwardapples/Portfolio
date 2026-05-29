import { Input } from '@/components/primitives';
import { FieldGroup } from '@/components/composites';

import type { FieldRendererProps } from '../types';

export function NumberField({
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

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const raw = e.target.value;
    if (raw === '') {
      onChange('');
      return;
    }
    const parsed = parseFloat(raw);
    onChange(Number.isNaN(parsed) ? raw : parsed);
  }

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
        type="number"
        min={0}
        value={typeof value === 'number' ? String(value) : typeof value === 'string' ? value : ''}
        invalid={error !== undefined}
        aria-required={field.required || undefined}
        aria-describedby={describedBy}
        onChange={handleChange}
        onBlur={onBlur}
      />
    </FieldGroup>
  );
}
