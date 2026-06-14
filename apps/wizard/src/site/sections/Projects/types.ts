export interface ProjectItem {
  id: string;
  name: string;
  description?: string;
  imageUrl: string;
  imageAlt: string;
}

export interface ProjectsContent {
  heading: string;
  subheading?: string;
  projects: ProjectItem[];
  cta?: {
    label: string;
    href: string;
  };
}
