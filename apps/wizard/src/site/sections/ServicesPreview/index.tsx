import ServicesPreviewLayout from './Layout';
import type { ServicesPreviewContent } from './types';

export interface ServicesPreviewProps {
  content: ServicesPreviewContent;
  id?: string;
  extraClassName?: string;
}

export const ServicesPreview = ({ content, id, extraClassName }: ServicesPreviewProps) => {
  return (
    <ServicesPreviewLayout
      heading={content.heading}
      subheading={content.subheading}
      services={content.services}
      cta={content.cta}
      sectionId={id}
      extraClassName={extraClassName}
    />
  );
};

export default ServicesPreview;
