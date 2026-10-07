import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  calendarWeeks,
  describeRepos,
  githubQuery,
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
    // The listed repositories, in the order asked for.
    r0: {
      nameWithOwner: 'awkwardapples/Portfolio',
      name: 'Portfolio',
      description: 'This site',
      url: 'https://github.com/awkwardapples/Portfolio',
      stargazerCount: 2,
      pushedAt: '2026-10-04T12:00:00Z',
      isPrivate: false,
      primaryLanguage: { name: 'TypeScript' },
    },
    r1: {
      nameWithOwner: 'awkwardapples/secret',
      name: 'secret',
      isPrivate: true,
      url: 'x',
      stargazerCount: 0,
      pushedAt: '',
    },
    r2: null,
    r3: {
      nameWithOwner: 'awkwardapples/Handy-Man',
      name: 'Handy-Man',
      isPrivate: false,
      url: 'https://github.com/awkwardapples/Handy-Man',
      stargazerCount: 0,
      pushedAt: '',
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
  it('keeps listed public repositories only, never the SCB ones, and maps levels to 0 to 4', () => {
    const snapshot = parseGitHub(response, '2026-10-05T00:00:00.000Z');
    expect(snapshot.repos.map((repo) => repo.name)).toEqual(['Portfolio']);
    expect(snapshot.repos[0]).toMatchObject({
      fullName: 'awkwardapples/Portfolio',
      language: 'TypeScript',
      stars: 2,
    });
    expect(snapshot.calendar.total).toBe(5);
    expect(snapshot.calendar.days.map((day) => day.level)).toEqual([0, 2, 1]);
    expect(snapshot.publicRepos).toBe(8);
  });

  it('refuses a response without a user', () => {
    expect(() => parseGitHub({ errors: [{ message: 'Bad credentials' }] }, '')).toThrow();
  });
});

describe('githubQuery', () => {
  it('asks for each listed repository in order, through variables, and never for the SCB ones', () => {
    const { query, variables } = githubQuery('awkwardapples', [
      'awkwardapples/BEATLEASE',
      'awkwardapples/Handy-Man',
      'fmcewan/COMP34111-AI-Games-Hex-Group34',
    ]);
    expect(variables).toEqual({
      login: 'awkwardapples',
      o0: 'awkwardapples',
      n0: 'BEATLEASE',
      o1: 'fmcewan',
      n1: 'COMP34111-AI-Games-Hex-Group34',
    });
    expect(query).toContain('r0: repository(owner: $o0, name: $n0)');
    expect(query).toContain('r1: repository(owner: $o1, name: $n1)');
    expect(query).not.toContain('r2:');
    expect(query).not.toContain('Handy-Man');
  });
});

describe('loadGitHub', () => {
  it('uses the snapshot when there is no token, without asking GitHub', async () => {
    const fetchImpl = vi.fn();
    const result = await loadGitHub({
      token: '',
      repos: ['awkwardapples/portfolio'],
      snapshotPath: snapshotFile(),
      fetchImpl,
      write: false,
    });
    expect(result.source).toBe('snapshot');
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result.snapshot.repos.map((repo) => repo.name)).toEqual(['Portfolio']);
  });

  it('keeps only the repositories still listed when it falls back to the snapshot', async () => {
    const result = await loadGitHub({
      token: '',
      repos: ['awkwardapples/BEATLEASE'],
      snapshotPath: snapshotFile(),
      write: false,
    });
    expect(result.snapshot.repos).toEqual([]);
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

describe('describeRepos', () => {
  const repo = (fullName: string, description: string | null) => ({
    fullName,
    name: fullName.split('/')[1] ?? fullName,
    description,
    url: `https://github.com/${fullName}`,
    stars: 0,
    pushedAt: '2026-01-01T00:00:00Z',
    language: null,
  });

  it("uses Josh's description where the profile gives one, and GitHub's otherwise", () => {
    const described = describeRepos(
      [repo('team/Hex-Group34', 'Group 34 implementation.'), repo('josh/own', 'From GitHub.')],
      [
        { repo: 'Team/hex-group34', description: 'A Monte Carlo agent for Hex.' },
        { repo: 'josh/own', description: undefined },
      ],
    );
    expect(described.map((r) => r.description)).toEqual([
      'A Monte Carlo agent for Hex.',
      'From GitHub.',
    ]);
  });
});
