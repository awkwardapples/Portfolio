export interface IntroContent {
  heading: string;
  body: string;
  bulletPoints?: string[];
  cta?: {
    label: string;
    href: string;
  };
}
