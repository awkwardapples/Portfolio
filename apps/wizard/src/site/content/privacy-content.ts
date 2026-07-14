/**
 * Privacy policy content (Step 5.14, ADR-0029). Edit this file to adapt the
 * policy for a new client — same convention as site-content.ts and
 * footer-content.ts. Business identity (name, email, address) is imported
 * directly from site-content.ts rather than duplicated here; there is no
 * separate {{PLACEHOLDER}} template (AUDIT-5.14-business-metadata.md).
 *
 * `lastUpdated` is a plain string, updated by hand whenever a section's
 * substance changes — there is no automated date-stamping anywhere in this
 * codebase to hook into.
 */

import { siteContent } from '@/site/content/site-content';

export interface PrivacyPolicySection {
  readonly id: string;
  readonly heading: string;
  readonly body: readonly string[];
}

export interface PrivacyPolicyContent {
  readonly lastUpdated: string;
  readonly sections: readonly PrivacyPolicySection[];
}

export const privacyContent: PrivacyPolicyContent = {
  lastUpdated: '14 July 2026',
  sections: [
    {
      id: 'who-we-are',
      heading: 'Who we are',
      body: [
        `${siteContent.businessName} ("we", "us", "our") operates this website and the quote ` +
          `request tool on it. This policy explains what personal data we collect when you ` +
          `request a quote, why we collect it, and what rights you have over it.`,
      ],
    },
    {
      id: 'what-we-collect',
      heading: 'What data we collect',
      body: [
        'When you submit a quote request, we collect: your name, phone number, email address, ' +
          'and postal address; details about the work you are requesting (service type, ' +
          'measurements, and any answers you give in the quote form); any photos you choose to ' +
          'upload of the project area; and technical metadata such as the date and time of your ' +
          'submission.',
      ],
    },
    {
      id: 'why-we-collect-it',
      heading: 'Why we collect it',
      body: [
        'We rely on legitimate interest as our lawful basis under UK GDPR: responding to a ' +
          'quote request you have actively submitted is a normal and expected part of running ' +
          'a trade business, and we only use your data for that purpose.',
      ],
    },
    {
      id: 'how-we-use-it',
      heading: 'How we use it',
      body: [
        'We use your data to prepare and send you a quote, to contact you about your request, ' +
          'and to keep a record of enquiries we have received. We do not use your data for ' +
          'marketing unless you separately agree to that.',
      ],
    },
    {
      id: 'who-we-share-it-with',
      heading: 'Who we share it with',
      body: [
        'We use a small number of third-party services to operate the quote tool: Cloudflare ' +
          '(Turnstile) to help distinguish real enquiries from automated spam; Make.com to route ' +
          'your enquiry into our internal systems; and WhatsApp Business (via Meta) to notify us ' +
          'that a new enquiry has arrived. These providers process data on our behalf and do not ' +
          'use it for their own purposes.',
      ],
    },
    {
      id: 'how-long-we-keep-it',
      heading: 'How long we keep it',
      body: [
        'We keep quote request records for up to 90 days, after which they are automatically ' +
          'deleted. Photos you upload are kept for up to 6 months to allow time for the work to ' +
          'be scoped and quoted, after which they are automatically deleted.',
      ],
    },
    {
      id: 'your-rights',
      heading: 'Your rights under UK GDPR',
      body: [
        'You have the right to: access the personal data we hold about you; ask us to correct ' +
          'it if it is inaccurate; ask us to delete it; and object to or restrict how we use it. ' +
          'You also have the right to complain to the Information Commissioner’s Office ' +
          '(ico.org.uk) if you believe we have not handled your data properly.',
      ],
    },
    {
      id: 'exercising-your-rights',
      heading: 'How to exercise your rights',
      body: [
        `To access, correct, or delete your data, contact us at ${siteContent.contact.email}. ` +
          'We will respond within 30 days.',
      ],
    },
    {
      id: 'contact-us',
      heading: 'Contact for data protection queries',
      body: [
        `${siteContent.businessName}`,
        siteContent.contact.address,
        `Email: ${siteContent.contact.email}`,
        `Phone: ${siteContent.contact.phone}`,
      ],
    },
    {
      id: 'policy-changes',
      heading: 'Changes to this policy',
      body: [
        'We may update this policy from time to time. The date at the top of this page shows ' +
          'when it was last revised.',
      ],
    },
  ],
};
