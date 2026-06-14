export interface ValueProp {
  heading: string;
  description: string;
}

export interface WhyChooseUsContent {
  heading: string;
  subheading?: string;
  valueProps: ValueProp[];
  cta?: {
    label: string;
    href: string;
  };
}
