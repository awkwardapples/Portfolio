import { describe, expect, it, vi } from 'vitest';

import { NAVIGATE, navigationMessage, reportNavigation } from './navigation';

/** The address the demo reports to the page that frames it (Pass 11, E.3). */

describe('reportNavigation', () => {
  it('names the console path, as Arbiter serves it, under /console', () => {
    expect(navigationMessage('/')).toEqual({ type: NAVIGATE, path: '/console/' });
    expect(navigationMessage('/runs/run-6d3315765358')).toEqual({
      type: 'arbiter-demo:navigate',
      path: '/console/runs/run-6d3315765358',
    });
  });

  it("posts to the parent, on this page's own origin only", () => {
    const postMessage = vi.fn();
    const framed = {
      parent: { postMessage },
      location: { origin: 'https://joshlennon.com' },
    } as unknown as Window;
    reportNavigation(framed, '/cases');
    expect(postMessage).toHaveBeenCalledWith(
      { type: 'arbiter-demo:navigate', path: '/console/cases' },
      'https://joshlennon.com',
    );
  });

  it('says nothing when the demo is not framed', () => {
    const postMessage = vi.fn();
    const alone = {
      location: { origin: 'https://joshlennon.com' },
      postMessage,
    } as unknown as Window;
    (alone as unknown as { parent: Window }).parent = alone;
    reportNavigation(alone, '/');
    expect(postMessage).not.toHaveBeenCalled();
  });
});
