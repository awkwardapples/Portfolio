import { cn } from '@/design/cn';
import { useScrollReveal, scrollRevealClassName } from '@/design/useScrollReveal';
import { QuoteIcon } from '@/design/icons';
import { UnderlineLink } from '@/components/primitives/UnderlineLink';
import type { ValueProp, Testimonial } from './types';

export interface WhyChooseUsLayoutProps {
  heading: string;
  subheading?: string;
  valueProps: ValueProp[];
  testimonials?: Testimonial[];
  cta?: { label: string; href: string };
  sectionId?: string;
  extraClassName?: string;
}

/**
 * Why Choose Us (Phase 8). No card grid — design-bible.md §9 always kept
 * this section deliberately card-less to differentiate it from Services
 * Preview's bordered tiles; removed the `rounded border border-border
 * bg-surface p-6` wrapper the original implementation still had. Value
 * props read as a plain editorial list (bold heading + muted description,
 * no icon or numeral marker) — this message's "avoid unnecessary icons/
 * decorative UI" instruction took priority over design-bible.md §9's
 * original "icon or numeral marker" suggestion; restraint over decoration.
 *
 * Testimonials (real, customer-supplied — see home-page-content.ts) are
 * the credibility payload this section exists to carry, per the approved
 * placement decision: no new homepage section, integrated here. Reuses
 * `QuoteIcon` (extracted from Intro, not redrawn) as the one visual anchor
 * for the testimonial block, kept visually distinct from the value-prop
 * list above it by a hairline top divider rather than a card boundary.
 *
 * Google Reviews / EmbedSocial integration point: once approved as its
 * own phase, the widget mounts directly below the testimonials block,
 * inside this same section — no structural change anticipated, just an
 * addition at the marker below. Nothing third-party is loaded yet.
 */
const WhyChooseUsLayout = ({
  heading,
  subheading,
  valueProps,
  testimonials,
  cta,
  sectionId,
  extraClassName = '',
}: WhyChooseUsLayoutProps) => {
  const { ref: headingRef, isVisible: headingVisible } = useScrollReveal<HTMLDivElement>();
  const { ref: propsRef, isVisible: propsVisible } = useScrollReveal<HTMLUListElement>();
  const { ref: testimonialsRef, isVisible: testimonialsVisible } =
    useScrollReveal<HTMLDivElement>();

  return (
    <section id={sectionId} className={cn('bg-surface-dark py-20 lg:py-24', extraClassName)}>
      <div className="mx-auto max-w-5xl px-6">
        <div ref={headingRef} className={scrollRevealClassName(headingVisible)}>
          <h2 className="text-xl font-semibold text-text-inverse">{heading}</h2>
          {subheading && (
            <p className="mt-4 max-w-prose text-base text-text-inverse-muted">{subheading}</p>
          )}
        </div>

        <ul
          ref={propsRef}
          className="mt-12 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3"
          role="list"
        >
          {valueProps.map((vp, index) => (
            <li key={index} className={scrollRevealClassName(propsVisible, index + 1)}>
              <h3 className="text-base font-semibold text-text-inverse">{vp.heading}</h3>
              <p className="mt-2 text-sm text-text-inverse-muted">{vp.description}</p>
            </li>
          ))}
        </ul>

        {testimonials && testimonials.length > 0 && (
          <div ref={testimonialsRef} className="mt-16 border-t border-border-inverse pt-16">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
              {testimonials.map((testimonial, index) => (
                <div key={index} className={scrollRevealClassName(testimonialsVisible, index + 1)}>
                  <QuoteIcon className="text-primary-inverse" />
                  <p className="mt-4 text-base text-text-inverse">{testimonial.quote}</p>
                  <p className="mt-4 text-sm font-medium text-text-inverse-muted">
                    — {testimonial.author}
                  </p>
                </div>
              ))}
            </div>
            {/* Google Reviews (EmbedSocial) mounts here once that phase is
                approved — structural placement only, no script loaded yet. */}
          </div>
        )}

        {cta && (
          <div className="mt-12">
            <UnderlineLink href={cta.href}>{cta.label}</UnderlineLink>
          </div>
        )}
      </div>
    </section>
  );
};

export default WhyChooseUsLayout;
