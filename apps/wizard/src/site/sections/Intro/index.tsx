import IntroLayout from './Layout';
import type { IntroContent } from './types';

export interface IntroProps {
  content: IntroContent;
  id?: string;
  extraClassName?: string;
}

export const Intro = ({ content, id, extraClassName }: IntroProps) => {
  return (
    <IntroLayout
      heading={content.heading}
      body={content.body}
      bulletPoints={content.bulletPoints}
      cta={content.cta}
      sectionId={id}
      extraClassName={extraClassName}
    />
  );
};

export default Intro;
