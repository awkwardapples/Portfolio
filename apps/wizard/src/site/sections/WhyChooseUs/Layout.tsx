import { SectionLink } from '@/site/routing/SectionLink';
import type { ValueProp } from './types';

export interface WhyChooseUsLayoutProps {
  heading: string;
  subheading?: string;
  valueProps: ValueProp[];
  cta?: { label: string; href: string };
  sectionId?: string;
  extraClassName?: string;
}

const WhyChooseUsLayout = ({
  heading,
  subheading,
  valueProps,
  cta,
  sectionId,
  extraClassName = '',
}: WhyChooseUsLayoutProps) => {
  return (
    <section id={sectionId} className={`bg-surface-sunken py-16 ${extraClassName}`}>
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-xl font-semibold text-text">{heading}</h2>
        {subheading && <p className="mt-2 text-base text-text-muted">{subheading}</p>}
        <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {valueProps.map((vp, idx) => (
            <li key={idx} className="rounded border border-border bg-surface p-6">
              <h3 className="text-base font-semibold text-text">{vp.heading}</h3>
              <p className="mt-2 text-sm text-text-muted">{vp.description}</p>
            </li>
          ))}
        </ul>
        {cta && (
          <div className="mt-8">
            <SectionLink
              href={cta.href}
              className="inline-block rounded border border-primary bg-primary px-4 py-2 text-sm font-medium text-text-inverse"
            >
              {cta.label}
            </SectionLink>
          </div>
        )}
      </div>
    </section>
  );
};

export default WhyChooseUsLayout;
