import ProjectsLayout from './Layout';
import type { ProjectsContent } from './types';

export interface ProjectsProps {
  content: ProjectsContent;
  id?: string;
  extraClassName?: string;
}

export const Projects = ({ content, id, extraClassName }: ProjectsProps) => {
  return (
    <ProjectsLayout
      heading={content.heading}
      subheading={content.subheading}
      projects={content.projects}
      cta={content.cta}
      sectionId={id}
      extraClassName={extraClassName}
    />
  );
};

export default Projects;
