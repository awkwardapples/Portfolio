import { describe, expect, it } from 'vitest';

import { validateWizardConfig } from '@/domain/validation/validate';

import { resultsBySelection, selectResultItems, type ContentIndexEntry } from './content-index';
import { CONTACT_INTENT_IDS, CONTACT_WIZARDS, INTENT_FROM_THRESHOLD } from './intents';

const entry = (
  id: string,
  kind: ContentIndexEntry['kind'],
  date: string,
  featuredOrder?: number,
): ContentIndexEntry => ({
  id,
  kind,
  date,
  featured: featuredOrder !== undefined,
  featuredOrder,
  item: { title: id, summary: '', url: `/work/${id}`, actions: [] },
});

const index = [
  entry('nn', 'software', '2023-10-08'),
  entry('kerr', 'research', '2025-08-11', 1),
  entry('growtrades', 'venture', '2024-05-01', 2),
  entry('paper', 'research', '2024-01-01'),
];

describe('selectResultItems (spec I.3, I.4)', () => {
  it('featured: featured in order, then the newest other work', () => {
    expect(selectResultItems('featured', index).map((item) => item.title)).toEqual([
      'kerr',
      'growtrades',
      'paper',
      'nn',
    ]);
  });

  it('research, venture and music: that kind only, newest first', () => {
    expect(selectResultItems('research', index).map((item) => item.title)).toEqual([
      'kerr',
      'paper',
    ]);
    expect(selectResultItems('venture', index).map((item) => item.title)).toEqual(['growtrades']);
    expect(selectResultItems('music', index)).toEqual([]);
  });

  it('builds every selection at once for the island', () => {
    expect(Object.keys(resultsBySelection(index))).toEqual([
      'featured',
      'research',
      'venture',
      'music',
    ]);
  });
});

describe('the contact wizards (spec I.3)', () => {
  it('are valid wizard configurations', () => {
    for (const id of CONTACT_INTENT_IDS) {
      const result = validateWizardConfig(CONTACT_WIZARDS[id]);
      expect(result.ok, `${id}: ${result.ok ? '' : JSON.stringify(result.issues)}`).toBe(true);
    }
  });

  it('are manual-mode and keyed by their intent id', () => {
    for (const id of CONTACT_INTENT_IDS) {
      expect(CONTACT_WIZARDS[id].id).toBe(id);
      expect(CONTACT_WIZARDS[id].quoteMode).toBe('manual');
    }
  });

  it('use the contact field ids the Worker checks rely on, ending with optional details', () => {
    for (const id of CONTACT_INTENT_IDS) {
      const steps = CONTACT_WIZARDS[id].steps;
      const keys = steps.flatMap((step) => ('fields' in step ? step.fields.map((f) => f.key) : []));
      expect(keys, id).toEqual(
        expect.arrayContaining(['contact_name', 'contact_email', 'data_processing_consent']),
      );
      const last = steps[steps.length - 1];
      expect(last && 'allowSkip' in last && last.allowSkip, id).toBe(true);
    }
  });

  it('ask for nothing beyond the spec: no phone, address, postcode or photo', () => {
    for (const id of CONTACT_INTENT_IDS) {
      for (const step of CONTACT_WIZARDS[id].steps) {
        if (!('fields' in step)) continue;
        for (const field of step.fields) {
          expect(['contact_phone', 'postcode', 'address'], `${id}.${field.key}`).not.toContain(
            field.key,
          );
          expect(field.type, `${id}.${field.key}`).not.toBe('photo');
        }
      }
    }
  });

  it('cap every free-text answer (spec Q.2)', () => {
    for (const id of CONTACT_INTENT_IDS) {
      for (const step of CONTACT_WIZARDS[id].steps) {
        if (!('fields' in step)) continue;
        for (const field of step.fields) {
          if (field.type === 'text' || field.type === 'textarea') {
            expect(field.maxLength, `${id}.${field.key}`).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it('map every threshold answer to an intent, the open-ended ones to "something else"', () => {
    expect(INTENT_FROM_THRESHOLD).toEqual({
      hiring: 'hiring',
      research: 'research',
      experience: 'other',
      music: 'music',
      looking: 'other',
    });
  });

  it('never offer a website: GrowTrades asks an open question, and hiring covers data science and consulting', () => {
    const text = JSON.stringify(CONTACT_WIZARDS).toLowerCase();
    expect(text).not.toContain('website');
    const growtrades = CONTACT_WIZARDS.growtrades.steps[0];
    expect(growtrades && 'fields' in growtrades ? growtrades.fields.map((f) => f.key) : []).toEqual(
      ['growtrades_question'],
    );
    const role = CONTACT_WIZARDS.hiring.steps[0];
    const values =
      role && 'fields' in role
        ? role.fields.flatMap((f) => f.options?.map((o) => o.value) ?? [])
        : [];
    expect(values).toEqual(expect.arrayContaining(['data-science', 'consulting']));
  });
});
