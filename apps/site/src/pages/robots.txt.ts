/**
 * robots.txt (spec S): everything public may be crawled except the content
 * editor and the Worker's API, and the sitemap is named with the canonical
 * origin. The SCB demo stays crawlable so its noindex header is seen.
 */
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const origin = (site ?? new URL('https://joshlennon.com')).origin;
  const body = [
    'User-agent: *',
    'Disallow: /admin',
    'Disallow: /api/',
    '',
    `Sitemap: ${origin}/sitemap-index.xml`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
