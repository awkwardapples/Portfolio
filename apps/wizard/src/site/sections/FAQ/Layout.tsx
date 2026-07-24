import { cn } from '@/design/cn';
import { useScrollReveal, scrollRevealClassName } from '@/design/useScrollReveal';
import { buttonClassName } from '@/components/primitives/Button';
import { SectionLink } from '@/site/routing/SectionLink';
import type { FAQItem } from './types';

export interface FAQLayoutProps {
  heading: string;
  subheading?: string;
  items: FAQItem[];
  openItemIds: Set<string>;
  onToggleItem: (id: string) => void;
  cta?: { label: string; href: string };
  sectionId?: string;
  extraClassName?: string;
}

/**
 * FAQ (Phase 9) — the closing homepage section. Answers are now genuinely
 * animated open/closed (`grid-template-rows: 0fr -> 1fr`, `duration-base`)
 * rather than popping via conditional mount — the answer `<dd>` is always
 * in the DOM, so screen readers reaching it directly are never surprised
 * by content appearing/disappearing outside the button's own state change.
 * `aria-controls`/`id` link each question to its answer explicitly.
 *
 * CTA: the one section, other than Hero, that gets the filled `Button`
 * treatment (`buttonClassName('primary', 'lg')`, not `UnderlineLink`) —
 * per the homepage-wide CTA hierarchy, this is the deliberate closing
 * bookend after every objection has been addressed, not a competing ask.
 */
const FAQLayout = ({
  heading,
  subheading,
  items,
  openItemIds,
  onToggleItem,
  cta,
  sectionId,
  extraClassName = '',
}: FAQLayoutProps) => {
  const { ref: headingRef, isVisible: headingVisible } = useScrollReveal<HTMLDivElement>();
  const { ref: listRef, isVisible: listVisible } = useScrollReveal<HTMLDListElement>();

  return (
    <section id={sectionId} className={cn('bg-surface-dark-raised py-20 lg:py-24', extraClassName)}>
      <div className="mx-auto max-w-5xl px-6">
        <div ref={headingRef} className={scrollRevealClassName(headingVisible)}>
          <h2 className="text-xl font-semibold text-text-inverse">{heading}</h2>
          {subheading && (
            <p className="mt-4 max-w-prose text-base text-text-inverse-muted">{subheading}</p>
          )}
        </div>

        <dl
          ref={listRef}
          className={cn('mt-12 divide-y divide-border-inverse', scrollRevealClassName(listVisible))}
        >
          {items.map((item) => {
            const isOpen = openItemIds.has(item.id);
            const answerId = `${item.id}-answer`;
            return (
              <div key={item.id} className="py-4">
                <dt>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    className="flex w-full items-center justify-between gap-4 text-left text-base font-medium text-text-inverse"
                    onClick={() => onToggleItem(item.id)}
                  >
                    {item.question}
                    <span
                      aria-hidden="true"
                      className="shrink-0 font-normal text-text-inverse-muted"
                    >
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                </dt>
                <div
                  id={answerId}
                  className={cn(
                    'grid transition-all duration-base',
                    isOpen ? 'grid-rows-accordion-expanded' : 'grid-rows-accordion-collapsed',
                  )}
                >
                  <dd className="overflow-hidden text-sm text-text-inverse-muted">
                    <p className="pt-2">{item.answer}</p>
                  </dd>
                </div>
              </div>
            );
          })}
        </dl>

        {cta && (
          <div className="mt-12">
            <SectionLink href={cta.href} className={buttonClassName('primary', 'lg')}>
              {cta.label}
            </SectionLink>
          </div>
        )}
      </div>
    </section>
  );
};

export default FAQLayout;
