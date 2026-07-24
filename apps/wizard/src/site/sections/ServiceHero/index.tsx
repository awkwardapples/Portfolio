import { useState, useCallback } from 'react';
import ServiceHeroLayout from './Layout';
import type { ServiceHeroContent } from './types';

export interface ServiceHeroProps {
  content: ServiceHeroContent;
  id?: string;
  extraClassName?: string;
}

export const ServiceHero = ({ content, id, extraClassName }: ServiceHeroProps) => {
  const [hasImageError, setHasImageError] = useState(false);

  const handleImageError = useCallback(() => {
    setHasImageError(true);
  }, []);

  return (
    <ServiceHeroLayout
      heading={content.heading}
      subheading={content.subheading}
      primaryCta={content.primaryCta}
      secondaryCta={content.secondaryCta}
      heroImage={content.heroImage}
      heroImageAlt={content.heroImageAlt}
      hasImageError={hasImageError}
      onImageError={handleImageError}
      sectionId={id}
      extraClassName={extraClassName}
    />
  );
};

export default ServiceHero;
