/**
 * GitHub, fetched at build time (spec M.1, ADR-0046): Josh's profile, the
 * repositories he pins, and the contribution calendar for the last year.
 *
 * With GH_PROFILE_TOKEN set (the deploy workflow; a fine-grained, read-only
 * token), the GraphQL API is asked and the result is written to
 * src/data/github.snapshot.json. Without a token, or if GitHub fails, the
 * last snapshot is used and a warning is logged: the build never fails
 * because of GitHub, and the browser never talks to it.
 *
 * Only pinned repositories are shown: Josh chooses what to feature by
 * pinning it. Private ones are never included.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

export interface GitHubRepo {
  name: string;
  description: string | null;
  url: string;
  stars: number;
  pushedAt: string;
  language: string | null;
}

export interface GitHubSnapshot {
  fetchedAt: string;
  login: string;
  name: string | null;
  url: string;
  avatarUrl: string;
  publicRepos: number;
  pinned: GitHubRepo[];
  calendar: { total: number; days: { date: string; count: number; level: ContributionLevel }[] };
}

export const GITHUB_QUERY = `query($login: String!) {
  user(login: $login) {
    name login avatarUrl url
    repositories(privacy: PUBLIC) { totalCount }
    pinnedItems(first: 6, types: REPOSITORY) {
      nodes { ... on Repository { name description url stargazerCount pushedAt isPrivate primaryLanguage { name } } }
    }
    contributionsCollection {
      contributionCalendar { totalContributions weeks { contributionDays { date contributionCount contributionLevel } } }
    }
  }
}`;

const LEVELS: Record<string, ContributionLevel> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

interface RawRepo {
  name?: string;
  description?: string | null;
  url?: string;
  stargazerCount?: number;
  pushedAt?: string;
  isPrivate?: boolean;
  primaryLanguage?: { name?: string } | null;
}

/** Turns the GraphQL response into a snapshot, or throws if it is not one. */
export function parseGitHub(response: unknown, fetchedAt: string): GitHubSnapshot {
  const user = (response as { data?: { user?: Record<string, unknown> } })?.data?.user;
  if (!user || typeof user.login !== 'string') throw new Error('GitHub: no user in the response');
  const calendar = (
    user.contributionsCollection as {
      contributionCalendar?: {
        totalContributions?: number;
        weeks?: {
          contributionDays?: {
            date: string;
            contributionCount: number;
            contributionLevel: string;
          }[];
        }[];
      };
    }
  )?.contributionCalendar;
  const pinned = ((user.pinnedItems as { nodes?: RawRepo[] })?.nodes ?? [])
    .filter((repo) => repo && repo.isPrivate === false && typeof repo.name === 'string')
    .slice(0, 4)
    .map((repo) => ({
      name: repo.name ?? '',
      description: repo.description ?? null,
      url: repo.url ?? '',
      stars: repo.stargazerCount ?? 0,
      pushedAt: repo.pushedAt ?? '',
      language: repo.primaryLanguage?.name ?? null,
    }));
  return {
    fetchedAt,
    login: user.login,
    name: typeof user.name === 'string' ? user.name : null,
    url: typeof user.url === 'string' ? user.url : `https://github.com/${user.login}`,
    avatarUrl: typeof user.avatarUrl === 'string' ? user.avatarUrl : '',
    publicRepos: (user.repositories as { totalCount?: number })?.totalCount ?? 0,
    pinned,
    calendar: {
      total: calendar?.totalContributions ?? 0,
      days: (calendar?.weeks ?? []).flatMap((week) =>
        (week.contributionDays ?? []).map((day) => ({
          date: day.date,
          count: day.contributionCount,
          level: LEVELS[day.contributionLevel] ?? 0,
        })),
      ),
    },
  };
}

export interface LoadOptions {
  token?: string | undefined;
  login?: string;
  snapshotPath?: string;
  fetchImpl?: typeof fetch;
  now?: () => Date;
  log?: (message: string) => void;
  /** Whether to write a fresh snapshot to disk (off in tests). */
  write?: boolean;
}

const DEFAULT_SNAPSHOT = join(process.cwd(), 'src/data/github.snapshot.json');

export function readSnapshot(path: string = DEFAULT_SNAPSHOT): GitHubSnapshot {
  return JSON.parse(readFileSync(path, 'utf8')) as GitHubSnapshot;
}

/** The freshest GitHub data available: the API with a token, otherwise the snapshot. */
export async function loadGitHub(options: LoadOptions = {}): Promise<{
  snapshot: GitHubSnapshot;
  source: 'api' | 'snapshot';
}> {
  const {
    token = process.env.GH_PROFILE_TOKEN,
    login = process.env.GITHUB_USERNAME ?? 'awkwardapples',
    snapshotPath = DEFAULT_SNAPSHOT,
    fetchImpl = fetch,
    now = () => new Date(),
    log = (message: string) => console.warn(message),
    write = true,
  } = options;

  if (token) {
    try {
      const response = await fetchImpl('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
          'user-agent': 'joshlennon.com build',
        },
        body: JSON.stringify({ query: GITHUB_QUERY, variables: { login } }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const snapshot = parseGitHub(await response.json(), now().toISOString());
      if (write) writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
      return { snapshot, source: 'api' };
    } catch (error) {
      log(
        `github: using the snapshot (${error instanceof Error ? error.message : 'unknown error'})`,
      );
    }
  }
  return { snapshot: readSnapshot(snapshotPath), source: 'snapshot' };
}

let cached: ReturnType<typeof loadGitHub> | undefined;

/** One fetch per build, shared by every page that shows GitHub. */
export function githubData(): ReturnType<typeof loadGitHub> {
  cached ??= loadGitHub();
  return cached;
}

/** Days grouped into weeks (columns), Sunday first, as GitHub draws them. */
export function calendarWeeks(
  days: GitHubSnapshot['calendar']['days'],
): (GitHubSnapshot['calendar']['days'][number] | null)[][] {
  const weeks: (GitHubSnapshot['calendar']['days'][number] | null)[][] = [];
  let week: (GitHubSnapshot['calendar']['days'][number] | null)[] = [];
  days.forEach((day, index) => {
    const weekday = new Date(`${day.date}T00:00:00Z`).getUTCDay();
    if (index === 0) week = Array.from({ length: weekday }, () => null);
    if (weekday === 0 && week.length > 0) {
      weeks.push(week);
      week = [];
    }
    week.push(day);
  });
  if (week.length > 0) weeks.push(week);
  return weeks;
}

/** Contributions per month, for the accessible table: "October 2025: 120". */
export function monthlyTotals(
  days: GitHubSnapshot['calendar']['days'],
): { month: string; total: number }[] {
  const totals = new Map<string, number>();
  for (const day of days) {
    const month = day.date.slice(0, 7);
    totals.set(month, (totals.get(month) ?? 0) + day.count);
  }
  return [...totals].map(([month, total]) => ({
    month: new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }),
    total,
  }));
}
