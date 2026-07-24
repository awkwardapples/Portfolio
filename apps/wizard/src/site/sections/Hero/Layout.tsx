import { cn } from '@/design/cn';
import { buttonClassName } from '@/components/primitives/Button';
import { SectionLink } from '@/site/routing/SectionLink';

export interface HeroLayoutProps {
  heading: string;
  subheading: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  backgroundImage?: string;
  backgroundImageAlt?: string;
  hasImageError: boolean;
  onImageError: () => void;
  sectionId?: string;
  extraClassName?: string;
}

/**
 * Hero (Phase 3; rebuilt Phase 12 — Dark Premium Theme Refinement). Full-
 * bleed photographic background with a dark scrim, replacing the earlier
 * two-zone editorial layout (headline/CTA column + a separate
 * `MeasuredDrawing` technical-line-art visual in its own column). Per the
 * explicit direction this phase: the illustration read as polished but
 * didn't communicate the business strongly enough; a real photograph does.
 *
 * Deliberately still a distinct component from `ServiceHero`, not merged
 * with it, even though both are now "photo + scrim + text" — Hero stays the
 * full-viewport (`lg:min-h-screen`), most dramatic moment on the site (the
 * homepage's one full-bleed arrival), while `ServiceHero` stays capped at
 * `min-h-service-hero` (~600px) for conversion-focused service pages. Same
 * visual language, deliberately different scale and purpose.
 *
 * The scrim is a flat `bg-neutral-900/70` — one step darker than
 * `ServiceHero`'s `/60` — reflecting Hero's role as the darkest section in
 * the new section-tone hierarchy (design-bible.md), not an arbitrary choice.
 * Never a gradient.
 *
 * Motion: heading/subheading/CTA keep their exact original entrance
 * animations (`animate-goqw-hero-heading/-subheading/-cta`, unchanged
 * timings). The background photograph itself is NOT animated — no
 * `animate-goqw-hero-visual` fade-in, per this phase's explicit "do not
 * animate the image unnecessarily" instruction; a static full-bleed photo
 * behind animated text is the correct reading of that constraint.
 *
 * On image load failure, falls back to a flat `bg-surface-dark` panel
 * (text stays `text-inverse`/`text-inverse-muted`, since Hero is now part
 * of the dark section family regardless of whether a photo loads) — same
 * `onError` discipline already established by `ServiceHero`/`Projects`,
 * not a new pattern invented here.
 *
 * Heading typography (Phase 14 sized `text-xl`/`max-w-3xl` for readability
 * with a long sentence-length heading; Phase 15 pushed further — the
 * heading is now explicitly the homepage's one focal element). Responsive
 * `text-2xl lg:text-3xl`: `2xl` (30px) was already the largest existing
 * step before Phase 15; `3xl` (40px, tokens.ts) is a new, genuine display
 * step added because nothing in the scale was large enough to make the
 * heading "the first thing a visitor's eye is drawn to" without an
 * arbitrary value. `ServiceHero`'s own `max-w-2xl`/heading size are
 * untouched — every Phase 15 change here is scoped to the home page Hero.
 *
 * Spacing hierarchy (Phase 15): heading→subheading grew from `mt-6` to
 * `mt-10` (24px → 40px) and subheading→CTA shrank from `mt-10` to `mt-4`
 * (40px → 16px) — the *opposite* of how they were previously ordered. That
 * was a genuine hierarchy inversion: the CTA group was more separated from
 * its subheading than the subheading was from the headline it supports,
 * backwards from "headline, then a clearly separate supporting block, then
 * a tightly-attached CTA."
 *
 * Heading entrance duration (Phase 15): `goqw-hero-heading` now uses a
 * dedicated 600ms duration instead of reusing `motion.durationSlow`
 * (400ms) — a deliberate, narrow exception to the sitewide closed
 * 150/250/400ms scale, scoped to this one bespoke, already
 * hand-choreographed animation entry (its sibling entries already bake in
 * hardcoded per-element delays outside the general `transitionDelay`
 * scale, so a bespoke duration for this one entry follows the same
 * existing precedent, not a new one). `motion.durationSlow` itself is
 * unchanged and still drives the subheading's entrance and every other
 * `duration-slow` use sitewide.
 */
const HeroLayout = ({
  heading,
  subheading,
  primaryCta,
  secondaryCta,
  backgroundImage,
  backgroundImageAlt = '',
  hasImageError,
  onImageError,
  sectionId,
  extraClassName = '',
}: HeroLayoutProps) => {
  const showImage = Boolean(backgroundImage) && !hasImageError;

  return (
    <section
      id={sectionId}
      className={cn(
        'relative flex items-center overflow-hidden bg-surface-dark py-20 lg:min-h-screen lg:py-24',
        extraClassName,
      )}
    >
      {showImage && (
        <>
          <img
            src={backgroundImage}
            alt={backgroundImageAlt}
            onError={onImageError}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-neutral-900/70" />
        </>
      )}

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6">
        <div className="max-w-3xl">
          <h1 className="animate-goqw-hero-heading text-2xl font-semibold text-text-inverse lg:text-3xl">
            {heading}
          </h1>
          <p className="animate-goqw-hero-subheading mt-10 max-w-prose text-lg text-text-inverse-muted">
            {subheading}
          </p>
          <div className="animate-goqw-hero-cta mt-4 flex flex-wrap gap-4">
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

export default HeroLayout;
