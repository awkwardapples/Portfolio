/**
 * The path a visitor sees for a page.
 *
 * With `build.format: 'file'`, Astro reports `/index.html` and `/work.html`
 * during the build; the Worker serves those files at `/` and `/work`
 * (`html_handling: "drop-trailing-slash"`), so canonical URLs, Open Graph URLs
 * and internal links use the served form.
 */
export function publicPath(pathname: string): string {
  let path = pathname.replace(/\.html$/, '');
  if (path.endsWith('/index')) path = path.slice(0, -'index'.length);
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  return path === '' ? '/' : path;
}
