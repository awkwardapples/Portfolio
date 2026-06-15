import { SectionLink } from '@/site/routing/SectionLink';
import type { ServicesPreviewItem } from './types';

export interface ServicesPreviewLayoutProps {
  heading: string;
  subheading?: string;
  services: ServicesPreviewItem[];
  cta?: { label: string; href: string };
  sectionId?: string;
  extraClassName?: string;
}

const ServicesPreviewLayout = ({
  heading,
  subheading,
  services,
  cta,
  sectionId,
  extraClassName = '',
}: ServicesPreviewLayoutProps) => {
  return (
    <section id={sectionId} className={`bg-surface-sunken py-16 ${extraClassName}`}>
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-xl font-semibold text-text">{heading}</h2>
        {subheading && <p className="mt-2 text-base text-text-muted">{subheading}</p>}
        <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {services.map((service) => (
            <li key={service.serviceId} className="rounded border border-border bg-surface p-6">
              <h3 className="text-base font-semibold text-text">{service.name}</h3>
              <p className="mt-2 text-sm text-text-muted">{service.description}</p>
              {service.link && (
                <SectionLink
                  href={service.link}
                  className="mt-4 inline-block text-sm font-medium text-primary"
                >
                  Get a quote &rarr;
                </SectionLink>
              )}
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

export default ServicesPreviewLayout;
