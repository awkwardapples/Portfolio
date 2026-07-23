/**
 * Site-wide content. Edit this file to adapt the template for a new client.
 *
 * All copy here is rendered by SiteShell (header/footer) and HomePage hero.
 * Per-section content lives in services-content.ts and work-content.ts.
 */

export interface SiteContent {
  readonly businessName: string;
  readonly tagline: string;
  readonly footerNote: string;
  readonly contact: {
    readonly phone: string;
    readonly email: string;
    readonly address: string;
    readonly hours: string;
  };
  readonly home: {
    readonly heading: string;
    readonly subheading: string;
    readonly intro: string;
  };
  readonly nav: {
    readonly ctaLabel: string;
  };
}

export const siteContent: SiteContent = {
  businessName: 'SCB Handyman',
  tagline: 'Based in Guildford, we offer our services across Surrey and surrounding areas.',
  footerNote:
    'Established 2006 by a Merrist Wood trained landscape gardener. Fully insured. References available.',
  contact: {
    phone: '07776 066965',
    email: 'shane@scbhandyman.co.uk',
    address: 'Guildford, Surrey, UK',
    hours: 'Mon–Fri: 9:00–17:00',
  },
  home: {
    heading: 'Guildford & Surrey Handyman and Garden Specialists',
    subheading:
      'Home and garden maintenance across Surrey and surrounding areas — no job too small.',
    intro:
      'Established in 2006 by a Merrist Wood trained landscape gardener, SCB Handyman Services ' +
      'provides all types of home and garden maintenance across Guildford, Surrey and the ' +
      'surrounding areas. From fencing and decking to general repairs — if you have a job that ' +
      'needs doing, get in touch.',
  },
  nav: {
    ctaLabel: 'Get a free quote',
  },
};
