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
  businessName: 'Acme Fencing',
  tagline: 'Fencing and landscaping across the South East.',
  footerNote: 'Family-run since 2008. Fully insured. References available.',
  contact: {
    phone: '01234 567 890',
    email: 'hello@example.com',
    address: 'Unit 4, Trade Park\nExample Town\nKT12 1AB',
    hours: 'Mon–Fri 8:00–18:00. Sat by appointment.',
  },
  home: {
    heading: 'Honest quotes for fences and decks.',
    subheading: 'Tell us what you need. Get a written estimate the same week.',
    intro:
      'We install fencing and decking for homes and small businesses across the area. ' +
      'Use the quote tool to describe your project — we will follow up with a written estimate.',
  },
  nav: {
    ctaLabel: 'Get a free quote',
  },
};
