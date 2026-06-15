import { SectionLink } from '@/site/routing/SectionLink';

export interface HeroLayoutProps {
  heading: string;
  subheading: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  backgroundImage?: string;
  backgroundImageAlt?: string;
  sectionId?: string;
  extraClassName?: string;
}

const HeroLayout = ({
  heading,
  subheading,
  primaryCta,
  secondaryCta,
  backgroundImage,
  backgroundImageAlt = '',
  sectionId,
  extraClassName = '',
}: HeroLayoutProps) => {
  return (
    <section id={sectionId} className={`relative bg-primary py-16 ${extraClassName}`}>
      {backgroundImage && (
        <img
          src={backgroundImage}
          alt={backgroundImageAlt}
          className="absolute inset-0 h-full w-full object-cover opacity-50"
          aria-hidden={!backgroundImageAlt || undefined}
        />
      )}
      <div className="relative mx-auto max-w-5xl px-6">
        <h1 className="text-2xl font-semibold text-text-inverse">{heading}</h1>
        <p className="mt-4 text-lg text-text-inverse">{subheading}</p>
        <div className="mt-8 flex flex-wrap gap-4">
          <SectionLink
            href={primaryCta.href}
            className="inline-block rounded border border-text-inverse bg-text-inverse px-4 py-2 text-sm font-medium text-primary"
          >
            {primaryCta.label}
          </SectionLink>
          {secondaryCta && (
            <SectionLink
              href={secondaryCta.href}
              className="inline-block rounded border border-text-inverse px-4 py-2 text-sm font-medium text-text-inverse"
            >
              {secondaryCta.label}
            </SectionLink>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroLayout;
