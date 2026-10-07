/**
 * Structured data (JSON-LD) for search engines (spec S): who Josh is, on
 * every page, and what each work entry, release and log post is. Built only
 * from the content: a field that is missing leaves its property out, never a
 * guess. Pure, so it is unit-tested; Seo.astro writes the graph into the head.
 */

type Node = Record<string, unknown>;

/** Spec S fixes this list: what search engines should know Josh for. */
export const KNOWS_ABOUT = [
  'Machine learning',
  'Agentic AI',
  'Natural language processing',
  'Computer vision',
];

export const personId = (site: string): string => `${site}/#person`;
const websiteId = (site: string): string => `${site}/#website`;

const isUrl = (value: string | undefined): value is string =>
  typeof value === 'string' && /^https:\/\//.test(value);

const isoDate = (date: Date | undefined): string | undefined =>
  date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : undefined;

/** "A, B and C". */
function list(items: readonly string[]): string {
  if (items.length < 2) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/** Drops undefined values and empty arrays, so absent facts leave no trace. */
function compact(node: Node): Node {
  return Object.fromEntries(
    Object.entries(node).filter(
      ([, value]) => value !== undefined && !(Array.isArray(value) && value.length === 0),
    ),
  );
}

/** One value as itself, several as a list. */
const oneOrMany = <T>(items: T[]): T | T[] | undefined =>
  items.length === 0 ? undefined : items.length === 1 ? items[0] : items;

export interface PersonInput {
  /** The site's origin, without a trailing slash: https://joshlennon.com. */
  site: string;
  name: string;
  alternateNames: readonly string[];
  headline: { role: string; focus: readonly string[] };
  /** An absolute URL for the portrait, once there is one. */
  portraitUrl?: string | undefined;
  links: {
    github?: string | undefined;
    linkedin?: string | undefined;
    youtube?: string | undefined;
    spotify?: string | undefined;
  };
  education: readonly {
    institution: string;
    status: 'complete' | 'in-progress';
    url?: string | undefined;
  }[];
}

/**
 * Josh, on every page. Universities he finished are `alumniOf`, the one he
 * is studying at is `affiliation`. No `jobTitle` until he holds a role with
 * that title (spec S).
 */
export function person(input: PersonInput): Node {
  const university = (entry: PersonInput['education'][number]): Node =>
    compact({
      '@type': 'CollegeOrUniversity',
      name: entry.institution,
      url: isUrl(entry.url) ? entry.url : undefined,
    });
  const { links } = input;
  return compact({
    '@type': 'Person',
    '@id': personId(input.site),
    name: input.name,
    alternateName: [...input.alternateNames],
    url: `${input.site}/`,
    image: isUrl(input.portraitUrl) ? input.portraitUrl : undefined,
    description:
      input.headline.focus.length > 0
        ? `${input.headline.role}: ${list(input.headline.focus)}`
        : input.headline.role,
    knowsAbout: KNOWS_ABOUT,
    alumniOf: oneOrMany(
      input.education.filter((entry) => entry.status === 'complete').map(university),
    ),
    affiliation: oneOrMany(
      input.education.filter((entry) => entry.status === 'in-progress').map(university),
    ),
    sameAs: [links.github, links.linkedin, links.youtube, links.spotify].filter(isUrl),
  });
}

/** The site itself, on the homepage. */
export function website(site: string, name: string): Node {
  return {
    '@type': 'WebSite',
    '@id': websiteId(site),
    url: `${site}/`,
    name,
    inLanguage: 'en-GB',
    author: { '@id': personId(site) },
  };
}

/** The about page is a profile of Josh. */
export function profilePage(site: string, url: string): Node {
  return {
    '@type': 'ProfilePage',
    url,
    mainEntity: { '@id': personId(site) },
    isPartOf: { '@id': websiteId(site) },
  };
}

/** Home, then each level down to the page itself. */
export function breadcrumbs(site: string, trail: readonly { name: string; path: string }[]): Node {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((step, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: step.name,
      item: new URL(step.path, `${site}/`).href,
    })),
  };
}

export interface WorkInput {
  site: string;
  /** The page's canonical URL. */
  url: string;
  title: string;
  summary: string;
  kind: string;
  date?: Date | undefined;
  /** 'year' when only the year is known: the date is then given as "2026". */
  datePrecision?: 'year' | undefined;
  updated?: Date | undefined;
  authorship?: string | undefined;
  context?: { institution?: string | undefined; programme?: string | undefined } | undefined;
  /** Documents with absolute URLs. */
  documents: readonly { url: string; title: string; docType: string }[];
  tags: readonly string[];
  imageUrl?: string | undefined;
}

/**
 * A work entry. Research is a `Thesis` when its document is a dissertation,
 * a `ScholarlyArticle` when it is a paper, otherwise a `CreativeWork`; other
 * kinds are a `CreativeWork`. Josh is the author when the work is his or he
 * led it, and a contributor otherwise; unknown authorship states neither.
 */
export function work(input: WorkInput): Node {
  const types = input.documents.map((document) => document.docType);
  const type =
    input.kind === 'research' && types.includes('dissertation')
      ? 'Thesis'
      : input.kind === 'research' && types.includes('paper')
        ? 'ScholarlyArticle'
        : 'CreativeWork';
  const josh = { '@id': personId(input.site) };
  const authored = input.authorship === 'sole' || input.authorship === 'lead';
  return compact({
    '@type': type,
    name: input.title,
    headline: type === 'ScholarlyArticle' ? input.title.slice(0, 110) : undefined,
    description: input.summary,
    url: input.url,
    datePublished:
      input.datePrecision === 'year' && input.date
        ? String(input.date.getUTCFullYear())
        : isoDate(input.date),
    dateModified: isoDate(input.updated),
    author: authored ? josh : undefined,
    contributor: input.authorship === 'contributor' ? josh : undefined,
    inSupportOf: type === 'Thesis' ? input.context?.programme : undefined,
    sourceOrganization: input.context?.institution
      ? { '@type': 'CollegeOrUniversity', name: input.context.institution }
      : undefined,
    keywords: input.tags.length > 0 ? input.tags.join(', ') : undefined,
    image: isUrl(input.imageUrl) ? input.imageUrl : undefined,
    inLanguage: 'en-GB',
    associatedMedia: oneOrMany(
      input.documents.map((document) => ({
        '@type': 'MediaObject',
        name: document.title,
        contentUrl: document.url,
        encodingFormat: 'application/pdf',
      })),
    ),
  });
}

/** A YouTube video, only once its upload date is known (spec S). */
export function video(input: {
  id: string;
  title: string;
  uploadDate?: Date | undefined;
}): Node | undefined {
  const uploadDate = isoDate(input.uploadDate);
  if (!uploadDate) return undefined;
  return {
    '@type': 'VideoObject',
    name: input.title,
    uploadDate,
    thumbnailUrl: `https://i.ytimg.com/vi/${input.id}/hqdefault.jpg`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${input.id}`,
    url: `https://www.youtube.com/watch?v=${input.id}`,
  };
}

/** A release on Spotify, by Josh. */
export function recording(site: string, input: { title: string; url: string }): Node {
  return {
    '@type': 'MusicRecording',
    name: input.title,
    url: input.url,
    byArtist: { '@id': personId(site) },
  };
}

/** A log post. */
export function post(input: {
  site: string;
  url: string;
  title: string;
  summary: string;
  date?: Date | undefined;
}): Node {
  return compact({
    '@type': 'BlogPosting',
    headline: input.title.slice(0, 110),
    description: input.summary,
    url: input.url,
    datePublished: isoDate(input.date),
    author: { '@id': personId(input.site) },
    inLanguage: 'en-GB',
  });
}

/**
 * The page's graph as the text of a `<script type="application/ld+json">`.
 * `<` is escaped so no value can close the element early.
 */
export function serialize(nodes: readonly (Node | undefined)[]): string {
  const graph = nodes.filter((node): node is Node => node !== undefined);
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(
    /</g,
    '\\u003c',
  );
}
