import type { ReactElement } from 'react';

import { cn } from '@/design/cn';
import { useScrollReveal, scrollRevealClassName } from '@/design/useScrollReveal';
import { QuoteIcon } from '@/design/icons';
import { UnderlineLink } from '@/components/primitives/UnderlineLink';

export interface IntroLayoutProps {
  heading: string;
  body: string;
  bulletPoints?: string[];
  variant: 'credibility' | 'checklist';
  cta?: { label: string; href: string };
  sectionId?: string;
  extraClassName?: string;
}

/**
 * Intro (Phase 6 groundwork; `variant` added Phase 10). Direction B: split
 * narrative + credibility panel — an asymmetric two-zone layout that echoes
 * Hero's own asymmetry (rhyme, not repeat) without competing with Services
 * Preview's 3-column grid below it. Reused verbatim by all 5 service
 * landing pages via `renderSection`, for 4 differently-purposed blocks each.
 *
 * `variant: 'credibility'` (home page only) features `bulletPoints[0]` in a
 * separate quote-styled panel — correct there because those bullets are
 * independent, equally-quotable trust facts. `variant: 'checklist'` (every
 * service-page intro block) renders the full list in the main column with
 * nothing promoted out. Phase 10 finding: the credibility treatment was
 * previously applied unconditionally, which silently dropped the first item
 * of service pages' "what we help with"/"who we help" checklists into a
 * pull-quote and off the visible list — a real content-loss bug, not just a
 * style mismatch. The variant must be set explicitly per block, never
 * inferred from list length.
 *
 * The main column only narrows to `md:w-2/3` when the credibility panel is
 * actually rendered; blocks with no side panel (prose-only "problem"/
 * "intro" blocks and every checklist block) take the full width instead of
 * leaving a dead 1/3 gap — a second Phase 10 finding, since the previous
 * unconditional `md:w-2/3` left exactly that empty gap on every service
 * page's prose-only blocks already.
 *
 * CTA is a text link (`UnderlineLink`), not a filled button — per the
 * homepage-wide CTA hierarchy established during this phase's whole-site
 * review: Hero earns the one filled "start here" moment; every section
 * after it must justify a competing CTA, and Intro's job is credibility,
 * not a second ask.
 */
const IntroLayout = ({
  heading,
  body,
  bulletPoints,
  variant,
  cta,
  sectionId,
  extraClassName = '',
}: IntroLayoutProps): ReactElement => {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>();
  const featuredPoint = variant === 'credibility' ? bulletPoints?.[0] : undefined;
  const hasFeaturedPanel = Boolean(featuredPoint);
  const listPoints =
    variant === 'credibility' ? (bulletPoints?.slice(1) ?? []) : (bulletPoints ?? []);

  return (
    <section id={sectionId} className={cn('bg-surface-dark py-20 lg:py-24', extraClassName)}>
      <div ref={ref} className="mx-auto max-w-5xl px-6">
        <div className="flex flex-col gap-12 md:flex-row md:items-start">
          <div
            className={cn(
              hasFeaturedPanel ? 'md:w-2/3' : 'w-full',
              scrollRevealClassName(isVisible, 0),
            )}
          >
            <h2 className="text-xl font-semibold text-text-inverse">{heading}</h2>
            <p className="mt-6 max-w-prose text-base text-text-inverse-muted">{body}</p>

            {listPoints.length > 0 && (
              <ul className="mt-8 space-y-3">
                {listPoints.map((point, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-base text-text-inverse-muted"
                  >
                    <CheckIcon className="mt-1 shrink-0 text-text-inverse-muted" />
                    {point}
                  </li>
                ))}
              </ul>
            )}

            {cta && (
              <div className="mt-10">
                <UnderlineLink href={cta.href}>{cta.label}</UnderlineLink>
              </div>
            )}
          </div>

          {hasFeaturedPanel && (
            <div
              className={cn(
                'border-t border-border-inverse pt-8',
                'md:w-1/3 md:border-l md:border-t-0 md:pl-8 md:pt-0',
                scrollRevealClassName(isVisible, 1),
              )}
            >
              <QuoteIcon className="text-primary-inverse" />
              <p className="mt-4 text-lg font-medium text-text-inverse">{featuredPoint}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

function CheckIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13.5 4.5L6 12L2.5 8.5"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default IntroLayout;
