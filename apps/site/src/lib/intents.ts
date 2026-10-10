/**
 * "What brings you here?" (spec G.0, I.2). The four answers on the homepage
 * threshold; the contact wizard (Pass 6) uses the same wording. Ids are the
 * contract (stored in localStorage as `jl:intent`); labels can change freely.
 * Music is not an answer (Josh, 7 October 2026): it is a hobby, and its
 * section is there for everyone who scrolls.
 */
export const INTENT_KEY = 'jl:intent';

export interface Intent {
  readonly value: 'hiring' | 'research' | 'experience' | 'looking';
  readonly label: string;
  readonly description?: string;
  /** The homepage section the answer leads to. */
  readonly target: string;
}

export const INTENTS: readonly Intent[] = [
  {
    value: 'hiring',
    label: "I'm hiring",
    description: 'Selected work, experience and my CV',
    target: 'selected-work',
  },
  {
    value: 'research',
    label: 'Research',
    description: 'Papers, my dissertation and experiments',
    target: 'research',
  },
  {
    value: 'experience',
    label: 'What experience do you have?',
    description: 'GrowTrades, Mercor and a music start-up',
    target: 'growtrades',
  },
  { value: 'looking', label: 'Just looking around', target: 'intro' },
];

export type IntentValue = Intent['value'];
