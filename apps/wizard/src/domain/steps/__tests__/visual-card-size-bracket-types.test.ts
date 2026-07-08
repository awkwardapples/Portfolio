import { describe, it, expect } from 'vitest';

import {
  VisualCardSelectorStepSchema,
  SizeBracketSelectorStepSchema,
  AnyStepSchema,
  isFieldStep,
} from '@/domain/config/wizard-config';

// ---------------------------------------------------------------------------
// VisualCardSelectorStep
// ---------------------------------------------------------------------------

const validVisualCard = {
  stepKind: 'visual-card-selector' as const,
  id: 'service_type',
  title: 'What type of service?',
  answerKey: 'service_type',
  options: [
    { id: 'patio', label: 'Patio' },
    { id: 'driveway', label: 'Driveway', imageUrl: 'https://example.test/driveway.jpg' },
  ],
};

describe('VisualCardSelectorStepSchema', () => {
  it('accepts a minimal valid visual-card step', () => {
    const result = VisualCardSelectorStepSchema.safeParse(validVisualCard);
    expect(result.success).toBe(true);
  });

  it('defaults multiple to false when omitted', () => {
    const result = VisualCardSelectorStepSchema.safeParse(validVisualCard);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.multiple).toBe(false);
    }
  });

  it('accepts multiple: true', () => {
    const result = VisualCardSelectorStepSchema.safeParse({ ...validVisualCard, multiple: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.multiple).toBe(true);
    }
  });

  it('accepts optional description and imageUrl on options', () => {
    const result = VisualCardSelectorStepSchema.safeParse({
      ...validVisualCard,
      description: 'Choose the service you need.',
      options: [
        {
          id: 'patio',
          label: 'Patio',
          imageUrl: 'https://example.test/patio.jpg',
          description: 'Block-paved outdoor area',
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects when options array is empty', () => {
    const result = VisualCardSelectorStepSchema.safeParse({ ...validVisualCard, options: [] });
    expect(result.success).toBe(false);
  });

  it('rejects when answerKey is missing', () => {
    const result = VisualCardSelectorStepSchema.safeParse({
      stepKind: 'visual-card-selector',
      id: 'service_type',
      title: 'What type of service?',
      options: [{ id: 'patio', label: 'Patio' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a classic field step (no stepKind)', () => {
    const fieldStep = {
      id: 's1',
      title: 'Step',
      fields: [{ id: 'f1', key: 'k', type: 'text', label: 'L', required: false }],
    };
    expect(VisualCardSelectorStepSchema.safeParse(fieldStep).success).toBe(false);
  });

  it('isFieldStep returns false for a visual-card step', () => {
    const result = VisualCardSelectorStepSchema.parse(validVisualCard);
    expect(isFieldStep(result)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// SizeBracketSelectorStep
// ---------------------------------------------------------------------------

const validSizeBracket = {
  stepKind: 'size-bracket-selector' as const,
  id: 'area_size',
  title: 'How large is the area?',
  answerKey: 'area_size',
  brackets: [
    { id: 'small', label: 'Small', minValue: 0, maxValue: 20, unit: 'm²' },
    { id: 'medium', label: 'Medium', minValue: 20, maxValue: 60, unit: 'm²' },
    { id: 'large', label: 'Large', minValue: 60, maxValue: 150, unit: 'm²' },
  ],
  exactPromptLabel: 'I know the exact size',
  exactFields: [{ id: 'area_m2', label: 'Area', unit: 'm²' }],
};

describe('SizeBracketSelectorStepSchema', () => {
  it('accepts a fully populated size-bracket step', () => {
    const result = SizeBracketSelectorStepSchema.safeParse(validSizeBracket);
    expect(result.success).toBe(true);
  });

  it('parses and preserves all bracket fields', () => {
    const result = SizeBracketSelectorStepSchema.parse(validSizeBracket);
    expect(result.brackets).toHaveLength(3);
    expect(result.brackets[0]?.id).toBe('small');
    expect(result.brackets[0]?.minValue).toBe(0);
  });

  it('rejects when brackets array is empty', () => {
    const result = SizeBracketSelectorStepSchema.safeParse({ ...validSizeBracket, brackets: [] });
    expect(result.success).toBe(false);
  });

  it('rejects when exactFields array is empty', () => {
    const result = SizeBracketSelectorStepSchema.safeParse({
      ...validSizeBracket,
      exactFields: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects when exactPromptLabel is an empty string', () => {
    const result = SizeBracketSelectorStepSchema.safeParse({
      ...validSizeBracket,
      exactPromptLabel: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a classic field step (no stepKind)', () => {
    const fieldStep = {
      id: 's1',
      title: 'Step',
      fields: [{ id: 'f1', key: 'k', type: 'number', label: 'L', required: true }],
    };
    expect(SizeBracketSelectorStepSchema.safeParse(fieldStep).success).toBe(false);
  });

  it('isFieldStep returns false for a size-bracket step', () => {
    const result = SizeBracketSelectorStepSchema.parse(validSizeBracket);
    expect(isFieldStep(result)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AnyStepSchema union — all three new kinds
// ---------------------------------------------------------------------------

describe('AnyStepSchema — visual-card and size-bracket variants', () => {
  it('parses a visual-card-selector step via the union', () => {
    expect(AnyStepSchema.safeParse(validVisualCard).success).toBe(true);
  });

  it('parses a size-bracket-selector step via the union', () => {
    expect(AnyStepSchema.safeParse(validSizeBracket).success).toBe(true);
  });
});
