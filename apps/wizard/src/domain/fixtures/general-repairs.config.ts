/**
 * General repairs wizard configuration (Step 5.9).
 *
 * Manual-quote service (quoteMode: 'manual'). No pricing computed;
 * contractor reviews and provides a custom quote. Per ADR-0021 Decision 3,
 * all manual-quote services share a uniform step structure; only the
 * description prompt differs.
 *
 * Pricing: manualQuotePricingStub satisfies the Vertical type; never evaluated.
 */

import type { WizardConfig } from '@/domain/config/wizard-config';
import { manualQuotePricingStub } from '@/domain/fixtures/manual-quote-pricing-stub';

export const generalRepairsWizardConfig: WizardConfig = {
  schemaVersion: 1,
  id: 'general-repairs',
  quoteMode: 'manual',
  title: 'General repairs',
  steps: [
    {
      id: 'description',
      title: 'Describe the work',
      description: "Tell us what needs fixing and we'll get back to you with a custom quote.",
      fields: [
        {
          id: 'work_description',
          key: 'work_description',
          type: 'textarea',
          label: 'Please describe the repair work you need',
          help: 'The more detail you give, the more accurate our quote will be.',
          required: true,
        },
      ],
    },
    {
      id: 'urgency',
      title: 'Urgency',
      description: 'When do you need the work done?',
      fields: [
        {
          id: 'urgency',
          key: 'urgency',
          type: 'select',
          label: 'How soon do you need this?',
          required: true,
          options: [
            { value: 'emergency', label: 'Emergency — as soon as possible' },
            { value: 'this_week', label: 'Within this week' },
            { value: 'this_month', label: 'Within this month' },
            { value: 'flexible', label: "I'm flexible" },
          ],
        },
      ],
    },
    {
      id: 'property',
      title: 'Property type',
      description: 'Help us understand the nature of the job.',
      fields: [
        {
          id: 'property_type',
          key: 'property_type',
          type: 'select',
          label: 'Property type',
          required: true,
          options: [
            { value: 'residential', label: 'Residential' },
            { value: 'commercial', label: 'Commercial' },
          ],
        },
      ],
    },
    {
      id: 'site_photos',
      title: 'Photos',
      description: 'Add photos to help us understand the scope of the work.',
      fields: [
        {
          id: 'site_photos',
          key: 'site_photos',
          type: 'photo',
          label: 'Photos of the area (optional but helpful)',
          maxCount: 5,
          required: false,
          help: 'Up to 5 photos. We accept JPEG, PNG, and WebP.',
        },
      ],
    },
    {
      id: 'contact_preference',
      title: 'Contact preference',
      description: 'How would you like us to get in touch?',
      fields: [
        {
          id: 'contact_preference',
          key: 'contact_preference',
          type: 'radio',
          label: 'Preferred contact method',
          required: true,
          options: [
            { value: 'phone', label: 'Phone call' },
            { value: 'email', label: 'Email' },
            { value: 'either', label: 'Either is fine' },
          ],
        },
      ],
    },
    {
      id: 'contact',
      title: 'Your details',
      description: 'We will use these details to send you a quote.',
      fields: [
        {
          id: 'contact_name',
          key: 'contact_name',
          type: 'text',
          label: 'Your name',
          required: true,
        },
        {
          id: 'contact_phone',
          key: 'contact_phone',
          type: 'text',
          label: 'Phone number',
          required: false,
        },
        {
          id: 'contact_email',
          key: 'contact_email',
          type: 'text',
          label: 'Email address',
          required: true,
        },
      ],
    },
    {
      id: 'address',
      title: 'Your address',
      description: 'We need your postcode to confirm we cover your area.',
      fields: [
        {
          id: 'postcode',
          key: 'postcode',
          type: 'text',
          label: 'Postcode',
          required: true,
        },
      ],
    },
  ],
};

export const generalRepairsPricingConfig = manualQuotePricingStub;
