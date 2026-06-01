/**
 * Services rendered on /services and previewed on /.
 *
 * Each entry is a service offered by this business. The id is stable for
 * future cross-referencing (e.g. matching a service entry to a wizard
 * vertical); the rest is editorial content.
 */

export interface ServiceEntry {
  readonly id: string;
  readonly name: string;
  readonly summary: string;
  readonly description: string;
}

export const services: readonly ServiceEntry[] = [
  {
    id: 'fencing',
    name: 'Fencing',
    summary: 'Garden, boundary, and security fencing.',
    description:
      'We install closeboard, feather edge, panel, and post-and-rail fencing. ' +
      'Heights from low decorative up to security boundary fencing. ' +
      'Most jobs completed in one to two days.',
  },
  {
    id: 'decking',
    name: 'Decking',
    summary: 'Garden decks in softwood, hardwood, or composite.',
    description:
      'Garden decking from small balcony platforms to large entertaining spaces. ' +
      'We work in softwood, hardwood, and modern composite materials. ' +
      'Includes substructure, balustrade, and integrated steps where needed.',
  },
] as const;
