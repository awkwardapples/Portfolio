/**
 * Domain layer public surface.
 *
 * The pure, framework-agnostic core: config schemas, inferred types, the field
 * registry, and validation entry points. No React, no DOM, no presentation.
 */

// Field registry
export { FIELD_TYPES, isFieldType, type FieldType } from '@/domain/config/field-types';

// Schemas + inferred types
export {
  WizardConfigSchema,
  StepSchema,
  FieldSchema,
  ConditionSchema,
  type WizardConfig,
  type Step,
  type Field,
  type Condition,
} from '@/domain/config/wizard-config';
export {
  PricingConfigSchema,
  type PricingConfig,
  type PricingModifier,
  type PricingExtra,
  type PricingRuleMatch,
} from '@/domain/config/pricing';
export {
  PublicConfigSchema,
  CONTRACT_VERSION,
  type PublicConfig,
} from '@/domain/config/public-config';

// Validation
export {
  validateWizardConfig,
  validatePricingConfig,
  validatePublicConfig,
} from '@/domain/validation/validate';
export {
  formatPath,
  formatReport,
  issuesFromZodError,
  type ValidationIssue,
  type ValidationResult,
} from '@/domain/validation/errors';
