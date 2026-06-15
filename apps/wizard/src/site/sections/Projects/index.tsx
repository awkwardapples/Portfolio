import { useState, useCallback } from 'react';
import ProjectsLayout from './Layout';
import type { ProjectsContent } from './types';

export interface ProjectsProps {
  content: ProjectsContent;
  id?: string;
  extraClassName?: string;
}

export const Projects = ({ content, id, extraClassName }: ProjectsProps) => {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = useCallback((projectId: string) => {
    setImageErrors((prev) => {
      const next = new Set(prev);
      next.add(projectId);
      return next;
    });
  }, []);

  return (
    <ProjectsLayout
      heading={content.heading}
      subheading={content.subheading}
      projects={content.projects}
      cta={content.cta}
      imageErrors={imageErrors}
      onImageError={handleImageError}
      sectionId={id}
      extraClassName={extraClassName}
    />
  );
};

export default Projects;
