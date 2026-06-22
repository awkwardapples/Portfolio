/**
 * Services rendered on /services and previewed on /.
 *
 * Each entry is a service offered by this business. The id is stable for
 * future cross-referencing (e.g. matching a service entry to a wizard
 * vertical); the rest is editorial content.
 *
 * Step 5.9: expanded from 2 to 11 services covering the full handyman
 * service library (5 instant-quote + 4 manual-quote + 2 original instant).
 */

export interface ServiceEntry {
  readonly id: string;
  readonly name: string;
  readonly summary: string;
  readonly description: string;
}

export const services: readonly ServiceEntry[] = [
  // ---------------------------------------------------------------------------
  // Landscaping
  // ---------------------------------------------------------------------------
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
  {
    id: 'patio',
    name: 'Patio & Paving',
    summary: 'Patios and paved areas in a range of materials.',
    description:
      'Natural stone, Indian sandstone, and concrete slab patios. ' +
      'Full preparation including sub-base, edging, and drainage. ' +
      'Get an instant online quote for common paving materials.',
  },
  {
    id: 'driveway',
    name: 'Driveway',
    summary: 'Block paving and permeable driveway installations.',
    description:
      'Block paving driveways in Driveline 50, Tegula, and permeable Marshall Drivesys. ' +
      'Includes full excavation, sub-base preparation, kerb edging, and drainage. ' +
      'Get an instant online estimate.',
  },
  {
    id: 'steps',
    name: 'Garden Steps',
    summary: 'Outdoor steps in brick, stone, and granite.',
    description:
      'Garden and entrance steps in brick, slate, Portland stone, cast stone, or granite. ' +
      'Straight and curved designs. Threads and risers available. ' +
      'Priced per step with material premium.',
  },
  // ---------------------------------------------------------------------------
  // Decorating
  // ---------------------------------------------------------------------------
  {
    id: 'painting',
    name: 'Painting & Decorating',
    summary: 'Interior painting for homes and businesses.',
    description:
      'Walls, ceilings, skirting boards, doors, and window frames. ' +
      'Water-based and oil-based finishes. Standard and high-ceiling rooms. ' +
      'Get an instant quote based on room count.',
  },
  // ---------------------------------------------------------------------------
  // Exterior Cleaning
  // ---------------------------------------------------------------------------
  {
    id: 'jetwash',
    name: 'Pressure Washing',
    summary: 'Patios, driveways, and decking cleaned by pressure washer.',
    description:
      'Professional pressure washing for patios, driveways, paths, steps, and timber decking. ' +
      'Priced per square metre. Most jobs completed in a single visit.',
  },
  // ---------------------------------------------------------------------------
  // Handyman Services (manual-quote)
  // ---------------------------------------------------------------------------
  {
    id: 'general-repairs',
    name: 'General Repairs',
    summary: 'Small repairs and odd jobs around the home.',
    description:
      'General handyman repairs and maintenance — from fixing doors and gates to garden furniture and minor building work. ' +
      "Describe your job online and we'll send you a custom quote.",
  },
  {
    id: 'plumbing',
    name: 'Plumbing',
    summary: 'Leak fixes, blockages, fittings, and more.',
    description:
      'Plumbing repairs and installations including leaks, blocked drains, new fittings, and boiler services. ' +
      "Describe your job online and we'll provide a custom quote.",
  },
  {
    id: 'electrical',
    name: 'Electrical',
    summary: 'Lighting, sockets, fault diagnosis, and consumer units.',
    description:
      'Electrical work including new lighting, socket installation, fault diagnosis, and consumer unit upgrades. ' +
      "Describe your job online and we'll provide a custom quote.",
  },
  {
    id: 'carpentry',
    name: 'Carpentry',
    summary: 'Shelving, doors, furniture assembly, and custom builds.',
    description:
      'Carpentry and joinery including shelving, furniture assembly, internal doors, and bespoke builds. ' +
      "Describe your job online and we'll provide a custom quote.",
  },
] as const;
