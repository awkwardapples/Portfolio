/**
 * The log as an RSS feed (spec F.1): every published post, newest first,
 * with its summary. Linked from the footer and /log once a post exists.
 */
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';

import { dateOf, getPosts } from '~/lib/content';

export async function GET(context: APIContext): Promise<Response> {
  const posts = await getPosts();
  return rss({
    title: 'Josh Lennon: Log',
    description: 'Dated updates from Josh Lennon across research, software, ventures and music.',
    site: context.site ?? 'https://joshlennon.com',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.summary,
      link: `/log/${post.id}`,
      pubDate: dateOf(post.data.date),
      categories: post.data.threads,
    })),
    customData: '<language>en-gb</language>',
  });
}
