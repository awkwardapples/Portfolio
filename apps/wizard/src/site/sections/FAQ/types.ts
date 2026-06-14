export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface FAQContent {
  heading: string;
  subheading?: string;
  items: FAQItem[];
  cta?: {
    label: string;
    href: string;
  };
}
