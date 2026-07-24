import { cn } from '@/design/cn';
import { buttonClassName } from '@/components/primitives/Button';
import { SectionLink } from '@/site/routing/SectionLink';

export interface ServiceHeroLayoutProps {
  heading: string;
  subheading: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  heroImage: string;
  heroImageAlt: string;
  hasImageError: boolean;
  onImageError: () => void;
  sectionId?: string;
  extraClassName?: string;
}

/**
 * ServiceHero (Phase 10). A separate, shared component from the home page
 * Hero — not a variant of it — reused verbatim by all 5 service landing
 * pages. Per the approved direction: service pages optimise for conversion
 * and service clarity, not the home page's full-viewport editorial
 * treatment, so this section is deliberately capped at `min-h-service-hero`
 * (~600px on desktop, tailwind.config.ts) rather than `lg:min-h-screen` —
 * keeping the CTA inside the first viewport on typical desktop screens.
 * Mobile gets no forced minimum height at all (same `py-20` content-driven
 * sizing every other section already uses), so the image never pushes the
 * CTA below the fold on a short viewport.
 *
 * Full-bleed background photograph with a flat scrim (`bg-neutral-900/60`,
 * the same token-compliant technique as `MobileMenu`'s backdrop) rather than
 * a gradient — text sits on a single flat overlay, never a gradient fade.
 * The image is the only intentional visual difference between service
 * pages; heading/subheading/CTA styling is identical to Hero's treatment
 * (same type scale, same `buttonClassName` sizes, same entrance-motion
 * classes) so the two hero patterns still read as one design system.
 *
 * On image load failure, the photo and scrim are both replaced by a flat
 * `bg-surface-dark` panel (updated Phase 12 to match the sitewide dark
 * section system — was `bg-surface-sunken` when this component only had to
 * be internally consistent with itself; now the section itself is always
 * `bg-surface-dark` regardless of image state, matching `Projects`' `onError`
 * fallback pattern) so a missing image degrades to a plain, still-intentional
 * section rather than a broken-image icon — expected during Phase 10 since
 * real photography has not been supplied yet (placeholder paths only).
 */
const ServiceHeroLayout = ({
  heading,
  subheading,
  primaryCta,
  secondaryCta,
  heroImage,
  heroImageAlt,
  hasImageError,
  onImageError,
  sectionId,
  extraClassName = '',
}: ServiceHeroLayoutProps) => {
  const showImage = !hasImageError;

  return (
    <section
      id={sectionId}
      className={cn(
        'relative flex items-center overflow-hidden bg-surface-dark py-20 lg:min-h-service-hero lg:py-24',
        extraClassName,
      )}
    >
      {showImage && (
        <>
          <img
            src={heroImage}
            alt={heroImageAlt}
            onError={onImageError}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-neutral-900/60" />
        </>
      )}

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6">
        <div className="max-w-2xl">
          <h1 className="animate-goqw-hero-heading text-2xl font-semibold text-text-inverse">
            {heading}
          </h1>
          <p
            className={cn(
              'animate-goqw-hero-subheading mt-6 max-w-prose text-lg',
              showImage ? 'text-text-inverse/90' : 'text-text-inverse-muted',
            )}
          >
            {subheading}
          </p>
          <div className="animate-goqw-hero-cta mt-10 flex flex-wrap gap-4">
            <SectionLink href={primaryCta.href} className={buttonClassName('primary', 'lg')}>
              {primaryCta.label}
            </SectionLink>
            {secondaryCta && (
              <SectionLink href={secondaryCta.href} className={buttonClassName('secondary', 'lg')}>
                {secondaryCta.label}
              </SectionLink>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServiceHeroLayout;
