import type { ReactElement } from 'react';
import { Hero } from '@/site/sections/Hero';
import { Intro } from '@/site/sections/Intro';
import { ServicesPreview } from '@/site/sections/ServicesPreview';
import { Process } from '@/site/sections/Process';
import { Projects } from '@/site/sections/Projects';
import { WhyChooseUs } from '@/site/sections/WhyChooseUs';
import { FAQ } from '@/site/sections/FAQ';
import type { SectionConfig } from '@/site/sections/types';
import { homePageContent } from './home-page-content';

function renderSection(section: SectionConfig): ReactElement | null {
  const { id, extraClassName } = section;
  switch (section.kind) {
    case 'hero':
      return <Hero key={id} content={section.content} id={id} extraClassName={extraClassName} />;
    case 'intro':
      return <Intro key={id} content={section.content} id={id} extraClassName={extraClassName} />;
    case 'services-preview':
      return (
        <ServicesPreview
          key={id}
          content={section.content}
          id={id}
          extraClassName={extraClassName}
        />
      );
    case 'process':
      return <Process key={id} content={section.content} id={id} extraClassName={extraClassName} />;
    case 'projects':
      return (
        <Projects key={id} content={section.content} id={id} extraClassName={extraClassName} />
      );
    case 'why-choose-us':
      return (
        <WhyChooseUs key={id} content={section.content} id={id} extraClassName={extraClassName} />
      );
    case 'faq':
      return <FAQ key={id} content={section.content} id={id} extraClassName={extraClassName} />;
    default:
      return null;
  }
}

export function HomePage(): ReactElement {
  return <div>{homePageContent.map((section) => renderSection(section))}</div>;
}
