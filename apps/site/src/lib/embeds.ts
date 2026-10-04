/**
 * Recognising embeddable links in MDX bodies (spec T.2): a YouTube or Spotify
 * URL, or a link to a PDF in public/documents/, alone on its own line. The
 * MDX paragraph override (components/mdx/Paragraph.astro) turns them into a
 * facade or a document card. Pure functions, so they are unit-tested.
 */

export type Embed =
  | { type: 'youtube'; id: string; title: string; start?: number | undefined }
  | { type: 'spotify'; url: string; title: string }
  | { type: 'document'; file: string; title: string };

const YOUTUBE_ID = /^[\w-]{11}$/;

function youtubeId(url: URL): string | undefined {
  const host = url.hostname.replace(/^(www\.|m\.)/, '');
  let id: string | undefined;
  if (host === 'youtu.be') id = url.pathname.slice(1);
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') id = url.searchParams.get('v') ?? undefined;
    else id = /^\/(?:embed|shorts|live)\/([\w-]+)/.exec(url.pathname)?.[1];
  }
  return id && YOUTUBE_ID.test(id) ? id : undefined;
}

function seconds(value: string | null): number | undefined {
  if (!value) return undefined;
  const match = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/.exec(value);
  if (!match) return undefined;
  const [, h = '0', m = '0', s = '0'] = match;
  const total = Number(h) * 3600 + Number(m) * 60 + Number(s);
  return total > 0 ? total : undefined;
}

/**
 * What a lone link should become, or undefined for an ordinary link. The
 * link text is the title, unless it is just the URL again.
 */
export function embedFor(href: string, text: string): Embed | undefined {
  const label = text.trim();
  const titled = (fallback: string) => (label && label !== href ? label : fallback);

  const pdf = /^(?:\/documents\/|\.\/)?([a-z0-9]+(?:-[a-z0-9]+)*\.pdf)$/.exec(href);
  if (pdf?.[1]) return { type: 'document', file: pdf[1], title: titled(pdf[1]) };

  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return undefined;
  }
  if (url.protocol !== 'https:') return undefined;

  const id = youtubeId(url);
  if (id) {
    return {
      type: 'youtube',
      id,
      title: titled('Video on YouTube'),
      start: seconds(url.searchParams.get('t') ?? url.searchParams.get('start')),
    };
  }
  if (
    url.hostname === 'open.spotify.com' &&
    /^\/(?:intl-[a-z]+\/)?(track|album|playlist|episode|show|artist)\/\w+$/.test(url.pathname)
  ) {
    return { type: 'spotify', url: `${url.origin}${url.pathname}`, title: titled('On Spotify') };
  }
  return undefined;
}

const LONE_LINK = /^\s*<a href="([^"]+)"[^>]*>([^<]*)<\/a>\s*$/;
const LONE_IMAGE = /^\s*(<img\b[^>]*>)\s*$/;

/** The href and text of a paragraph's HTML when it is a single link and nothing else. */
export function loneLink(html: string): { href: string; text: string } | undefined {
  const match = LONE_LINK.exec(html);
  if (!match?.[1]) return undefined;
  return { href: decodeEntities(match[1]), text: decodeEntities(match[2] ?? '') };
}

/** A paragraph that holds one image and nothing else, with its title for the caption. */
export function loneImage(html: string): { img: string; caption?: string | undefined } | undefined {
  const match = LONE_IMAGE.exec(html);
  if (!match?.[1]) return undefined;
  const title = /\btitle="([^"]*)"/.exec(match[1])?.[1];
  return {
    img: match[1].replace(/\s*\btitle="[^"]*"/, ''),
    caption: title ? decodeEntities(title) : undefined,
  };
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
