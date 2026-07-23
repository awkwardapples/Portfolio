import type { ReactElement } from 'react';
import { Hero } from '@/site/sections/Hero';
import { Intro } from '@/site/sections/Intro';
import { ServicesPreview } from '@/site/sections/ServicesPreview';
import { Process } from '@/site/sections/Process';
import { Projects } from '@/site/sections/Projects';
import { WhyChooseUs } from '@/site/sections/WhyChooseUs';
import { FAQ } from '@/site/sections/FAQ';
import type { SectionConfig } from '@/site/sections/types';

/**
 * Shared section renderer. Maps a SectionConfig onto its section component.
 * Used by any page that composes the section library (HomePage today;
 * ServiceLandingPage from Step 6.8 onward) so the section-kind switch exists
 * in exactly one place.
 */
export function renderSection(section: SectionConfig): ReactElement | null {
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
