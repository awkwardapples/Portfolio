import { useState, useCallback } from 'react';
import HeroLayout from './Layout';
import type { HeroContent } from './types';

export interface HeroProps {
  content: HeroContent;
  id?: string;
  extraClassName?: string;
}

export const Hero = ({ content, id, extraClassName }: HeroProps) => {
  const [hasImageError, setHasImageError] = useState(false);

  const handleImageError = useCallback(() => {
    setHasImageError(true);
  }, []);

  return (
    <HeroLayout
      heading={content.heading}
      subheading={content.subheading}
      primaryCta={content.primaryCta}
      secondaryCta={content.secondaryCta}
      backgroundImage={content.backgroundImage}
      backgroundImageAlt={content.backgroundImageAlt}
      hasImageError={hasImageError}
      onImageError={handleImageError}
      sectionId={id}
      extraClassName={extraClassName}
    />
  );
};

export default Hero;
