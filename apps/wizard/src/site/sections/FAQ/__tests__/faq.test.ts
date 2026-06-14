import { describe, it, expect } from 'vitest';
import type { FAQContent, FAQItem } from '../types';

function toggleFaqItem(openIds: Set<string>, itemId: string): Set<string> {
  const next = new Set(openIds);
  if (next.has(itemId)) {
    next.delete(itemId);
  } else {
    next.add(itemId);
  }
  return next;
}

describe('FAQContent', () => {
  it('requires heading and an items array', () => {
    const content: FAQContent = {
      heading: 'Frequently Asked Questions',
      items: [],
    };
    expect(content.heading).toBe('Frequently Asked Questions');
    expect(Array.isArray(content.items)).toBe(true);
  });

  it('each item requires id, question, and answer', () => {
    const item: FAQItem = {
      id: 'q1',
      question: 'What areas do you cover?',
      answer: 'We cover the south east of England.',
    };
    expect(item.id).toBe('q1');
    expect(item.question.length).toBeGreaterThan(0);
    expect(item.answer.length).toBeGreaterThan(0);
  });

  it('toggle opens a closed item', () => {
    const initial = new Set<string>();
    const after = toggleFaqItem(initial, 'q1');
    expect(after.has('q1')).toBe(true);
    expect(initial.has('q1')).toBe(false);
  });

  it('toggle closes an already-open item', () => {
    const initial = new Set(['q1', 'q2']);
    const after = toggleFaqItem(initial, 'q1');
    expect(after.has('q1')).toBe(false);
    expect(after.has('q2')).toBe(true);
  });
});
