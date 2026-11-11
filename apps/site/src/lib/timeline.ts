/**
 * The about page's timeline (spec L, N.9): education, experience, work and
 * posts in one list. Josh's order comes first (the profile's `timeline`,
 * oldest first); anything not in it follows by date. Periods sort by their
 * start, single pieces of work and posts by their date. Pure, so it is
 * unit-tested.
 */
export interface TimelineItem {
  kind: 'education' | 'experience' | 'work' | 'post';
  /** How the profile's `timeline` names it: work:arbiter, education:A Levels. */
  key: string;
  /** Used for ordering only. */
  sortKey: string;
  /** As shown: "2021 to 2025", "August 2025". */
  when: string;
  title: string;
  subtitle?: string | undefined;
  href?: string | undefined;
  details: string[];
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** "2024-03" to "March 2024"; "2024" stays "2024". */
export function yearMonthLabel(value: string): string {
  const [year, month] = value.split('-');
  return month ? `${MONTHS[Number(month) - 1] ?? month} ${year}` : (year ?? value);
}

/** "2021 to 2025", "2026 to 2027 (in progress)", "March 2024 to now", and "2025" for 2025 to 2025. */
export function periodLabel(
  start: string,
  end: string | undefined,
  inProgress = false,
  format: (value: string) => string = yearMonthLabel,
): string {
  if (end === start && !inProgress) return format(start);
  const range = end ? `${format(start)} to ${format(end)}` : `${format(start)} to now`;
  return inProgress && end ? `${range} (in progress)` : range;
}

export function newestFirst(items: readonly TimelineItem[]): TimelineItem[] {
  return [...items].sort((a, b) => b.sortKey.localeCompare(a.sortKey));
}

/**
 * Oldest first, in the given order of keys; items the order does not name
 * follow it, oldest first by date. Keys that match nothing are ignored.
 */
export function inOrder(items: readonly TimelineItem[], order: readonly string[]): TimelineItem[] {
  const position = new Map(order.map((key, index) => [key, index]));
  const listed = items
    .filter((item) => position.has(item.key))
    .sort((a, b) => (position.get(a.key) ?? 0) - (position.get(b.key) ?? 0));
  const rest = items
    .filter((item) => !position.has(item.key))
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  return [...listed, ...rest];
}
