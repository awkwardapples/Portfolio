import { describe, it, expect } from 'vitest';
import type { ProcessContent, ProcessStep } from '../types';

describe('ProcessContent', () => {
  it('requires heading and steps array', () => {
    const content: ProcessContent = {
      heading: 'How It Works',
      steps: [],
    };
    expect(content.heading).toBe('How It Works');
    expect(Array.isArray(content.steps)).toBe(true);
  });

  it('each step requires stepNumber, name, and description', () => {
    const step: ProcessStep = {
      stepNumber: 1,
      name: 'Fill in our quote form',
      description: 'Tell us what you need via our online quote wizard.',
    };
    expect(step.stepNumber).toBe(1);
    expect(step.name.length).toBeGreaterThan(0);
    expect(step.description.length).toBeGreaterThan(0);
  });

  it('steps retain their numeric ordering', () => {
    const content: ProcessContent = {
      heading: 'How It Works',
      steps: [
        { stepNumber: 1, name: 'Contact us', description: 'Reach out to us.' },
        { stepNumber: 2, name: 'Get a quote', description: 'We send a quote.' },
        { stepNumber: 3, name: 'Job done', description: 'We complete the work.' },
      ],
    };
    expect(content.steps[0]?.stepNumber).toBe(1);
    expect(content.steps[2]?.stepNumber).toBe(3);
  });
});
