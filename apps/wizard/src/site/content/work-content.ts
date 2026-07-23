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
    id: 'garden-fence-install',
    title: 'Garden fence installation, Guildford',
    description:
      'Closeboard fencing installed along a rear garden boundary, including concrete posts ' +
      'and gravel boards. Old fence removed and disposed of as part of the job.',
    serviceId: 'fencing',
  },
  {
    id: 'composite-deck',
    title: 'Composite decking with steps',
    description:
      'Low-maintenance composite deck with integrated steps down to the garden, built on a ' +
      'timber substructure with a weatherproof finish.',
    serviceId: 'decking',
  },
  {
    id: 'patio-paving',
    title: 'Patio and paving, Surrey',
    description:
      'Indian sandstone patio laid with full sub-base preparation and edging, finished with ' +
      'block-edged borders for a clean, low-maintenance garden space.',
    serviceId: 'patio',
  },
  {
    id: 'general-repairs',
    title: 'General home repairs and maintenance',
    description:
      'A range of small jobs completed in a single visit — fixing a sticking gate, repairing ' +
      'garden fencing, and general maintenance around the property.',
    serviceId: 'general-repairs',
  },
] as const;
