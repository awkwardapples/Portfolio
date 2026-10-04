import { describe, expect, it } from 'vitest';

import { publicPath } from './urls';

describe('publicPath', () => {
  it.each([
    ['/index.html', '/'],
    ['/', '/'],
    ['/work.html', '/work'],
    ['/work', '/work'],
    ['/work/growtrades.html', '/work/growtrades'],
    ['/log/index.html', '/log'],
    ['/log/', '/log'],
    ['/404.html', '/404'],
  ])('maps %s to %s', (input, expected) => {
    expect(publicPath(input)).toBe(expected);
  });
});
