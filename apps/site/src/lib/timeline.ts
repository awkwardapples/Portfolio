/**
 * The about page's timeline (spec L, N.9): education, experience, work and
 * posts in one list, newest first. Periods sort by their start, single
 * pieces of work and posts by their date. Pure, so it is unit-tested.
 */
export interface TimelineItem {
  kind: 'education' | 'experience' | 'work' | 'post';
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

/** "2021 to 2025", "2026 to 2027 (in progress)", "March 2024 to now". */
export function periodLabel(
  start: string,
  end: string | undefined,
  inProgress = false,
  format: (value: string) => string = yearMonthLabel,
): string {
  const range = end ? `${format(start)} to ${format(end)}` : `${format(start)} to now`;
  return inProgress && end ? `${range} (in progress)` : range;
}

export function newestFirst(items: readonly TimelineItem[]): TimelineItem[] {
  return [...items].sort((a, b) => b.sortKey.localeCompare(a.sortKey));
}
