/**
 * "What brings you here?" as wizard configurations (spec I.2, I.3;
 * ADR-0042): one manual-mode WizardConfig per intent, in a closed registry
 * like the wizard's verticals.ts. The contact island renders them and the
 * Worker validates submissions against the same objects, so the browser and
 * the server can never disagree about what a valid answer is.
 *
 * Ids and option values are contracts (stored, forwarded to Make.com, used
 * as Sheet columns); labels are copy and can change freely. The draft
 * questions come from the spec; the hiring choices come from Josh's CV.
 *
 * This file must stay importable by the Worker: no Astro, no DOM, no site
 * aliases (`~`), only types from the wizard engine.
 */
import type { AnyStep, Field, WizardConfig } from '@/domain/config/wizard-config';

export const CONTACT_INTENT_IDS = ['hiring', 'research', 'growtrades', 'music', 'other'] as const;
export type ContactIntentId = (typeof CONTACT_INTENT_IDS)[number];

/**
 * The threshold's answers (src/lib/intents.ts) map onto these. "What experience
 * do you have?" and "just looking" become "other": the form asks what the
 * visitor wants to talk about rather than assuming.
 */
export const INTENT_FROM_THRESHOLD = {
  hiring: 'hiring',
  research: 'research',
  experience: 'other',
  looking: 'other',
} as const satisfies Record<string, ContactIntentId>;

/** The selector's labels on /contact, forwarded as intent_label. */
export const INTENT_LABELS: Record<ContactIntentId, string> = {
  hiring: "I'm hiring",
  research: 'Research',
  growtrades: "I'm interested in GrowTrades",
  music: 'Music',
  other: 'Something else',
};

export const INTENT_DESCRIPTIONS: Record<ContactIntentId, string> = {
  hiring: 'A role or consulting work to talk about',
  research: 'A collaboration, a paper or an academic opportunity',
  growtrades: 'A question about GrowTrades',
  music: 'Contact me',
  other: 'Anything else',
};

/** Lengths the browser and the Worker both enforce (spec Q.2: over-long strings are rejected). */
const SHORT = 120;
const LONG = 5000;

const option = (value: string, label: string) => ({ value, label });

function text(key: string, label: string, required: boolean, maxLength = SHORT): Field {
  return { id: key, key, type: 'text', label, required, maxLength };
}

function choice(
  key: string,
  label: string,
  options: { value: string; label: string }[],
  type: 'radio' | 'checkbox' = 'radio',
): Field {
  return { id: key, key, type, label, required: true, options };
}

/** Your details (spec I.2 step 4), with the contact field ids the Worker's checks rely on. */
function detailsStep({
  askOrganisation,
  messageRequired,
}: {
  askOrganisation: boolean;
  messageRequired: boolean;
}): AnyStep {
  return {
    id: 'details',
    title: 'Your details',
    description: 'So I can reply to you. Nothing is sent until the last step.',
    fields: [
      text('contact_name', 'Your name', true),
      text('contact_email', 'Email address', true, 254),
      ...(askOrganisation ? [text('organisation', 'Organisation (optional)', false)] : []),
      {
        id: 'message',
        key: 'message',
        type: 'textarea',
        label: messageRequired ? 'Your message' : 'Anything to add? (optional)',
        required: messageRequired,
        maxLength: LONG,
      },
      {
        id: 'data_processing_consent',
        key: 'data_processing_consent',
        type: 'checkbox',
        label: 'Consent',
        required: true,
        options: [option('agreed', 'I agree to my details being used to reply to this message.')],
        help: 'Your message is stored for 90 days and sent to my inbox.',
        helpLink: { label: 'Privacy notice', href: '/privacy' },
      },
    ],
  };
}

/** Optional details with "Skip and send" (spec I.2 step 5). Turnstile renders here. */
const optionalStep: AnyStep = {
  id: 'optional',
  title: 'Anything else?',
  description: 'Optional. Skip this if there is nothing to add.',
  allowSkip: true,
  fields: [
    {
      id: 'anything_else',
      key: 'anything_else',
      type: 'textarea',
      label: 'Anything else I should know?',
      required: false,
      maxLength: LONG,
    },
    {
      id: 'reply_window',
      key: 'reply_window',
      type: 'radio',
      label: 'When would a reply suit you?',
      required: false,
      options: [
        option('any-time', 'Any time'),
        option('this-week', 'This week'),
        option('next-month', 'Within the next month'),
      ],
    },
  ],
};

function result(
  selection: 'featured' | 'research' | 'venture' | 'music',
  title: string,
  description: string,
): AnyStep {
  return {
    stepKind: 'content-result',
    id: 'result',
    title,
    description,
    selection,
    continueLabel: 'Send Josh a message',
    exitLabel: 'Keep exploring',
  };
}

const RESULT_DESCRIPTION = 'Before you write, this is the most relevant work on the site.';

export const CONTACT_WIZARDS: Readonly<Record<ContactIntentId, WizardConfig>> = Object.freeze({
  hiring: {
    schemaVersion: 1,
    id: 'hiring',
    title: INTENT_LABELS.hiring,
    quoteMode: 'manual',
    steps: [
      {
        id: 'role',
        title: 'The role',
        fields: [
          choice('work_type', 'What kind of work?', [
            option('ai-engineering', 'AI engineering'),
            option('llm-evaluation', 'LLM evaluation'),
            option('ai-automation', 'AI automation'),
            option('agentic-ai', 'Agentic AI'),
            option('data-science', 'Data science'),
            option('something-else', 'Something else'),
          ]),
          choice('arrangement', 'What kind of arrangement?', [
            option('full-time', 'Full-time'),
            option('graduate-scheme', 'Graduate scheme'),
            option('contract', 'Contract'),
            option('consulting', 'Consulting'),
            option('research-position', 'Research position'),
          ]),
        ],
      },
      {
        id: 'where',
        title: 'Where',
        fields: [
          text('organisation', 'Organisation (optional)', false),
          {
            ...text('role_link', 'Link to the role (optional)', false, 500),
            help: 'A full web address, starting https://',
          },
        ],
      },
      result('featured', 'Work to look at first', RESULT_DESCRIPTION),
      detailsStep({ askOrganisation: false, messageRequired: true }),
      optionalStep,
    ],
  },
  research: {
    schemaVersion: 1,
    id: 'research',
    title: INTENT_LABELS.research,
    quoteMode: 'manual',
    steps: [
      {
        id: 'topic',
        title: 'About your research question',
        fields: [
          choice('research_topic', "What's this about?", [
            option('collaboration', 'A collaboration'),
            option('paper-question', 'A question about one of my papers'),
            option('academic-opportunity', 'An academic opportunity'),
            option('speaking-or-writing', 'Speaking or writing'),
            option('something-else', 'Something else'),
          ]),
          text('which_work', 'Which piece of work? (optional)', false, 200),
        ],
      },
      result('research', 'My research', RESULT_DESCRIPTION),
      detailsStep({ askOrganisation: true, messageRequired: true }),
      optionalStep,
    ],
  },
  growtrades: {
    schemaVersion: 1,
    id: 'growtrades',
    title: INTENT_LABELS.growtrades,
    quoteMode: 'manual',
    steps: [
      {
        id: 'question',
        title: 'About GrowTrades',
        fields: [
          {
            id: 'growtrades_question',
            key: 'growtrades_question',
            type: 'textarea',
            label: 'What would you like to know?',
            required: true,
            maxLength: LONG,
          },
        ],
      },
      result('venture', 'GrowTrades', RESULT_DESCRIPTION),
      detailsStep({ askOrganisation: true, messageRequired: true }),
      optionalStep,
    ],
  },
  music: {
    schemaVersion: 1,
    id: 'music',
    title: INTENT_LABELS.music,
    quoteMode: 'manual',
    steps: [
      {
        id: 'topic',
        title: 'About music',
        fields: [
          choice('music_topic', "What's this about?", [
            option('booking', 'A booking or a gig'),
            option('collaboration', 'A collaboration'),
            option('licensing', 'Licensing or sync'),
            option('hello', 'Just saying hello'),
          ]),
        ],
      },
      result('music', 'Music', RESULT_DESCRIPTION),
      detailsStep({ askOrganisation: true, messageRequired: true }),
      optionalStep,
    ],
  },
  other: {
    schemaVersion: 1,
    id: 'other',
    title: INTENT_LABELS.other,
    quoteMode: 'manual',
    steps: [
      {
        id: 'topic',
        title: 'What would you like to talk about?',
        fields: [
          {
            id: 'topic',
            key: 'topic',
            type: 'textarea',
            label: 'What would you like to talk about?',
            required: true,
            maxLength: LONG,
          },
        ],
      },
      result('featured', 'Selected work', RESULT_DESCRIPTION),
      detailsStep({ askOrganisation: true, messageRequired: false }),
      optionalStep,
    ],
  },
});

export function isContactIntent(value: unknown): value is ContactIntentId {
  return typeof value === 'string' && (CONTACT_INTENT_IDS as readonly string[]).includes(value);
}
