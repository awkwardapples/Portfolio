import { describe, expect, it } from 'vitest';

import {
  initialMemoryTarget,
  memoryHref,
  resolveRouterMode,
  splitTarget,
} from '@/site/routing/navigation';

/** The SCB demo's router modes (portfolio spec J.3, ADR-0044). */
describe('resolveRouterMode', () => {
  it('is memory only when asked for, and history otherwise', () => {
    expect(resolveRouterMode('memory')).toBe('memory');
    expect(resolveRouterMode('history')).toBe('history');
    expect(resolveRouterMode(undefined)).toBe('history');
    expect(resolveRouterMode('MEMORY')).toBe('history');
  });
});

describe('splitTarget', () => {
  it('separates the path from the query and drops the hash', () => {
    expect(splitTarget('/quote?service=fencing#top')).toEqual({
      path: '/quote',
      search: '?service=fencing',
    });
    expect(splitTarget('/services')).toEqual({ path: '/services', search: '' });
    expect(splitTarget('?x=1')).toEqual({ path: '/', search: '?x=1' });
  });
});

describe('memoryHref and initialMemoryTarget', () => {
  const base = '/demo/scb-handyman/';

  it('gives each page of the demo an address that opens on that page', () => {
    expect(memoryHref(base, '/services')).toBe('/demo/scb-handyman/?path=%2Fservices');
    const href = memoryHref(base, '/quote?service=fencing');
    expect(initialMemoryTarget(href.slice(href.indexOf('?')))).toEqual({
      path: '/quote',
      search: '?service=fencing',
    });
  });

  it('starts on the home page without ?path=, and refuses anything but a local path', () => {
    expect(initialMemoryTarget('')).toEqual({ path: '/', search: '' });
    expect(initialMemoryTarget('?path=https://evil.example')).toEqual({ path: '/', search: '' });
    expect(initialMemoryTarget('?path=//evil.example')).toEqual({ path: '/', search: '' });
  });
});
