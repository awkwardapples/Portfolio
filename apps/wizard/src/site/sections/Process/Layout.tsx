import { cn } from '@/design/cn';
import { useScrollReveal, scrollRevealClassName } from '@/design/useScrollReveal';
import { UnderlineLink } from '@/components/primitives/UnderlineLink';
import type { ProcessStep } from './types';

export interface ProcessLayoutProps {
  heading: string;
  subheading?: string;
  steps: ProcessStep[];
  cta?: { label: string; href: string };
  sectionId?: string;
  extraClassName?: string;
}

/**
 * Process (Phase 6). Reads as a connected sequence, not a card grid — the
 * silhouette Services Preview already owns. Desktop shows a threaded rail
 * (numbered nodes connected by a line, reinforcing "in order" for a
 * left-to-right arrangement); mobile drops the line and relies on plain
 * top-to-bottom stacking, which already reads as sequential without one —
 * an intentional simplification, not a fallback: a drawn connector earns
 * its place where reading order isn't otherwise obvious (horizontal), not
 * where it already is (vertical).
 *
 * Every step-number circle (both the mobile-visible one and the desktop
 * rail's) is `aria-hidden` — the `<ol>`/`<li>` structure and each step's
 * heading text already carry the sequence and its meaning to assistive
 * tech; the numerals are a decorative reinforcement for sighted users, not
 * the only source of that information, so hiding either version at a given
 * breakpoint (via `hidden`/`lg:hidden`) never removes real content.
 */
const ProcessLayout = ({
  heading,
  subheading,
  steps,
  cta,
  sectionId,
  extraClassName = '',
}: ProcessLayoutProps) => {
  const { ref: headingRef, isVisible: headingVisible } = useScrollReveal<HTMLDivElement>();
  const { ref: stepsRef, isVisible: stepsVisible } = useScrollReveal<HTMLOListElement>();

  return (
    <section id={sectionId} className={cn('bg-surface-dark py-20 lg:py-24', extraClassName)}>
      <div className="mx-auto max-w-5xl px-6">
        <div ref={headingRef} className={scrollRevealClassName(headingVisible)}>
          <h2 className="text-xl font-semibold text-text-inverse">{heading}</h2>
          {subheading && (
            <p className="mt-4 max-w-prose text-base text-text-inverse-muted">{subheading}</p>
          )}
        </div>

        {/* Desktop rail: numbered nodes threaded by a connecting line. */}
        <div className="mt-16 hidden lg:flex lg:gap-8" aria-hidden="true">
          {steps.map((step, index) => (
            <div key={step.stepNumber} className="flex items-center lg:w-1/3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary-inverse text-sm font-semibold text-primary-inverse">
                {step.stepNumber}
              </span>
              {index < steps.length - 1 && <span className="ml-3 h-px flex-1 bg-border-inverse" />}
            </div>
          ))}
        </div>

        <ol
          ref={stepsRef}
          className="mt-6 flex flex-col gap-10 lg:mt-4 lg:flex-row lg:gap-8"
          role="list"
        >
          {steps.map((step, index) => (
            <li
              key={step.stepNumber}
              className={cn(
                'flex items-start gap-4 lg:w-1/3 lg:flex-col lg:items-start lg:gap-0',
                scrollRevealClassName(stepsVisible, index + 1),
              )}
            >
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary-inverse text-sm font-semibold text-primary-inverse lg:hidden"
              >
                {step.stepNumber}
              </span>
              <div>
                <h3 className="text-base font-semibold text-text-inverse">{step.name}</h3>
                <p className="mt-1 text-sm text-text-inverse-muted">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>

        {cta && (
          <div className="mt-10">
            <UnderlineLink href={cta.href}>{cta.label}</UnderlineLink>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProcessLayout;
