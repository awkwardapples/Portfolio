/** Display names for threads (spec F.4), shared by the log, work pages and filters. */
export const THREAD_LABELS = {
  ai: 'AI',
  research: 'Research',
  software: 'Software',
  venture: 'Venture',
  music: 'Music',
  university: 'University',
  life: 'Life',
} as const;

export type Thread = keyof typeof THREAD_LABELS;
