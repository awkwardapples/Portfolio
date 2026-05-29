import type { FieldType } from '@/domain/config/field-types';

import { CheckboxGroupField } from './fields/CheckboxGroupField';
import { DimensionsField } from './fields/DimensionsField';
import { NumberField } from './fields/NumberField';
import { PhotoField } from './fields/PhotoField';
import { RadioGroupField } from './fields/RadioGroupField';
import { ReviewField } from './fields/ReviewField';
import { SelectField } from './fields/SelectField';
import { TextareaField } from './fields/TextareaField';
import { TextField } from './fields/TextField';
import type { FieldRenderer } from './types';

/**
 * Closed registry mapping every FieldType to its renderer component.
 *
 * Adding a new field type requires: (1) adding it to FIELD_TYPES in field-types.ts,
 * (2) implementing a renderer, and (3) registering it here. TypeScript enforces
 * completeness — a missing entry is a compile error.
 */
export const fieldRegistry: Record<FieldType, FieldRenderer> = {
  text: TextField,
  textarea: TextareaField,
  select: SelectField,
  radio: RadioGroupField,
  checkbox: CheckboxGroupField,
  number: NumberField,
  dimensions: DimensionsField,
  photo: PhotoField,
  review: ReviewField,
};
