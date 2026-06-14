import type { HeroContent } from './Hero/types';
import type { IntroContent } from './Intro/types';
import type { ServicesPreviewContent } from './ServicesPreview/types';
import type { ProcessContent } from './Process/types';
import type { ProjectsContent } from './Projects/types';
import type { WhyChooseUsContent } from './WhyChooseUs/types';
import type { FAQContent } from './FAQ/types';

export interface BaseSectionConfig {
  id: string;
  extraClassName?: string;
}

export type SectionConfig =
  | (BaseSectionConfig & { kind: 'hero'; content: HeroContent })
  | (BaseSectionConfig & { kind: 'intro'; content: IntroContent })
  | (BaseSectionConfig & { kind: 'services-preview'; content: ServicesPreviewContent })
  | (BaseSectionConfig & { kind: 'process'; content: ProcessContent })
  | (BaseSectionConfig & { kind: 'projects'; content: ProjectsContent })
  | (BaseSectionConfig & { kind: 'why-choose-us'; content: WhyChooseUsContent })
  | (BaseSectionConfig & { kind: 'faq'; content: FAQContent });

export type SectionKind = SectionConfig['kind'];
