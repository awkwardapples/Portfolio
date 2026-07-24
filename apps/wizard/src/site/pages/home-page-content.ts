import type { SectionConfig } from '../sections/types';
import homeHeroImage from '@/assets/images/service-hero-fencing.webp';

export const homePageContent: SectionConfig[] = [
  {
    kind: 'hero',
    id: 'hero',
    content: {
      heading:
        'From a leaky tap to a complete garden redesign, we handle your entire home to-do ' +
        'list with clear upfront pricing. Get your free, instant online estimate by ' +
        'clicking below!',
      subheading: 'Based in Guildford, we offer our services across Surrey and surrounding areas',
      primaryCta: { label: 'Get a free instant price estimate', href: '/quote' },
      secondaryCta: { label: 'Call us now', href: 'tel:07776066965' },
      backgroundImage: homeHeroImage,
      backgroundImageAlt: 'Newly installed timber fence panels along a landscaped garden border',
    },
  },
  {
    kind: 'intro',
    id: 'intro',
    content: {
      heading: 'Established 2006. Trusted Across Surrey.',
      body: 'Established in 2006 by a Merrist Wood trained landscape gardener, SCB Handyman Services can provide all types of home and garden maintenance — and many more besides. If you have any jobs you need doing around the house or garden, get in touch. No job is too small.',
      bulletPoints: [
        'Merrist Wood trained landscape gardener',
        '20 years of experience',
        'Fully insured',
        'No job too small',
      ],
      variant: 'credibility',
      cta: { label: 'Get a free instant price estimate', href: '/quote' },
    },
  },
  {
    kind: 'services-preview',
    id: 'services-preview',
    content: {
      heading: 'Our Services',
      subheading: 'Home and garden maintenance across Guildford, Surrey and surrounding areas.',
      services: [
        {
          serviceId: 'fencing',
          name: 'Fencing',
          description:
            'Professional fence installation including panels, posts, gates, and finishes.',
          iconOrImage: 'fencing',
          link: '/quote',
        },
        {
          serviceId: 'decking',
          name: 'Decking',
          description: 'Wooden and composite decking for gardens and outdoor spaces.',
          iconOrImage: 'decking',
          link: '/quote',
        },
        {
          serviceId: 'painting',
          name: 'Painting & Decorating',
          description: 'Interior painting and decoration — get an instant online quote.',
          iconOrImage: 'painting',
          link: '/quote',
        },
        {
          serviceId: 'patio',
          name: 'Patio & Paving',
          description: 'Natural stone and concrete slab patios with full sub-base preparation.',
          iconOrImage: 'patio',
          link: '/quote',
        },
        {
          serviceId: 'jetwash',
          name: 'Pressure Washing',
          description: 'Patios, driveways, and decking cleaned professionally.',
          iconOrImage: 'jetwash',
          link: '/quote',
        },
        {
          serviceId: 'general-repairs',
          name: 'General Repairs',
          description: 'Small repairs and odd jobs — describe your work for a custom quote.',
          iconOrImage: 'general-repairs',
          link: '/quote',
        },
      ],
      cta: { label: 'View all services', href: '/services' },
    },
  },
  {
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
  },
  {
    kind: 'projects',
    id: 'projects',
    content: {
      heading: 'Our Recent Work',
      subheading: 'See examples of recent home and garden projects across Surrey.',
      projects: [
        {
          id: 'p1',
          name: 'Garden fence installation',
          imageUrl: '/images/placeholder-fence-1.jpg',
          imageAlt: 'Wooden garden fence',
        },
        {
          id: 'p2',
          name: 'Decking installation',
          imageUrl: '/images/placeholder-deck-1.jpg',
          imageAlt: 'Wooden deck',
        },
        {
          id: 'p3',
          name: 'Boundary fencing',
          imageUrl: '/images/placeholder-fence-2.jpg',
          imageAlt: 'Boundary fence with gate',
        },
      ],
      cta: { label: 'View more of our work', href: '/our-work' },
    },
  },
  {
    kind: 'why-choose-us',
    id: 'why-choose-us',
    content: {
      heading: 'Why Choose SCB Handyman',
      valueProps: [
        {
          heading: 'Merrist Wood trained',
          description: 'Founded by a Merrist Wood trained landscape gardener.',
        },
        { heading: 'Established 2006', description: '20 years of experience across Surrey.' },
        { heading: 'No job too small', description: 'From full installations to small odd jobs.' },
        { heading: 'Reliable & on time', description: 'We turn up when we say we will.' },
        {
          heading: 'Transparent pricing',
          description: 'Clear, honest quotes with no hidden fees.',
        },
        { heading: 'Fully insured', description: 'All work completed safely and professionally.' },
      ],
      // Real, customer-supplied testimonials — verbatim except for trimming
      // each one's closing pleasantry/signature line (e.g. "With Thanks"),
      // which is correspondence formatting, not part of the testimonial
      // itself. Nothing here is invented.
      testimonials: [
        {
          quote:
            'SCB Handyman Services have recently completed works in our property and we can ' +
            'highly recommend them! From the initial contact, Shane has always been ' +
            'professional and friendly. His quote was the best we had by far and turnaround ' +
            'time was excellent, he also gave advice that saved us money! We have no ' +
            'hesitation in recommending SCB Handyman Services!',
          author: 'Graham Jones',
        },
        {
          quote: 'Thank you and Craig for a job well done, will use you again.',
          author: 'A Rickard',
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
          question: 'What areas do you cover?',
          answer:
            "We're based in Guildford and cover Surrey and surrounding areas. If you're outside this region, get in touch — we can often still help.",
        },
        {
          id: 'q2',
          question: 'Do you offer free quotes?',
          answer: 'Yes, all initial quotes are free via our online wizard or by phone.',
        },
        {
          id: 'q3',
          question: 'Are you fully insured?',
          answer: 'Yes, we are fully insured and our work is guaranteed.',
        },
        {
          id: 'q4',
          question: 'How soon can you start?',
          answer:
            'Typically within 2-3 weeks of accepting the quote. We will give a firm date when we quote.',
        },
        {
          id: 'q5',
          question: 'What services do you offer?',
          answer:
            'Fencing, decking, patios, driveways, garden steps, painting and decorating, pressure washing, and general handyman repairs including plumbing, electrical, and carpentry. No job is too small — see our services page for the full list.',
        },
      ],
      cta: { label: 'Get a free instant price estimate', href: '/quote' },
    },
  },
];
