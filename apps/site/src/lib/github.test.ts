import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  calendarWeeks,
  loadGitHub,
  monthlyTotals,
  parseGitHub,
  type GitHubSnapshot,
} from './github';

/** GitHub at build time (spec M.1; Pass 8 acceptance: the build succeeds with the API blocked). */

const response = {
  data: {
    user: {
      name: 'Josh Lennon',
      login: 'awkwardapples',
      avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
      url: 'https://github.com/awkwardapples',
      repositories: { totalCount: 8 },
      pinnedItems: {
        nodes: [
          {
            name: 'Portfolio',
            description: 'This site',
            url: 'https://github.com/awkwardapples/Portfolio',
            stargazerCount: 2,
            pushedAt: '2026-10-04T12:00:00Z',
            isPrivate: false,
            primaryLanguage: { name: 'TypeScript' },
          },
          { name: 'secret', isPrivate: true, url: 'x', stargazerCount: 0, pushedAt: '' },
        ],
      },
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: 5,
          weeks: [
            {
              contributionDays: [
                { date: '2026-09-29', contributionCount: 0, contributionLevel: 'NONE' },
                { date: '2026-09-30', contributionCount: 3, contributionLevel: 'SECOND_QUARTILE' },
              ],
            },
            {
              contributionDays: [
                { date: '2026-10-04', contributionCount: 2, contributionLevel: 'FIRST_QUARTILE' },
              ],
            },
          ],
        },
      },
    },
  },
};

function snapshotFile(): string {
  const dir = mkdtempSync(join(tmpdir(), 'github-'));
  const path = join(dir, 'github.snapshot.json');
  writeFileSync(path, JSON.stringify(parseGitHub(response, '2026-10-01T00:00:00.000Z')));
  return path;
}

describe('parseGitHub', () => {
  it('keeps public pinned repositories only, and maps contribution levels to 0 to 4', () => {
    const snapshot = parseGitHub(response, '2026-10-05T00:00:00.000Z');
    expect(snapshot.pinned.map((repo) => repo.name)).toEqual(['Portfolio']);
    expect(snapshot.pinned[0]).toMatchObject({ language: 'TypeScript', stars: 2 });
    expect(snapshot.calendar.total).toBe(5);
    expect(snapshot.calendar.days.map((day) => day.level)).toEqual([0, 2, 1]);
    expect(snapshot.publicRepos).toBe(8);
  });

  it('refuses a response without a user', () => {
    expect(() => parseGitHub({ errors: [{ message: 'Bad credentials' }] }, '')).toThrow();
  });
});

describe('loadGitHub', () => {
  it('uses the snapshot when there is no token, without asking GitHub', async () => {
    const fetchImpl = vi.fn();
    const result = await loadGitHub({
      token: '',
      snapshotPath: snapshotFile(),
      fetchImpl,
      write: false,
    });
    expect(result.source).toBe('snapshot');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('uses the snapshot, with a warning, when GitHub is unreachable or refuses', async () => {
    for (const fetchImpl of [
      vi.fn(async () => {
        throw new TypeError('fetch failed');
      }),
      vi.fn(async () => new Response('{}', { status: 401 })),
      vi.fn(async () => new Response(JSON.stringify({ errors: [{}] }), { status: 200 })),
    ]) {
      const log = vi.fn();
      const result = await loadGitHub({
        token: 't',
        snapshotPath: snapshotFile(),
        fetchImpl: fetchImpl as unknown as typeof fetch,
        log,
        write: false,
      });
      expect(result.source).toBe('snapshot');
      expect(log).toHaveBeenCalledWith(expect.stringMatching(/^github: using the snapshot/));
    }
  });

  it('asks the API with the token and writes a fresh snapshot', async () => {
    const path = snapshotFile();
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(response), { status: 200 }));
    const result = await loadGitHub({
      token: 'secret-token',
      snapshotPath: path,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      now: () => new Date('2026-10-05T06:00:00.000Z'),
    });
    expect(result.source).toBe('api');
    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer secret-token');
    const written = JSON.parse(readFileSync(path, 'utf8')) as GitHubSnapshot;
    expect(written.fetchedAt).toBe('2026-10-05T06:00:00.000Z');
    expect(JSON.stringify(written)).not.toContain('secret-token');
  });
});

describe('calendar helpers', () => {
  const days = parseGitHub(response, '').calendar.days;

  it('groups days into Sunday-first weeks, padding the first', () => {
    const weeks = calendarWeeks(days);
    // 2026-09-29 is a Tuesday: two empty days before it.
    expect(weeks[0]?.slice(0, 2)).toEqual([null, null]);
    expect(weeks[0]?.[2]?.date).toBe('2026-09-29');
    // 2026-10-04 is a Sunday: it starts the next week.
    expect(weeks[1]?.[0]?.date).toBe('2026-10-04');
  });

  it('totals contributions by month for the accessible table', () => {
    expect(monthlyTotals(days)).toEqual([
      { month: 'September 2026', total: 3 },
      { month: 'October 2026', total: 2 },
    ]);
  });
});
