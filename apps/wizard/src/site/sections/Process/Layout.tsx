import { SectionLink } from '@/site/routing/SectionLink';
import type { ProcessStep } from './types';

export interface ProcessLayoutProps {
  heading: string;
  subheading?: string;
  steps: ProcessStep[];
  cta?: { label: string; href: string };
  sectionId?: string;
  extraClassName?: string;
}

const ProcessLayout = ({
  heading,
  subheading,
  steps,
  cta,
  sectionId,
  extraClassName = '',
}: ProcessLayoutProps) => {
  return (
    <section id={sectionId} className={`bg-surface py-16 ${extraClassName}`}>
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-xl font-semibold text-text">{heading}</h2>
        {subheading && <p className="mt-4 text-base text-text-muted">{subheading}</p>}
        <ol className="mt-12 flex flex-col gap-8 lg:flex-row" role="list">
          {steps.map((step) => (
            <li key={step.stepNumber} className="flex-1">
              <span className="text-2xl font-semibold text-primary">
                {String(step.stepNumber).padStart(2, '0')}
              </span>
              <h3 className="mt-2 text-base font-semibold text-text">{step.name}</h3>
              <p className="mt-1 text-sm text-text-muted">{step.description}</p>
            </li>
          ))}
        </ol>
        {cta && (
          <div className="mt-12">
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

export default ProcessLayout;
