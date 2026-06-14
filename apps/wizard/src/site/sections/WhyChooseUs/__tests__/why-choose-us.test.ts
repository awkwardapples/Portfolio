import { describe, it, expect } from 'vitest';
import type { WhyChooseUsContent, ValueProp } from '../types';

describe('WhyChooseUsContent', () => {
  it('requires heading and a valueProps array', () => {
    const content: WhyChooseUsContent = {
      heading: 'Why Choose Us',
      valueProps: [],
    };
    expect(content.heading).toBe('Why Choose Us');
    expect(Array.isArray(content.valueProps)).toBe(true);
  });

  it('each value prop requires heading and description', () => {
    const vp: ValueProp = {
      heading: 'Fully insured',
      description: 'All work completed safely and professionally.',
    };
    expect(vp.heading.length).toBeGreaterThan(0);
    expect(vp.description.length).toBeGreaterThan(0);
  });

  it('accepts multiple value props', () => {
    const content: WhyChooseUsContent = {
      heading: 'Why Choose Us',
      valueProps: [
        { heading: 'Specialist expertise', description: 'Years of experience.' },
        { heading: 'Reliable & on time', description: 'We show up when we say we will.' },
        { heading: 'Fully insured', description: 'All work covered.' },
      ],
    };
    expect(content.valueProps).toHaveLength(3);
  });
});
