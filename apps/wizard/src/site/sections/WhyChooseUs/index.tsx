import WhyChooseUsLayout from './Layout';
import type { WhyChooseUsContent } from './types';

export interface WhyChooseUsProps {
  content: WhyChooseUsContent;
  id?: string;
  extraClassName?: string;
}

export const WhyChooseUs = ({ content, id, extraClassName }: WhyChooseUsProps) => {
  return (
    <WhyChooseUsLayout
      heading={content.heading}
      subheading={content.subheading}
      valueProps={content.valueProps}
      cta={content.cta}
      sectionId={id}
      extraClassName={extraClassName}
    />
  );
};

export default WhyChooseUs;
