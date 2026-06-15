import { describe, it, expect } from 'vitest';
import { isInternalLink } from '../SectionLink';

describe('isInternalLink', () => {
  it('returns true for a path starting with /', () => {
    expect(isInternalLink('/quote')).toBe(true);
  });

  it('returns false for a tel: link', () => {
    expect(isInternalLink('tel:01234567890')).toBe(false);
  });

  it('returns false for an https:// link', () => {
    expect(isInternalLink('https://example.com/')).toBe(false);
  });
});
