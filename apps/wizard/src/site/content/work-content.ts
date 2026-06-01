/**
 * Portfolio entries rendered on /our-work.
 *
 * Image paths reference assets imported by OurWorkPage; for v1 these are
 * placeholder entries that a cloner replaces with real client photos.
 * No image processing — static imports only.
 */

export interface WorkEntry {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly serviceId: string;
}

export const works: readonly WorkEntry[] = [
  {
    id: 'closeboard-garden',
    title: 'Closeboard garden fence (20m)',
    description:
      '20 linear metres of 1.8m closeboard fencing replacing an old panel fence. ' +
      'Concrete posts and gravel boards. Two-day install.',
    serviceId: 'fencing',
  },
  {
    id: 'composite-deck',
    title: 'Composite deck with integrated steps',
    description:
      '24 square metre composite deck with three-step access and balustrade. ' +
      'Hardwood substructure, weatherproof finish.',
    serviceId: 'decking',
  },
  {
    id: 'panel-replacement',
    title: 'Panel fence replacement (35m)',
    description:
      'Full perimeter replacement on a corner plot. Concrete posts, ' +
      'feather-edge panels, two access gates.',
    serviceId: 'fencing',
  },
] as const;
