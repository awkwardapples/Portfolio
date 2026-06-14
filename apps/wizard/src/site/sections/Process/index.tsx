import ProcessLayout from './Layout';
import type { ProcessContent } from './types';

export interface ProcessProps {
  content: ProcessContent;
  id?: string;
  extraClassName?: string;
}

export const Process = ({ content, id, extraClassName }: ProcessProps) => {
  return (
    <ProcessLayout
      heading={content.heading}
      subheading={content.subheading}
      steps={content.steps}
      cta={content.cta}
      sectionId={id}
      extraClassName={extraClassName}
    />
  );
};

export default Process;
