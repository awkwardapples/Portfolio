import { cn } from '@/design/cn';
import { useScrollReveal, scrollRevealClassName } from '@/design/useScrollReveal';
import { UnderlineLink } from '@/components/primitives/UnderlineLink';
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

/**
 * Projects (Phase 7). The work itself is the visual emphasis — images are
 * no longer wrapped in a bordered "card" (`overflow-hidden rounded border
 * border-border` in the original implementation directly contradicted
 * design-bible.md §9: "no border, no shadow around images — let the image
 * edge be the edge"). Rounded corners stay (the one radius token, applied
 * to the image itself); the border and the extra wrapping div are gone.
 *
 * Deliberately not another Card-based grid — Services Preview already owns
 * that "bordered tile" silhouette. Once the border is removed, a grid of
 * borderless, consistently-cropped photographs reads as a different kind
 * of content (evidence of real work) even though the underlying grid
 * skeleton (3 columns, responsive) is structurally similar.
 */
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
  const { ref: headingRef, isVisible: headingVisible } = useScrollReveal<HTMLDivElement>();
  const { ref: gridRef, isVisible: gridVisible } = useScrollReveal<HTMLUListElement>();

  return (
    <section id={sectionId} className={cn('bg-surface-dark-raised py-20 lg:py-24', extraClassName)}>
      <div className="mx-auto max-w-5xl px-6">
        <div ref={headingRef} className={scrollRevealClassName(headingVisible)}>
          <h2 className="text-xl font-semibold text-text-inverse">{heading}</h2>
          {subheading && (
            <p className="mt-4 max-w-prose text-base text-text-inverse-muted">{subheading}</p>
          )}
        </div>

        <ul
          ref={gridRef}
          className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
          role="list"
        >
          {projects.map((project, index) => (
            <li key={project.id} className={scrollRevealClassName(gridVisible, index + 1)}>
              {imageErrors.has(project.id) ? (
                <div className="flex aspect-video items-center justify-center rounded bg-surface-dark-elevated text-sm text-text-inverse-muted">
                  Image coming soon
                </div>
              ) : (
                <img
                  src={project.imageUrl}
                  alt={project.imageAlt}
                  onError={() => onImageError(project.id)}
                  className="aspect-video w-full rounded object-cover"
                  loading="lazy"
                />
              )}
              <p className="mt-3 text-sm font-medium text-text-inverse">{project.name}</p>
              {project.description && (
                <p className="mt-1 text-sm text-text-inverse-muted">{project.description}</p>
              )}
            </li>
          ))}
        </ul>

        {cta && (
          <div className="mt-12">
            <UnderlineLink href={cta.href}>{cta.label}</UnderlineLink>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProjectsLayout;
