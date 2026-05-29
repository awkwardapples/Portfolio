import { forwardRef, type ReactNode } from 'react';

interface StepCardProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Container for a single wizard step: title, optional description, and a slot
 * for field content. The heading is forwarded a ref so the step renderer can
 * focus it when a new step mounts (keyboard/AT navigation).
 */
export const StepCard = forwardRef<HTMLHeadingElement, StepCardProps>(function StepCard(
  { title, description, children },
  headingRef,
) {
  return (
    <section aria-label={title} className="rounded border border-border bg-surface p-6">
      <header className="mb-6">
        <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold text-text outline-none">
          {title}
        </h2>
        {description && <p className="mt-2 text-base text-text-muted">{description}</p>}
      </header>
      {children}
    </section>
  );
});
