/**
 * The GrowTrades submission pipeline, step by step, each with the code that
 * does it, cut from this repository at build time (src/lib/excerpt.ts fails
 * the build if the code moves), and the decision record behind it.
 */
import botProtection from '../../../../edge/src/security/bot-protection.ts?raw';
import consent from '../../../../edge/src/security/consent.ts?raw';
import rateLimit from '../../../../edge/src/security/rate-limit.ts?raw';
import sanitize from '../../../../edge/src/security/sanitize.ts?raw';
import turnstile from '../../../../edge/src/security/turnstile.ts?raw';
import scheduled from '../../../../edge/src/scheduled.ts?raw';
import duplicates from '../../../../edge/src/submissions/duplicates.ts?raw';
import forwarder from '../../../../edge/src/submissions/forwarder.ts?raw';
import submit from '../../../../edge/src/submit.ts?raw';

import { excerpt } from '~/lib/excerpt';

import type { PipelineStep } from './types';

const REPO = 'https://github.com/awkwardapples/Portfolio/blob/main';

function step(
  title: string,
  text: string,
  file: string,
  code: string,
  adr: { number: string; slug: string; title: string },
): PipelineStep {
  return {
    title,
    text,
    links: [
      { href: `${REPO}/${file}`, label: file.split('/').pop() ?? file },
      { href: `${REPO}/docs/decisions/${adr.slug}.md`, label: `ADR-${adr.number}: ${adr.title}` },
    ],
    artefacts: [{ caption: file, code }],
  };
}

export const GROWTRADES_STEPS: PipelineStep[] = [
  step(
    'Honeypot',
    'A field people never see. Anything that fills it in is turned away quietly, before any other work is done.',
    'apps/edge/src/security/bot-protection.ts',
    excerpt(botProtection, '// Layer 1', "errorCode: 'honeypot_filled' };", {
      after: 1,
      file: 'bot-protection.ts',
    }),
    { number: '0027', slug: '0027-bot-protection', title: 'Bot protection' },
  ),
  step(
    'Rate limit',
    'Five messages an hour from one connection. The window keeps its original end time however many messages arrive, and the address is stored only as a keyed hash.',
    'apps/edge/src/security/rate-limit.ts',
    excerpt(rateLimit, 'async record(key', 'expiresAt: entry.expiresAt', {
      after: 1,
      file: 'rate-limit.ts',
    }),
    { number: '0027', slug: '0027-bot-protection', title: 'Bot protection' },
  ),
  step(
    'Turnstile',
    "Cloudflare's check that a person is using the form. A token only counts if it was issued for this site and this form.",
    'apps/edge/src/security/turnstile.ts',
    excerpt(turnstile, 'export function turnstileMatches(', 'return true;', {
      after: 1,
      file: 'turnstile.ts',
    }),
    {
      number: '0038',
      slug: '0038-skip-and-submit-turnstile-gating',
      title: 'Turnstile gates both submit buttons',
    },
  ),
  step(
    'Consent',
    'Nothing is stored unless the consent box was ticked, checked on the server so a request that skips the form cannot skip it.',
    'apps/edge/src/security/consent.ts',
    excerpt(consent, 'export function isConsentGiven', 'includes(CONSENT_VALUE)', {
      after: 1,
      file: 'consent.ts',
    }),
    { number: '0029', slug: '0029-data-protection', title: 'Data protection' },
  ),
  step(
    'Duplicates',
    'A second message from the same email within 24 hours is kept and flagged, but the owner is not notified twice.',
    'apps/edge/src/submissions/duplicates.ts',
    excerpt(duplicates, 'export async function checkDuplicate', 'originalSubmissionId: match }', {
      after: 1,
      file: 'duplicates.ts',
    }),
    { number: '0028', slug: '0028-duplicate-prevention', title: 'Duplicate prevention' },
  ),
  step(
    'Persist before forward',
    'Every enquiry is saved before anything else happens, so a failure further along can never lose a customer.',
    'apps/edge/src/submit.ts',
    excerpt(submit, 'let id: number;', "errorCode: 'persistence_failed' }", {
      after: 1,
      file: 'submit.ts',
    }),
    {
      number: '0001',
      slug: '0001-thin-wp-rest-endpoint',
      title: 'A thin endpoint that persists first',
    },
  ),
  step(
    'Formula-injection sanitising',
    'The copy that goes to the spreadsheet is cleaned: markup removed, and anything a spreadsheet would run as a formula made inert. The stored original is untouched.',
    'apps/edge/src/security/sanitize.ts',
    excerpt(sanitize, 'function sanitizeText', 'return text;', { after: 1, file: 'sanitize.ts' }),
    { number: '0037', slug: '0037-security-posture', title: 'Security posture' },
  ),
  step(
    'Forward',
    'The enquiry goes to the automation that writes the spreadsheet row and notifies the owner, signed with a shared secret. A failure is retried later.',
    'apps/edge/src/submissions/forwarder.ts',
    excerpt(forwarder, 'export async function forward', 'transport_error', {
      after: 3,
      file: 'forwarder.ts',
    }),
    { number: '0043', slug: '0043-submission-pipeline-port', title: 'The pipeline on the Worker' },
  ),
  step(
    'Retention',
    'Enquiries are deleted after 90 days, and rate-limit records as soon as their hour is over.',
    'apps/edge/src/scheduled.ts',
    excerpt(scheduled, 'export async function pruneExpired', 'deleteExpiredRateLimits(Math.floor', {
      after: 2,
      file: 'scheduled.ts',
    }),
    { number: '0043', slug: '0043-submission-pipeline-port', title: 'The pipeline on the Worker' },
  ),
];
