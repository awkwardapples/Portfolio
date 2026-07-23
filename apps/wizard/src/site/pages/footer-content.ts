import type { FooterContent } from '../Footer/types';

export const footerContent: FooterContent = {
  businessName: 'SCB Handyman',
  copyrightYear: 2026,
  copyrightText: 'SCB Handyman. All rights reserved.',

  address: 'Guildford, Surrey, UK',
  phones: [{ number: '07776 066965' }],
  emails: [{ address: 'shane@scbhandyman.co.uk' }],
  hours: 'Mon–Fri: 9:00–17:00',
  serviceArea: 'Surrey and surrounding areas',

  social: {
    linkedin: 'https://www.linkedin.com/in/shane-butcher-69a19838/',
  },

  legalLinks: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
};
