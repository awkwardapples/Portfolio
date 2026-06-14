import type { SectionConfig } from '../sections/types';

export const homePageContent: SectionConfig[] = [
  {
    kind: 'hero',
    id: 'hero',
    content: {
      heading: 'Acme Fencing',
      subheading: 'Professional fencing services across the south east',
      primaryCta: { label: 'Get a free quote', href: '/quote' },
      secondaryCta: { label: 'Call us now', href: 'tel:01234567890' },
    },
  },
  {
    kind: 'intro',
    id: 'intro',
    content: {
      heading: 'Built by Specialists. Trusted Locally.',
      body: 'Acme Fencing was founded to provide high-quality fencing solutions for homeowners and businesses across the south east. Our team brings years of experience delivering durable, attractive, and well-installed fencing.',
      bulletPoints: [
        'Satisfaction guarantee',
        'Fast turnaround',
        'Fully insured & qualified',
        'Local & reliable',
      ],
      cta: { label: 'Get a free quote', href: '/quote' },
    },
  },
  {
    kind: 'services-preview',
    id: 'services-preview',
    content: {
      heading: 'Our Services',
      subheading: 'Fast, reliable service for homes and businesses.',
      services: [
        {
          serviceId: 'fencing',
          name: 'Fencing',
          description:
            'Professional fence installation including panels, posts, gates, and finishes.',
          link: '/quote',
        },
        {
          serviceId: 'decking',
          name: 'Decking',
          description: 'Wooden and composite decking installation for gardens and outdoor spaces.',
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
      subheading: 'See examples of recent installations.',
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
      heading: 'Why Choose Acme Fencing',
      valueProps: [
        { heading: 'Specialist expertise', description: 'Years of experience installing fencing.' },
        { heading: 'Reliable & on time', description: 'We turn up when we say we will.' },
        {
          heading: 'Domestic & commercial',
          description: 'Trusted by homeowners, landlords, and businesses.',
        },
        { heading: 'Quality workmanship', description: 'Clean, precise, long-lasting results.' },
        {
          heading: 'Transparent pricing',
          description: 'Clear, honest quotes with no hidden fees.',
        },
        { heading: 'Fully insured', description: 'All work completed safely and professionally.' },
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
            "We cover the south east of England. If you're outside this region, get in touch — we can often still help.",
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
          question: 'What types of fencing do you install?',
          answer:
            'Panel fencing, post-and-rail, picket, chain link, gates, and more. See our services page for the full list.',
        },
      ],
      cta: { label: 'Get a free quote', href: '/quote' },
    },
  },
];
