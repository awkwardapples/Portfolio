import type { FooterContent } from '../Footer/types';

export const footerContent: FooterContent = {
  businessName: 'Acme Fencing',
  copyrightYear: 2026,
  copyrightText: 'Acme Fencing. All rights reserved.',

  address: '123 Garden Lane\nGuildford, Surrey GU1 1AA',
  phones: [{ number: '01234 567 890' }],
  emails: [{ address: 'hello@example.com' }],
  hours: 'Mon–Fri: 8:00–18:00\nSat: 9:00–14:00\nSun: Closed',
  serviceArea: 'Serving Surrey and surrounding areas',

  social: {
    facebook: 'https://facebook.com/acmefencing',
    instagram: 'https://instagram.com/acmefencing',
  },

  legalLinks: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
};
