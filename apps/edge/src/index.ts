/**
 * The portfolio's Cloudflare Worker (spec U.1, ADR-0040).
 *
 * Only `/api/*` runs this code first (`run_worker_first` in wrangler.jsonc);
 * every other request is answered by the asset handler from apps/site/dist.
 * `POST /api/submit` arrives with the contact pipeline in Pass 6.
 */
import type { Env } from './env';
import { json } from './http';

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const { pathname } = new URL(request.url);

  if (pathname === '/api/health') {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return json(405, { errorCode: 'method_not_allowed' }, { allow: 'GET, HEAD' });
    }
    return json(200, { status: 'ok' });
  }

  if (pathname === '/api' || pathname.startsWith('/api/')) {
    return json(404, { errorCode: 'not_found' });
  }

  // Not reached while only /api/* runs the Worker first, but keeps the Worker
  // correct if that routing ever changes.
  return env.ASSETS.fetch(request);
}

export default {
  fetch: (request, env) => handleRequest(request, env),
} satisfies ExportedHandler<Env>;
