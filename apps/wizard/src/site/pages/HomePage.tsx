import type { ReactElement } from 'react';
import { renderSection } from '@/site/sections/renderSection';
import { homePageContent } from './home-page-content';

export function HomePage(): ReactElement {
  return <div>{homePageContent.map((section) => renderSection(section))}</div>;
}
