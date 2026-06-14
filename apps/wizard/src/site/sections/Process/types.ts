export interface ProcessStep {
  stepNumber: number;
  name: string;
  description: string;
}

export interface ProcessContent {
  heading: string;
  subheading?: string;
  steps: ProcessStep[];
  cta?: {
    label: string;
    href: string;
  };
}
