export interface FooterContact {
  label?: string;
  number: string;
}

export interface FooterEmail {
  label?: string;
  address: string;
}

export interface FooterSocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
}

export interface FooterLegalLink {
  label: string;
  href: string;
}

export interface FooterContent {
  // Required
  businessName: string;
  copyrightYear: number;
  copyrightText: string;

  // Optional contact
  address?: string;
  phones?: FooterContact[];
  emails?: FooterEmail[];
  hours?: string;
  serviceArea?: string;

  // Optional social
  social?: FooterSocialLinks;

  // Optional legal/utility links
  legalLinks?: FooterLegalLink[];
}
