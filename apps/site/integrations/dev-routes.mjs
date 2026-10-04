/**
 * Pages that exist only in `astro dev`: tools for Josh and for development,
 * never part of a production build (so never in the sitemap or the deploy).
 *
 *   /dev/content   every entry, draft or not, with gaps highlighted (Pass 2)
 */
export function devRoutes() {
  return {
    name: 'jl-dev-routes',
    hooks: {
      'astro:config:setup': ({ command, injectRoute }) => {
        if (command !== 'dev') return;
        injectRoute({
          pattern: '/dev/content',
          entrypoint: new URL('../src/dev-pages/content.astro', import.meta.url),
        });
      },
    },
  };
}
