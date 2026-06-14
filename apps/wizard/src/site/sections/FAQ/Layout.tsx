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
  return (
    <section id={sectionId} className={`bg-surface-sunken py-16 ${extraClassName}`}>
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-xl font-semibold text-text">{heading}</h2>
        {subheading && <p className="mt-2 text-base text-text-muted">{subheading}</p>}
        <dl className="mt-8 divide-y divide-border">
          {items.map((item) => {
            const isOpen = openItemIds.has(item.id);
            return (
              <div key={item.id} className="py-4">
                <dt>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between text-left text-base font-medium text-text"
                    onClick={() => onToggleItem(item.id)}
                  >
                    {item.question}
                    <span aria-hidden="true" className="ml-4 font-normal text-text-muted">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                </dt>
                {isOpen && <dd className="mt-2 text-sm text-text-muted">{item.answer}</dd>}
              </div>
            );
          })}
        </dl>
        {cta && (
          <div className="mt-8">
            <a
              href={cta.href}
              className="inline-block rounded border border-primary bg-primary px-4 py-2 text-sm font-medium text-text-inverse"
            >
              {cta.label}
            </a>
          </div>
        )}
      </div>
    </section>
  );
};

export default FAQLayout;
