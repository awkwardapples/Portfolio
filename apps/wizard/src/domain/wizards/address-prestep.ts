import type { Step } from '@/domain/config/wizard-config';

/**
 * Engine-level pre-step injected before every service wizard (ADR-0022).
 *
 * Reduced in Step 5.13c to postcode-only. Full contact details (name, phone,
 * email, full address) are collected at the end of instant-quote wizards in
 * the per-service contact-and-address step.
 *
 * Postcode is collected upfront to enable area-based lead filtering and to
 * auto-fill any postcode field in subsequent steps via the shared key.
 * FORMAT_VALIDATORS in answer-validation.ts validates the format on Next.
 */
export const addressPreStep: Step = {
  id: 'postcode_prestep',
  title: "Where's your project located?",
  description: 'Enter your postcode to get started with your quote.',
  fields: [
    {
      id: 'prestep-postcode',
      key: 'postcode',
      type: 'text',
      label: 'Your postcode',
      help: 'e.g. SW1A 1AA',
      required: true,
    },
  ],
};
