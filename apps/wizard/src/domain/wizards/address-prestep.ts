import type { Step } from '@/domain/config/wizard-config';

/**
 * Engine-level pre-step injected before every service wizard (ADR-0022).
 *
 * Field keys (contact_name, postcode, contact_phone, contact_email) are
 * intentionally shared with existing service contact/address steps so that
 * answers entered here carry forward automatically — the user is not asked
 * twice. FORMAT_VALIDATORS in answer-validation.ts validates postcode,
 * contact_phone, and contact_email on Next.
 */
export const addressPreStep: Step = {
  id: 'contact-and-address',
  title: 'Your details',
  fields: [
    {
      id: 'prestep-name',
      key: 'contact_name',
      type: 'text',
      label: 'Your name',
      required: true,
    },
    {
      id: 'prestep-postcode',
      key: 'postcode',
      type: 'text',
      label: 'Your postcode',
      help: 'e.g. SW1A 1AA',
      required: true,
    },
    {
      id: 'prestep-phone',
      key: 'contact_phone',
      type: 'text',
      label: 'Phone number',
      help: 'e.g. 07712 345678',
      required: true,
    },
    {
      id: 'prestep-email',
      key: 'contact_email',
      type: 'text',
      label: 'Email address',
      required: true,
    },
  ],
};
