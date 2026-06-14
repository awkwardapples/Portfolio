export interface ServicesPreviewItem {
  serviceId: string;
  name: string;
  description: string;
  iconOrImage?: string;
  link?: string;
}

export interface ServicesPreviewContent {
  heading: string;
  subheading?: string;
  services: ServicesPreviewItem[];
  cta?: {
    label: string;
    href: string;
  };
}
