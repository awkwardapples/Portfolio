import { SectionLink } from '@/site/routing/SectionLink';
import type { ProjectItem } from './types';

export interface ProjectsLayoutProps {
  heading: string;
  subheading?: string;
  projects: ProjectItem[];
  cta?: { label: string; href: string };
  imageErrors: Set<string>;
  onImageError: (projectId: string) => void;
  sectionId?: string;
  extraClassName?: string;
}

const ProjectsLayout = ({
  heading,
  subheading,
  projects,
  cta,
  imageErrors,
  onImageError,
  sectionId,
  extraClassName = '',
}: ProjectsLayoutProps) => {
  return (
    <section id={sectionId} className={`bg-surface py-16 ${extraClassName}`}>
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-xl font-semibold text-text">{heading}</h2>
        {subheading && <p className="mt-2 text-base text-text-muted">{subheading}</p>}
        <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {projects.map((project) => (
            <li key={project.id} className="overflow-hidden rounded border border-border">
              {imageErrors.has(project.id) ? (
                <div className="flex h-12 items-center justify-center bg-surface text-sm text-text-muted">
                  Image coming soon
                </div>
              ) : (
                <img
                  src={project.imageUrl}
                  alt={project.imageAlt}
                  onError={() => onImageError(project.id)}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              )}
              {project.description && (
                <div className="p-4">
                  <p className="text-sm font-medium text-text">{project.name}</p>
                  <p className="mt-1 text-sm text-text-muted">{project.description}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
        {cta && (
          <div className="mt-8">
            <SectionLink
              href={cta.href}
              className="inline-block rounded border border-primary bg-primary px-4 py-2 text-sm font-medium text-text-inverse"
            >
              {cta.label}
            </SectionLink>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProjectsLayout;
