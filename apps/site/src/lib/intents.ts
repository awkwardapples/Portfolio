/**
 * "What brings you here?" (spec G.0, I.2). The five answers on the homepage
 * threshold; the contact wizard (Pass 6) uses the same wording. Ids are the
 * contract (stored in localStorage as `jl:intent`); labels can change freely.
 */
export const INTENT_KEY = 'jl:intent';

export interface Intent {
  readonly value: 'hiring' | 'research' | 'experience' | 'music' | 'looking';
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
    description: 'GrowTrades and a live client site',
    target: 'growtrades',
  },
  {
    value: 'music',
    label: 'Music',
    description: 'Releases, videos and performances',
    target: 'music',
  },
  { value: 'looking', label: 'Just looking around', target: 'intro' },
];

export type IntentValue = Intent['value'];
