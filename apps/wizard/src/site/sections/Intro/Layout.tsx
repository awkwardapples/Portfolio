import { SectionLink } from '@/site/routing/SectionLink';

export interface IntroLayoutProps {
  heading: string;
  body: string;
  bulletPoints?: string[];
  cta?: { label: string; href: string };
  sectionId?: string;
  extraClassName?: string;
}

const IntroLayout = ({
  heading,
  body,
  bulletPoints,
  cta,
  sectionId,
  extraClassName = '',
}: IntroLayoutProps) => {
  return (
    <section id={sectionId} className={`bg-surface py-16 ${extraClassName}`}>
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-xl font-semibold text-text">{heading}</h2>
        <p className="mt-6 text-base text-text-muted">{body}</p>
        {bulletPoints && bulletPoints.length > 0 && (
          <ul className="mt-8 space-y-2">
            {bulletPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2 text-base text-text-muted">
                <span className="mt-1 font-medium text-primary" aria-hidden="true">
                  &bull;
                </span>
                {point}
              </li>
            ))}
          </ul>
        )}
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

export default IntroLayout;
