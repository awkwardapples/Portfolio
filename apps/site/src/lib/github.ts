/**
 * GitHub, fetched at build time (spec M.1, ADR-0046): Josh's profile, the
 * repositories listed in profile.yaml (`githubRepos`), and the contribution
 * calendar for the last year.
 *
 * With GH_PROFILE_TOKEN set (the deploy workflow; a fine-grained, read-only
 * token), the GraphQL API is asked and the result is written to
 * src/data/github.snapshot.json. Without a token, or if GitHub fails, the
 * last snapshot is used and a warning is logged: the build never fails
 * because of GitHub, and the browser never talks to it.
 *
 * Josh chooses what to feature by listing it in the profile, in order.
 * Private repositories are never included, and neither are the two that
 * hold SCB agency documents (NEVER_LISTED), even if they are listed.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

export interface GitHubRepo {
  /** owner/name, e.g. awkwardapples/BEATLEASE. */
  fullName: string;
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
  repos: GitHubRepo[];
  calendar: { total: number; days: { date: string; count: number; level: ContributionLevel }[] };
}

/** Never listed, whatever the profile says: they hold SCB agency documents. */
export const NEVER_LISTED = ['awkwardapples/handy-man', 'awkwardapples/scb-handyman'];

const listable = (fullName: string) => !NEVER_LISTED.includes(fullName.toLowerCase());

/**
 * The GraphQL query and its variables: the user, plus one aliased
 * `repository` lookup per listed repository (r0, r1, ...), in order.
 */
export function githubQuery(
  login: string,
  repos: readonly string[],
): { query: string; variables: Record<string, string> } {
  const wanted = repos.filter(listable);
  const variables: Record<string, string> = { login };
  const params = ['$login: String!'];
  const lookups = wanted.map((fullName, index) => {
    const [owner = '', name = ''] = fullName.split('/');
    variables[`o${index}`] = owner;
    variables[`n${index}`] = name;
    params.push(`$o${index}: String!`, `$n${index}: String!`);
    return `r${index}: repository(owner: $o${index}, name: $n${index}) { nameWithOwner name description url stargazerCount pushedAt isPrivate primaryLanguage { name } }`;
  });
  const query = `query(${params.join(', ')}) {
  user(login: $login) {
    name login avatarUrl url
    repositories(privacy: PUBLIC) { totalCount }
    contributionsCollection {
      contributionCalendar { totalContributions weeks { contributionDays { date contributionCount contributionLevel } } }
    }
  }
  ${lookups.join('\n  ')}
}`;
  return { query, variables };
}

const LEVELS: Record<string, ContributionLevel> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

interface RawRepo {
  nameWithOwner?: string;
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
  const data = (response as { data?: Record<string, unknown> })?.data;
  const user = data?.user as Record<string, unknown> | undefined;
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
  // The listed repositories come back as r0, r1, ... in the order asked for.
  const lookups = Object.keys(data ?? {})
    .filter((key) => /^r\d+$/.test(key))
    .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))
    .map((key) => data?.[key] as RawRepo | null);
  const repos = lookups
    .filter(
      (repo): repo is RawRepo =>
        !!repo &&
        repo.isPrivate === false &&
        typeof repo.name === 'string' &&
        typeof repo.nameWithOwner === 'string' &&
        listable(repo.nameWithOwner),
    )
    .slice(0, 4)
    .map((repo) => ({
      fullName: repo.nameWithOwner ?? '',
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
    repos,
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
  /** The repositories to list, as owner/name, in order (profile.yaml `githubRepos`). */
  repos?: readonly string[];
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

/**
 * The freshest GitHub data available: the API with a token, otherwise the
 * snapshot, from which only the repositories still listed are kept, in the
 * listed order.
 */
export async function loadGitHub(options: LoadOptions = {}): Promise<{
  snapshot: GitHubSnapshot;
  source: 'api' | 'snapshot';
}> {
  const {
    token = process.env.GH_PROFILE_TOKEN,
    repos = [],
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
        body: JSON.stringify(githubQuery(login, repos)),
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
  const snapshot = readSnapshot(snapshotPath);
  const byName = new Map(
    (snapshot.repos ?? []).map((repo) => [repo.fullName.toLowerCase(), repo] as const),
  );
  const listed = repos
    .filter(listable)
    .map((fullName) => byName.get(fullName.toLowerCase()))
    .filter((repo): repo is GitHubRepo => repo !== undefined);
  return { snapshot: { ...snapshot, repos: listed }, source: 'snapshot' };
}

let cached: ReturnType<typeof loadGitHub> | undefined;

/** One fetch per build, shared by every page that shows GitHub. */
export function githubData(repos: readonly string[]): ReturnType<typeof loadGitHub> {
  cached ??= loadGitHub({ repos });
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
