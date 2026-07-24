/**
 * SEO service landing pages — one per specific, niche search phrase (not a
 * mirror of the 12-service wizard library). Each entry composes the same 9
 * conceptual sections using the existing home-page section library (Hero,
 * Intro ×4, Process, Projects, WhyChooseUs, FAQ) — no new section components.
 *
 * Phase 1 of the SEO landing-page implementation: content only. Routing
 * (routes.ts), the shared page renderer (ServiceLandingPage.tsx), the /quote
 * deep-link (?service=), and the PHP SEO/sitemap plumbing are later phases —
 * this file is not wired into the site yet.
 */

import type { SectionConfig } from '../sections/types';

/**
 * ServiceHero photography — imported as ES modules (not string literal
 * paths) so Vite's asset pipeline fingerprints and emits them alongside the
 * JS bundle (`assets/[name].[hash][extname]`, already configured in
 * vite.config.ts for exactly this purpose). This resolves correctly no
 * matter where the WordPress plugin's compiled assets are deployed, unlike
 * a hardcoded absolute path such as `/images/foo.jpg` (the convention
 * `Projects`' placeholder images still use, and the reason those have never
 * actually resolved to a real file in this project).
 */
import fencingHero from '@/assets/images/service-hero-fencing.webp';
import drivewayHero from '@/assets/images/service-hero-driveway.jpg';
import paintingHero from '@/assets/images/service-hero-painting.jpeg';
import jetwashHero from '@/assets/images/service-hero-jetwash.jpg';
import plumbingHero from '@/assets/images/service-hero-plumbing.webp';

export interface ServicePageEntry {
  /** URL slug, e.g. 'fence-panel-repair-guildford'. */
  readonly slug: string;
  /** Full path, e.g. '/services/fence-panel-repair-guildford'. */
  readonly path: string;
  /** Natural, location-free label for the /services directory list. */
  readonly navLabel: string;
  /** Wizard service this page's CTAs deep-link to and Related Projects filters by. */
  readonly serviceId: string;
  readonly seo: {
    readonly title: string;
    readonly description: string;
  };
  readonly sections: SectionConfig[];
}

/**
 * Reused verbatim on every landing page per the "reuse your existing
 * process" instruction — identical to the homepage's process section.
 */
const sharedProcessSection: SectionConfig = {
  kind: 'process',
  id: 'process',
  content: {
    heading: 'How It Works',
    steps: [
      {
        stepNumber: 1,
        name: 'Fill in our quote form',
        description: 'Tell us what you need via our online quote wizard.',
      },
      {
        stepNumber: 2,
        name: 'Receive a quote',
        description: 'We visit if needed and provide a competitive quote.',
      },
      {
        stepNumber: 3,
        name: 'We complete the job',
        description: 'Once you accept, we get to work and complete the project on schedule.',
      },
    ],
  },
};

export const servicePages: readonly ServicePageEntry[] = [
  // ---------------------------------------------------------------------------
  // 1. Fence Panel Repair & Replacement — "Replace broken fence panels quickly"
  // ---------------------------------------------------------------------------
  {
    slug: 'fence-panel-repair-guildford',
    path: '/services/fence-panel-repair-guildford',
    navLabel: 'Fence Panel Repair',
    serviceId: 'fencing',
    seo: {
      title: 'Fence Panel Repair & Replacement in Guildford — SCB Handyman',
      description:
        'Fast, reliable fence panel repair and replacement across Guildford and Surrey. ' +
        'Matching styles, secure posts, and honest quotes from SCB Handyman.',
    },
    sections: [
      {
        kind: 'service-hero',
        id: 'hero',
        content: {
          heading: 'Fence Panel Repair & Replacement in Guildford',
          subheading:
            'Broken, leaning, or storm-damaged fence panels replaced quickly by SCB Handyman — ' +
            'covering Guildford, Surrey and surrounding areas.',
          primaryCta: {
            label: 'Get a free instant price estimate',
            href: '/quote?service=fencing',
          },
          secondaryCta: { label: 'Call Now', href: 'tel:07776066965' },
          heroImage: fencingHero,
          heroImageAlt: 'Newly installed timber fence panels along a landscaped garden border',
        },
      },
      {
        kind: 'intro',
        id: 'problem',
        content: {
          heading: 'Broken Fence Panels Fixed Without The Hassle',
          body:
            'A broken or leaning fence panel is more than an eyesore — it’s a security gap, ' +
            'a safety risk for children and pets, and it only gets worse after the next storm. ' +
            'Sourcing a matching panel, digging out a rotten post, and getting it upright and ' +
            'secure is fiddly work that eats a weekend fast. SCB Handyman sorts it in a single ' +
            'visit, so you’re not left with a gap in your boundary any longer than necessary.',
          variant: 'checklist',
        },
      },
      {
        kind: 'intro',
        id: 'intro',
        content: {
          heading: 'Reliable Fence Panel Repairs Across Guildford & Surrey',
          body:
            'Established in 2006 by a Merrist Wood trained landscape gardener, SCB Handyman ' +
            'repairs and replaces fence panels for homeowners, landlords and businesses across ' +
            'Guildford, Surrey and the surrounding areas. Whether it’s a single storm-damaged ' +
            'panel or a full run that needs replacing, we match your existing fence style where ' +
            'possible and make sure posts and gravel boards are sound before the new panel goes in.',
          variant: 'checklist',
        },
      },
      {
        kind: 'intro',
        id: 'what-we-help-with',
        content: {
          heading: 'Fence Panel Repair Services Include',
          body: 'Whatever style of fence you have, we can usually repair or replace it:',
          bulletPoints: [
            'Feather edge panel replacement',
            'Closeboard panel repair',
            'Panel fence replacement',
            'Chain link fence repair',
            'Rotten or leaning post replacement',
            'Gravel board replacement',
            'Gate repair and realignment',
          ],
          variant: 'checklist',
        },
      },
      {
        kind: 'intro',
        id: 'who-we-help',
        content: {
          heading: 'Ideal For',
          body: 'Our fence repair service is used regularly by:',
          bulletPoints: [
            'Homeowners',
            'Landlords',
            'Tenants (with landlord approval)',
            'Letting and property managers',
            'Businesses with boundary fencing',
          ],
          variant: 'checklist',
        },
      },
      sharedProcessSection,
      {
        kind: 'projects',
        id: 'related-projects',
        content: {
          heading: 'Recent Fence Panel Repairs',
          subheading: 'A recent example of our fence repair work in Guildford.',
          projects: [
            {
              id: 'garden-fence-install',
              name: 'Garden Fence Panel Replacement, Guildford',
              description:
                'Problem: a storm-damaged closeboard panel left a gap in the rear garden ' +
                'boundary. Solution: replaced the panel and gravel board on the existing ' +
                'concrete posts in a single visit.',
              imageUrl: '/images/placeholder-fence-1.jpg',
              imageAlt: 'Replaced closeboard fence panel in a Guildford garden',
            },
          ],
        },
      },
      {
        kind: 'why-choose-us',
        id: 'why-choose-us',
        content: {
          heading: 'Why Choose SCB Handyman for Fence Repairs',
          valueProps: [
            {
              heading: 'Merrist Wood trained',
              description:
                'Founded by a Merrist Wood trained landscape gardener with 20 years’ experience.',
            },
            {
              heading: 'Fast turnaround',
              description: 'Most single-panel repairs completed in one visit.',
            },
            {
              heading: 'Matching materials',
              description: 'We match your existing fence style and height wherever possible.',
            },
            {
              heading: 'Fully insured',
              description: 'All work carried out safely and professionally.',
            },
            {
              heading: 'Honest, upfront pricing',
              description: 'Clear quotes with no hidden extras.',
            },
          ],
        },
      },
      {
        kind: 'faq',
        id: 'faq',
        content: {
          heading: 'Frequently Asked Questions',
          items: [
            {
              id: 'q1',
              question: 'Can you match my existing fence panels?',
              answer:
                'In most cases, yes. Let us know the style (feather edge, closeboard, panel, ' +
                'or chain link) and we will match it as closely as possible.',
            },
            {
              id: 'q2',
              question: 'How quickly can you replace a broken panel?',
              answer:
                'Most single-panel repairs are completed within a week of your quote being ' +
                'accepted, and we can prioritise storm-damage repairs where needed.',
            },
            {
              id: 'q3',
              question: 'Do you replace the posts as well as the panel?',
              answer:
                'If a post is rotten or unstable, we will replace it alongside the panel so ' +
                'the repair is secure long-term.',
            },
            {
              id: 'q4',
              question: 'Do you cover all of Surrey, or just Guildford?',
              answer:
                'We’re based in Guildford and cover Surrey and surrounding areas — get in ' +
                'touch if you’re just outside this region.',
            },
          ],
          cta: { label: 'Get a free instant price estimate', href: '/quote?service=fencing' },
        },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 2. Block Paving Driveways — "Instant online quote for block paving"
  // ---------------------------------------------------------------------------
  {
    slug: 'block-paving-guildford',
    path: '/services/block-paving-guildford',
    navLabel: 'Block Paving',
    serviceId: 'driveway',
    seo: {
      title: 'Block Paving Driveways in Guildford — SCB Handyman',
      description:
        'Instant online quotes for block paving driveways across Guildford and Surrey. ' +
        'Driveline 50, Tegula and permeable Marshall Drivesys installed by SCB Handyman.',
    },
    sections: [
      {
        kind: 'service-hero',
        id: 'hero',
        content: {
          heading: 'Block Paving Driveways in Guildford',
          subheading:
            'Get an instant online quote for a new block paving driveway — Driveline 50, ' +
            'Tegula, or permeable Marshall Drivesys, installed across Guildford and Surrey.',
          primaryCta: {
            label: 'Get a free instant price estimate',
            href: '/quote?service=driveway',
          },
          secondaryCta: { label: 'Call Now', href: 'tel:07776066965' },
          heroImage: drivewayHero,
          heroImageAlt: 'Newly installed grey block paving driveway outside a house',
        },
      },
      {
        kind: 'intro',
        id: 'problem',
        content: {
          heading: 'A Tired Driveway Without The Guesswork',
          body:
            'Cracked concrete, sunken slabs, or a gravel driveway that never quite looks tidy ' +
            '— a worn driveway is often the first thing visitors see. Getting a like-for-like ' +
            'quote from multiple driveway contractors usually means several site visits and a ' +
            'wait for written quotes. Our online wizard gives you an instant estimate for block ' +
            'paving based on your driveway’s size and material, so you know roughly what to ' +
            'expect before you even pick up the phone.',
          variant: 'checklist',
        },
      },
      {
        kind: 'intro',
        id: 'intro',
        content: {
          heading: 'Block Paving Across Guildford & Surrey',
          body:
            'SCB Handyman installs block paving driveways for homeowners, landlords and ' +
            'property managers across Guildford, Surrey and the surrounding areas. Every job ' +
            'includes full excavation, sub-base preparation, kerb edging and drainage, finished ' +
            'with your choice of block paving style.',
          variant: 'checklist',
        },
      },
      {
        kind: 'intro',
        id: 'what-we-help-with',
        content: {
          heading: 'Block Paving Services Include',
          body: 'Popular driveway options we install:',
          bulletPoints: [
            'Driveline 50 block paving',
            'Tegula style textured block paving',
            'Permeable Marshall Drivesys driveways',
            'Resin bound driveways',
            'Kerb edging',
            'Driveway steps',
            'Full sub-base preparation and drainage',
          ],
          variant: 'checklist',
        },
      },
      {
        kind: 'intro',
        id: 'who-we-help',
        content: {
          heading: 'Ideal For',
          body: 'Our driveway service is used regularly by:',
          bulletPoints: [
            'Homeowners',
            'Landlords',
            'Property managers',
            'Businesses needing customer parking',
            'New-build and renovation projects',
          ],
          variant: 'checklist',
        },
      },
      sharedProcessSection,
      // No Related Projects section — no matching work-content entry yet.
      {
        kind: 'why-choose-us',
        id: 'why-choose-us',
        content: {
          heading: 'Why Choose SCB Handyman for Block Paving',
          valueProps: [
            {
              heading: 'Instant online estimate',
              description:
                'Get a price range in minutes, based on your driveway size and material.',
            },
            {
              heading: 'Full preparation included',
              description:
                'Excavation, sub-base, edging and drainage as standard — not an afterthought.',
            },
            {
              heading: 'Permeable options available',
              description: 'Marshall Drivesys and resin bound driveways for sustainable drainage.',
            },
            {
              heading: 'Fully insured',
              description: 'All work carried out safely and professionally.',
            },
            {
              heading: 'Established 2006',
              description: '20 years of experience across Surrey.',
            },
          ],
        },
      },
      {
        kind: 'faq',
        id: 'faq',
        content: {
          heading: 'Frequently Asked Questions',
          items: [
            {
              id: 'q1',
              question: 'How much does a block paving driveway cost?',
              answer:
                'It depends on the size and material — use our online quote wizard for an ' +
                'instant estimate, or contact us for a firm quote after a site visit.',
            },
            {
              id: 'q2',
              question: 'What’s the difference between Driveline 50, Tegula and resin bound?',
              answer:
                'Driveline 50 and Tegula are both block paving styles with different textures ' +
                'and price points; resin bound is a smooth, permeable poured surface. We can ' +
                'talk through which suits your driveway.',
            },
            {
              id: 'q3',
              question: 'Do you offer permeable driveways?',
              answer:
                'Yes — Marshall Drivesys permeable block paving is available, which can help ' +
                'with drainage and planning requirements.',
            },
            {
              id: 'q4',
              question: 'How long does a driveway installation take?',
              answer:
                'Most residential driveways are completed within a few days, depending on size ' +
                'and ground conditions.',
            },
          ],
          cta: { label: 'Get a free instant price estimate', href: '/quote?service=driveway' },
        },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 3. Painter & Decorator for High Ceilings — "Painter and decorator for high ceilings"
  // ---------------------------------------------------------------------------
  {
    slug: 'high-ceiling-painter-decorator-guildford',
    path: '/services/high-ceiling-painter-decorator-guildford',
    navLabel: 'Painting for High Ceilings',
    serviceId: 'painting',
    seo: {
      title: 'Painter & Decorator for High Ceilings — Guildford',
      description:
        'Professional interior painting and decorating for high and vaulted ceilings across ' +
        'Guildford and Surrey. Instant online quote by room count from SCB Handyman.',
    },
    sections: [
      {
        kind: 'service-hero',
        id: 'hero',
        content: {
          heading: 'Painter & Decorator for High Ceilings in Guildford',
          subheading:
            'Professional interior painting and decorating for homes and businesses across ' +
            'Guildford and Surrey — including rooms with high or vaulted ceilings.',
          primaryCta: {
            label: 'Get a free instant price estimate',
            href: '/quote?service=painting',
          },
          secondaryCta: { label: 'Call Now', href: 'tel:07776066965' },
          heroImage: paintingHero,
          heroImageAlt:
            'A freshly painted room prepared with dust sheets, a paint tray and a step ladder',
        },
      },
      {
        kind: 'intro',
        id: 'problem',
        content: {
          heading: 'High Ceilings, Painted Properly',
          body:
            'Painting a room with a high or vaulted ceiling isn’t a job for a stepladder and ' +
            'a Saturday afternoon — reaching awkward angles safely, avoiding streaks on long ' +
            'unbroken wall runs, and getting an even finish overhead all take the right ' +
            'equipment and experience. SCB Handyman brings the right access equipment and a ' +
            'steady hand, so you get a clean, even finish without the risk of doing it yourself.',
          variant: 'checklist',
        },
      },
      {
        kind: 'intro',
        id: 'intro',
        content: {
          heading: 'Interior Painting & Decorating Across Guildford & Surrey',
          body:
            'We provide interior painting and decorating for homes, landlords and offices ' +
            'across Guildford, Surrey and the surrounding areas — from single rooms to full ' +
            'properties, including walls, ceilings, skirting boards, doors and window frames.',
          variant: 'checklist',
        },
      },
      {
        kind: 'intro',
        id: 'what-we-help-with',
        content: {
          heading: 'Painting & Decorating Services Include',
          body: 'Instant online quote based on room count — we cover:',
          bulletPoints: [
            'Interior wall painting',
            'Ceiling painting, including high and vaulted ceilings',
            'Skirting board and window frame painting',
            'Door painting',
            'Water-based and oil-based finishes',
            'Surface repairs and patching before painting',
          ],
          variant: 'checklist',
        },
      },
      {
        kind: 'intro',
        id: 'who-we-help',
        content: {
          heading: 'Ideal For',
          body: 'Our painting and decorating service is used regularly by:',
          bulletPoints: [
            'Homeowners',
            'Landlords preparing a property to let',
            'Tenants (with landlord approval)',
            'Offices and small businesses',
            'Property managers',
          ],
          variant: 'checklist',
        },
      },
      sharedProcessSection,
      // No Related Projects section — no matching work-content entry yet.
      {
        kind: 'why-choose-us',
        id: 'why-choose-us',
        content: {
          heading: 'Why Choose SCB Handyman for Painting & Decorating',
          valueProps: [
            {
              heading: 'High-ceiling experience',
              description:
                'Proper access equipment for safe, even coverage on tall or vaulted ceilings.',
            },
            {
              heading: 'Instant online quote',
              description: 'Get an estimate based on room count in minutes.',
            },
            {
              heading: 'Tidy, careful work',
              description: 'Furniture covered and floors protected as standard.',
            },
            {
              heading: 'Fully insured',
              description: 'All work carried out safely and professionally.',
            },
            {
              heading: 'Established 2006',
              description: '20 years of experience across Surrey.',
            },
          ],
        },
      },
      {
        kind: 'faq',
        id: 'faq',
        content: {
          heading: 'Frequently Asked Questions',
          items: [
            {
              id: 'q1',
              question: 'Can you paint high or vaulted ceilings?',
              answer:
                'Yes — we bring the right access equipment to safely and evenly paint high ' +
                'and vaulted ceilings.',
            },
            {
              id: 'q2',
              question: 'Do I need to supply the paint?',
              answer:
                'Either way works — let us know during your quote whether you would like to ' +
                'supply your own paint or have us provide it.',
            },
            {
              id: 'q3',
              question: 'How long does painting a room take?',
              answer:
                'A standard room is usually completed within a day; larger rooms, high ' +
                'ceilings, or multiple rooms may take longer — your quote will confirm timings.',
            },
            {
              id: 'q4',
              question: 'Do you move furniture before painting?',
              answer:
                'We can move and cover furniture as part of the job — just let us know when ' +
                'you get your quote.',
            },
          ],
          cta: { label: 'Get a free instant price estimate', href: '/quote?service=painting' },
        },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 4. Driveway & Decking Pressure Washing — "Jet wash driveway and timber decking"
  // ---------------------------------------------------------------------------
  {
    slug: 'driveway-decking-pressure-washing-guildford',
    path: '/services/driveway-decking-pressure-washing-guildford',
    navLabel: 'Pressure Washing',
    serviceId: 'jetwash',
    seo: {
      title: 'Driveway & Decking Pressure Washing — Guildford',
      description:
        'Professional pressure washing for driveways, patios and timber decking across ' +
        'Guildford and Surrey. Instant online quote from SCB Handyman.',
    },
    sections: [
      {
        kind: 'service-hero',
        id: 'hero',
        content: {
          heading: 'Driveway & Decking Pressure Washing in Guildford',
          subheading:
            'Professional pressure washing for driveways, patios, and timber decking across ' +
            'Guildford and Surrey — most jobs completed in a single visit.',
          primaryCta: {
            label: 'Get a free instant price estimate',
            href: '/quote?service=jetwash',
          },
          secondaryCta: { label: 'Call Now', href: 'tel:07776066965' },
          heroImage: jetwashHero,
          heroImageAlt:
            'A pressure washer cleaning a patio, showing the clean surface against the dirty stone',
        },
      },
      {
        kind: 'intro',
        id: 'problem',
        content: {
          heading: 'Green, Slippery Surfaces Made Safe Again',
          body:
            'Moss, algae and general grime build up on driveways, patios and timber decking ' +
            'year after year — making them slippery underfoot and tired-looking. Hiring or ' +
            'buying pressure washing equipment capable of doing the job properly, without ' +
            'damaging block paving joints or timber decking, is expensive and easy to get ' +
            'wrong. SCB Handyman has the right equipment and settings for each surface type, ' +
            'so you get a thorough clean without the damage risk.',
          variant: 'checklist',
        },
      },
      {
        kind: 'intro',
        id: 'intro',
        content: {
          heading: 'Pressure Washing Across Guildford & Surrey',
          body:
            'We provide professional pressure washing for driveways, patios, paths, steps and ' +
            'timber decking for homes and businesses across Guildford, Surrey and the ' +
            'surrounding areas. Get an instant online quote based on the size and surface type ' +
            'of the area to be cleaned.',
          variant: 'checklist',
        },
      },
      {
        kind: 'intro',
        id: 'what-we-help-with',
        content: {
          heading: 'Pressure Washing Services Include',
          body: 'We clean:',
          bulletPoints: [
            'Driveway pressure washing',
            'Patio and paving pressure washing',
            'Timber decking pressure washing',
            'Paths and steps',
            'Moss and algae removal',
            'Instant online quote by square metre',
          ],
          variant: 'checklist',
        },
      },
      {
        kind: 'intro',
        id: 'who-we-help',
        content: {
          heading: 'Ideal For',
          body: 'Our pressure washing service is used regularly by:',
          bulletPoints: [
            'Homeowners',
            'Landlords',
            'Property managers',
            'Businesses with customer-facing outdoor areas',
            'Anyone preparing a property for sale or let',
          ],
          variant: 'checklist',
        },
      },
      sharedProcessSection,
      // No Related Projects section — no matching work-content entry yet.
      {
        kind: 'why-choose-us',
        id: 'why-choose-us',
        content: {
          heading: 'Why Choose SCB Handyman for Pressure Washing',
          valueProps: [
            {
              heading: 'Right equipment for the surface',
              description:
                'Careful settings for block paving, natural stone, and timber decking alike.',
            },
            {
              heading: 'Instant online quote',
              description: 'Get an estimate by square metre in minutes.',
            },
            {
              heading: 'Single-visit jobs',
              description: 'Most driveways and patios completed in one visit.',
            },
            {
              heading: 'Fully insured',
              description: 'All work carried out safely and professionally.',
            },
            {
              heading: 'Established 2006',
              description: '20 years of experience across Surrey.',
            },
          ],
        },
      },
      {
        kind: 'faq',
        id: 'faq',
        content: {
          heading: 'Frequently Asked Questions',
          items: [
            {
              id: 'q1',
              question: 'Can pressure washing damage my block paving or decking?',
              answer:
                'Not when done correctly — we use the right pressure and technique for each ' +
                'surface, including timber decking, to clean thoroughly without causing damage.',
            },
            {
              id: 'q2',
              question: 'How much does driveway pressure washing cost?',
              answer:
                'It depends on the size and surface type — use our online quote wizard for an ' +
                'instant estimate by square metre.',
            },
            {
              id: 'q3',
              question: 'How long does it take?',
              answer:
                'Most driveways and patios are completed in a single visit, usually within a ' +
                'few hours depending on size.',
            },
            {
              id: 'q4',
              question: 'Do you remove moss and algae as well as general dirt?',
              answer: 'Yes, moss and algae removal is included as standard as part of the clean.',
            },
          ],
          cta: { label: 'Get a free instant price estimate', href: '/quote?service=jetwash' },
        },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 5. Emergency Plumbing Leak Repairs — "Emergency plumbing leak repair surrey"
  // ---------------------------------------------------------------------------
  {
    slug: 'emergency-plumbing-leak-repair-surrey',
    path: '/services/emergency-plumbing-leak-repair-surrey',
    navLabel: 'Emergency Plumbing Repairs',
    serviceId: 'plumbing',
    seo: {
      title: 'Emergency Plumbing Leak Repairs — Surrey | SCB Handyman',
      description:
        'Fast response emergency plumbing leak repairs across Surrey and surrounding areas. ' +
        'Describe your problem online for a quick custom quote from SCB Handyman.',
    },
    sections: [
      {
        kind: 'service-hero',
        id: 'hero',
        content: {
          heading: 'Emergency Plumbing Leak Repairs in Surrey',
          subheading:
            'Fast response for leaking pipes, taps and fittings across Surrey and surrounding ' +
            'areas — describe the problem online and we will be in touch with a quote shortly.',
          primaryCta: {
            label: 'Get a free instant price estimate',
            href: '/quote?service=plumbing',
          },
          secondaryCta: { label: 'Call Now', href: 'tel:07776066965' },
          heroImage: plumbingHero,
          heroImageAlt: 'A plumber using a wrench on copper pipework and a boiler',
        },
      },
      {
        kind: 'intro',
        id: 'problem',
        content: {
          heading: 'A Leak Doesn’t Wait — Neither Do We',
          body:
            'A leaking pipe, tap or fitting can quickly turn into water damage, a rising water ' +
            'bill, or a bathroom out of action — and finding a reliable plumber at short notice ' +
            'is stressful. SCB Handyman responds quickly to leak call-outs across Surrey, ' +
            'diagnosing the fault and getting it fixed with minimal disruption.',
          variant: 'checklist',
        },
      },
      {
        kind: 'intro',
        id: 'intro',
        content: {
          heading: 'Plumbing Repairs Across Surrey',
          body:
            'We provide plumbing repairs for homeowners, landlords and tenants across Surrey ' +
            'and surrounding areas, including leak repairs, blocked drains, fitting ' +
            'replacements and boiler servicing. Describe your problem online and we will be ' +
            'in touch with a custom quote.',
          variant: 'checklist',
        },
      },
      {
        kind: 'intro',
        id: 'what-we-help-with',
        content: {
          heading: 'Plumbing Services Include',
          body: 'We help with:',
          bulletPoints: [
            'Emergency leak repairs',
            'Dripping and faulty taps',
            'Blocked drains',
            'New fittings and fixtures',
            'Boiler servicing',
            'General plumbing repairs and maintenance',
          ],
          variant: 'checklist',
        },
      },
      {
        kind: 'intro',
        id: 'who-we-help',
        content: {
          heading: 'Ideal For',
          body: 'Our plumbing service is used regularly by:',
          bulletPoints: [
            'Homeowners',
            'Landlords',
            'Tenants',
            'Letting and property managers',
            'Businesses with plumbing faults',
          ],
          variant: 'checklist',
        },
      },
      sharedProcessSection,
      // No Related Projects section — no matching work-content entry yet.
      {
        kind: 'why-choose-us',
        id: 'why-choose-us',
        content: {
          heading: 'Why Choose SCB Handyman for Plumbing Repairs',
          valueProps: [
            {
              heading: 'Fast response',
              description: 'We prioritise leak repairs and respond quickly to urgent call-outs.',
            },
            {
              heading: 'Honest diagnosis',
              description: 'Clear explanation of the fault and the fix, with no unnecessary work.',
            },
            {
              heading: 'Fully insured',
              description: 'All work carried out safely and professionally.',
            },
            {
              heading: 'Established 2006',
              description: '20 years of experience across Surrey.',
            },
            {
              heading: 'No job too small',
              description: 'From a single dripping tap to a full fitting replacement.',
            },
          ],
        },
      },
      {
        kind: 'faq',
        id: 'faq',
        content: {
          heading: 'Frequently Asked Questions',
          items: [
            {
              id: 'q1',
              question: 'Do you offer emergency plumbing call-outs?',
              answer:
                'Yes — get in touch and describe the problem, and we will respond as quickly ' +
                'as possible for urgent leaks.',
            },
            {
              id: 'q2',
              question: 'Do you provide an instant quote for plumbing work?',
              answer:
                'Plumbing jobs vary too much for an instant online price — describe your ' +
                'problem via our online form and we will follow up with a custom quote, ' +
                'usually after a quick call or visit.',
            },
            {
              id: 'q3',
              question: 'What areas of Surrey do you cover?',
              answer:
                'We’re based in Guildford and cover Surrey and surrounding areas — get in ' +
                'touch if you’re unsure whether we cover you.',
            },
            {
              id: 'q4',
              question: 'Do you fix dripping taps and blocked drains too?',
              answer:
                'Yes, alongside emergency leak repairs we handle dripping taps, blocked ' +
                'drains, new fittings and general plumbing maintenance.',
            },
          ],
          cta: { label: 'Get a free instant price estimate', href: '/quote?service=plumbing' },
        },
      },
    ],
  },
] as const;
