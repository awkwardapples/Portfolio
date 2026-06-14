export interface HeroContent {
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
  backgroundImage?: string;
  backgroundImageAlt?: string;
}
