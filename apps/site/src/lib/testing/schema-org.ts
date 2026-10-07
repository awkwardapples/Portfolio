/**
 * The part of the schema.org vocabulary this site uses: each type with the
 * properties schema.org defines for it, its own and inherited (checked
 * against schema.org's type pages). Tests and the browser check validate
 * every node against it, so a misspelt property or one on the wrong type
 * fails before a search engine ignores it.
 */

const THING = ['@type', '@id', 'name', 'alternateName', 'description', 'url', 'image', 'sameAs'];
const CREATIVE_WORK = [
  ...THING,
  'headline',
  'author',
  'contributor',
  'datePublished',
  'dateModified',
  'keywords',
  'inLanguage',
  'associatedMedia',
  'sourceOrganization',
  'isPartOf',
  'mainEntity',
  'thumbnailUrl',
];
const MEDIA_OBJECT = [...CREATIVE_WORK, 'contentUrl', 'embedUrl', 'encodingFormat', 'uploadDate'];

export const VOCABULARY: Record<string, readonly string[]> = {
  Person: [...THING, 'knowsAbout', 'alumniOf', 'affiliation'],
  CollegeOrUniversity: THING,
  WebSite: CREATIVE_WORK,
  ProfilePage: CREATIVE_WORK,
  CreativeWork: CREATIVE_WORK,
  Thesis: [...CREATIVE_WORK, 'inSupportOf'],
  ScholarlyArticle: CREATIVE_WORK,
  BlogPosting: CREATIVE_WORK,
  MediaObject: MEDIA_OBJECT,
  VideoObject: MEDIA_OBJECT,
  MusicRecording: [...CREATIVE_WORK, 'byArtist'],
  BreadcrumbList: [...THING, 'itemListElement'],
  ListItem: [...THING, 'position', 'item'],
};

/** Every problem found in a node and the nodes inside it, as readable lines. */
export function vocabularyProblems(node: unknown, path = 'graph'): string[] {
  if (Array.isArray(node))
    return node.flatMap((item, i) => vocabularyProblems(item, `${path}[${i}]`));
  if (!node || typeof node !== 'object') return [];
  const record = node as Record<string, unknown>;
  // A reference to a node elsewhere in the graph: { "@id": ... } only.
  if (Object.keys(record).length === 1 && '@id' in record) return [];
  const type = record['@type'];
  if (typeof type !== 'string') return [`${path}: no @type`];
  const allowed = VOCABULARY[type];
  if (!allowed) return [`${path}: ${type} is not a type this site uses`];
  const problems: string[] = [];
  for (const [key, value] of Object.entries(record)) {
    if (!allowed.includes(key)) problems.push(`${path}: ${type} has no property ${key}`);
    if (/url$|^item$|^sameAs$|^contentUrl$/i.test(key)) {
      for (const url of [value].flat()) {
        if (typeof url === 'string' && !/^https:\/\//.test(url)) {
          problems.push(`${path}.${key}: ${url} is not an absolute https URL`);
        }
      }
    }
    if (
      /^date|Date$/.test(key) &&
      typeof value === 'string' &&
      !/^\d{4}(-\d{2}-\d{2})?/.test(value)
    ) {
      problems.push(`${path}.${key}: ${value} is not an ISO 8601 date`);
    }
    problems.push(...vocabularyProblems(value, `${path}.${key}`));
  }
  return problems;
}
