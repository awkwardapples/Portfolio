import { cn } from '@/design/cn';
import { useScrollReveal, scrollRevealClassName } from '@/design/useScrollReveal';
import { Card } from '@/components/primitives/Card';
import { UnderlineLink } from '@/components/primitives/UnderlineLink';
import { SectionLink } from '@/site/routing/SectionLink';
import { ICON_MAP } from './icons';
import type { ServicesPreviewItem } from './types';

export interface ServicesPreviewLayoutProps {
  heading: string;
  subheading?: string;
  services: ServicesPreviewItem[];
  cta?: { label: string; href: string };
  sectionId?: string;
  extraClassName?: string;
}

/**
 * Services Preview (Phase 5; card treatment refined Phase 14; equal-height
 * fix Phase 17). Whole cards are the click target (not a small per-card
 * text link) — each links via `SectionLink` wrapping a `Card interactive`
 * (border-shift on hover, background-tint on press, both from the shared
 * primitive; no scale, no shadow). A card with no `link` renders as a plain,
 * non-interactive `Card` instead of defaulting to an arbitrary href.
 *
 * Equal card height (Phase 17 — real bug, not assumed): the grid's `<li>`
 * items already stretched to match their row's tallest sibling (CSS Grid's
 * default `align-items: stretch`), but nothing inside them inherited that
 * height — `SectionLink` is `block` (fills width, not height) and `Card` has
 * no height rule of its own, so the *visible* card boxes sat at their own
 * content height regardless of how tall their `<li>` actually was, leaving
 * uneven, invisible gaps below shorter cards. Fixed by adding `h-full` to
 * both the `SectionLink` wrapper and the `Card` itself, so the visible box
 * now actually fills the grid cell it's already sitting in — no change to
 * the grid, the stretch behaviour, or `Card`'s own default recipe.
 *
 * Card interior (Phase 14): the icon now sits in a `bg-primary/10` circular
 * badge instead of a bare muted glyph, and linked cards get a small
 * decorative arrow that shifts right and picks up the accent colour on
 * hover/focus (`group-hover`/`group-focus-within`, `duration-fast`,
 * transform-only) — a "premium service card" treatment inspired by the
 * shadcn/21st.dev ecosystem's common pattern for this exact kind of tile,
 * rebuilt from scratch with this project's own tokens rather than ported
 * from a specific registry component. The referenced 21st.dev URL
 * (`ravikatiyar162/services-card`) could not actually be fetched — both the
 * public page and the CLI require an authenticated 21st.dev account/API key
 * that isn't configured in this environment (confirmed via `21st whoami`
 * and a direct fetch, both reporting "authentication required") — so this
 * is an original adaptation of that general pattern, not a port of that
 * specific component's real source. No new copy: the arrow is
 * `aria-hidden`, purely decorative, same click target as before.
 *
 * Motion: one `useScrollReveal` call for the heading block, one more for
 * the card grid as a whole (calling the hook per-card would violate the
 * rules of hooks) — each card's stagger comes from
 * `scrollRevealClassName`'s `staggerIndex` parameter instead, capped at 6
 * per design-bible.md §7.
 */
const ServicesPreviewLayout = ({
  heading,
  subheading,
  services,
  cta,
  sectionId,
  extraClassName = '',
}: ServicesPreviewLayoutProps) => {
  const { ref: headingRef, isVisible: headingVisible } = useScrollReveal<HTMLDivElement>();
  const { ref: gridRef, isVisible: gridVisible } = useScrollReveal<HTMLUListElement>();

  return (
    <section id={sectionId} className={cn('bg-surface-dark-raised py-20 lg:py-24', extraClassName)}>
      <div className="mx-auto max-w-5xl px-6">
        <div ref={headingRef} className={scrollRevealClassName(headingVisible)}>
          <h2 className="text-xl font-semibold text-text-inverse">{heading}</h2>
          {subheading && <p className="mt-4 text-base text-text-inverse-muted">{subheading}</p>}
        </div>

        <ul
          ref={gridRef}
          className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
          role="list"
        >
          {services.map((service, index) => {
            const Icon = service.iconOrImage ? ICON_MAP[service.iconOrImage] : null;
            const cardContent = (
              <Card surface="dark" interactive={Boolean(service.link)} className="h-full">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                    {Icon && <Icon className="h-5 w-5 text-primary-inverse" />}
                  </div>
                  {service.link && (
                    <ArrowIcon
                      aria-hidden="true"
                      className="text-text-inverse-muted transition-transform duration-fast group-hover:translate-x-1 group-focus-within:translate-x-1"
                    />
                  )}
                </div>
                <h3 className="mt-4 text-base font-medium text-text-inverse">{service.name}</h3>
                <p className="mt-2 text-sm text-text-inverse-muted">{service.description}</p>
              </Card>
            );

            return (
              <li key={service.serviceId} className={scrollRevealClassName(gridVisible, index + 1)}>
                {service.link ? (
                  <SectionLink href={service.link} className="group block h-full">
                    {cardContent}
                  </SectionLink>
                ) : (
                  cardContent
                )}
              </li>
            );
          })}
        </ul>

        {cta && (
          <div className="mt-12">
            <UnderlineLink href={cta.href}>{cta.label}</UnderlineLink>
          </div>
        )}
      </div>
    </section>
  );
};

function ArrowIcon({
  className,
  'aria-hidden': ariaHidden,
}: {
  className?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
}) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden={ariaHidden}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3.5 8H12.5M12.5 8L8.5 4M12.5 8L8.5 12"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default ServicesPreviewLayout;
