import { SectionLink } from '@/site/routing/SectionLink';
import { FacebookIcon, InstagramIcon, TwitterIcon, LinkedInIcon } from './icons';
import type { FooterContent, FooterSocialLinks } from './types';

export interface FooterLayoutProps {
  content: FooterContent;
}

export function hasAnySocial(social: FooterSocialLinks): boolean {
  return !!(social.facebook || social.instagram || social.twitter || social.linkedin);
}

export function formatPhoneHref(number: string): string {
  return `tel:${number.replace(/\s/g, '')}`;
}

const FooterLayout = ({ content }: FooterLayoutProps) => {
  const hasContact = !!(content.phones?.length || content.emails?.length);
  const hasSocial = content.social != null && hasAnySocial(content.social);

  return (
    <footer className="mt-12 border-t border-border bg-surface-sunken lg:mt-16">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Column 1 — Business identity */}
          <div>
            <h3 className="mb-4 text-xl font-semibold text-text">{content.businessName}</h3>
            {content.address && (
              <address className="whitespace-pre-line text-sm not-italic leading-relaxed text-text-muted">
                {content.address}
              </address>
            )}
            {content.serviceArea && (
              <p className="mt-3 text-sm text-text-muted">{content.serviceArea}</p>
            )}
          </div>

          {/* Column 2 — Contact (phones + emails) */}
          {hasContact && (
            <div>
              <h3 className="mb-4 text-base font-semibold text-text">Contact</h3>
              {content.phones?.map((phone, idx) => (
                <p key={`phone-${idx}`} className="mb-2 text-sm text-text-muted">
                  {phone.label && <span>{phone.label}: </span>}
                  <a href={formatPhoneHref(phone.number)} className="hover:text-text">
                    {phone.number}
                  </a>
                </p>
              ))}
              {content.emails?.map((email, idx) => (
                <p key={`email-${idx}`} className="mb-2 text-sm text-text-muted">
                  {email.label && <span>{email.label}: </span>}
                  <a href={`mailto:${email.address}`} className="hover:text-text">
                    {email.address}
                  </a>
                </p>
              ))}
            </div>
          )}

          {/* Column 3 — Hours */}
          {content.hours && (
            <div>
              <h3 className="mb-4 text-base font-semibold text-text">Hours</h3>
              <p className="whitespace-pre-line text-sm text-text-muted">{content.hours}</p>
            </div>
          )}

          {/* Column 4 — Social */}
          {hasSocial && content.social && (
            <div>
              <h3 className="mb-4 text-base font-semibold text-text">Follow Us</h3>
              <div className="flex gap-4">
                {content.social.facebook && (
                  <a
                    href={content.social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="text-text-muted hover:text-text"
                  >
                    <FacebookIcon />
                  </a>
                )}
                {content.social.instagram && (
                  <a
                    href={content.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="text-text-muted hover:text-text"
                  >
                    <InstagramIcon />
                  </a>
                )}
                {content.social.twitter && (
                  <a
                    href={content.social.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Twitter"
                    className="text-text-muted hover:text-text"
                  >
                    <TwitterIcon />
                  </a>
                )}
                {content.social.linkedin && (
                  <a
                    href={content.social.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="text-text-muted hover:text-text"
                  >
                    <LinkedInIcon />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom row — Copyright and legal links */}
        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-8 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-text-muted">
            © {content.copyrightYear} {content.copyrightText}
          </p>
          {content.legalLinks && content.legalLinks.length > 0 && (
            <ul className="flex gap-6 text-sm text-text-muted">
              {content.legalLinks.map((link, idx) => (
                <li key={idx}>
                  <SectionLink href={link.href} className="hover:text-text">
                    {link.label}
                  </SectionLink>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
};

export default FooterLayout;
