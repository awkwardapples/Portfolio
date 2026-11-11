import { describe, expect, it } from 'vitest';

import { addressFor, frameScale, phoneFrame, readNavigateMessage } from './site-frame';

const ORIGIN = 'https://joshlennon.com';
const demoWindow = { name: 'demo' };

describe('readNavigateMessage (spec J.4: validate origin and source)', () => {
  const message = (
    overrides: Partial<{ origin: string; source: unknown; data: unknown }> = {},
  ) => ({
    origin: ORIGIN,
    source: demoWindow,
    data: { type: 'scb-demo:navigate', path: '/services' },
    ...overrides,
  });
  const expected = { origin: ORIGIN, source: demoWindow };

  it('reads the path from our demo', () => {
    expect(readNavigateMessage(message(), expected)).toBe('/services');
  });

  it('ignores messages from another origin or another frame', () => {
    expect(readNavigateMessage(message({ origin: 'https://evil.example' }), expected)).toBeNull();
    expect(readNavigateMessage(message({ source: { name: 'other' } }), expected)).toBeNull();
    expect(readNavigateMessage(message(), { origin: ORIGIN, source: null })).toBeNull();
  });

  it('ignores other message types and anything that is not a local path', () => {
    for (const data of [
      { type: 'other', path: '/x' },
      { type: 'scb-demo:navigate', path: 'https://evil.example' },
      { type: 'scb-demo:navigate', path: '//evil.example' },
      { type: 'scb-demo:navigate', path: 42 },
      'scb-demo:navigate',
      null,
    ]) {
      expect(readNavigateMessage(message({ data }), expected), JSON.stringify(data)).toBeNull();
    }
  });
});

describe("each demo's own message type (Pass 11, E.5)", () => {
  it("reads only the expected demo's messages", () => {
    const expected = { origin: ORIGIN, source: demoWindow };
    const arbiter = {
      origin: ORIGIN,
      source: demoWindow,
      data: { type: 'arbiter-demo:navigate', path: '/console/runs/run-6d3315765358' },
    };
    expect(readNavigateMessage(arbiter, expected, 'arbiter-demo:navigate')).toBe(
      '/console/runs/run-6d3315765358',
    );
    // The SCB frame ignores Arbiter's messages, and the other way round.
    expect(readNavigateMessage(arbiter, expected)).toBeNull();
    expect(
      readNavigateMessage(
        { ...arbiter, data: { type: 'scb-demo:navigate', path: '/quote' } },
        expected,
        'arbiter-demo:navigate',
      ),
    ).toBeNull();
  });
});

describe('phoneFrame', () => {
  it('runs a wide demo at its own width, scaled to an upright phone', () => {
    expect(phoneFrame({ width: 422, height: 700 }, 844)).toEqual({
      width: 844,
      height: 1400,
      scale: 0.5,
    });
  });

  it('fills the screen natively when it is wide enough, or without a minimum', () => {
    expect(phoneFrame({ width: 844, height: 390 }, 844)).toEqual({
      width: 844,
      height: 390,
      scale: 1,
    });
    expect(phoneFrame({ width: 390, height: 844 }, undefined)).toEqual({
      width: 390,
      height: 844,
      scale: 1,
    });
  });
});

describe('frameScale and addressFor', () => {
  it('scales a 1280 px viewport down to the box, never up', () => {
    expect(frameScale(640, 1280)).toBe(0.5);
    expect(frameScale(2000, 1280)).toBe(1);
    expect(frameScale(0, 1280)).toBe(1);
  });

  it('shows the domain, with the path after the home page', () => {
    expect(addressFor('scbhandyman.co.uk', '/')).toBe('scbhandyman.co.uk');
    expect(addressFor('scbhandyman.co.uk', '/services')).toBe('scbhandyman.co.uk/services');
    expect(addressFor('localhost:8000', '/console/')).toBe('localhost:8000/console/');
  });
});
