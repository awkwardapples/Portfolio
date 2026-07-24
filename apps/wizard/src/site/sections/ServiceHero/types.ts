export interface ServiceHeroContent {
  heading: string;
  subheading: string;
  primaryCta: {
    label: string;
    href: string;
  };
  secondaryCta?: {
    label: string;
    href: string;
  };
  heroImage: string;
  heroImageAlt: string;
}
