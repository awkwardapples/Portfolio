/**
 * Resolves a service to preselect on the Quote page from the URL query
 * string (Step 6.8) — e.g. a service landing page CTA linking to
 * `/quote?service=fencing`. Extracted as a pure function so the parsing and
 * validation logic can be tested without mounting QuotePage.
 */
export function resolvePreselectedServiceId(
  search: string,
  availableServiceIds: readonly string[],
): string | null {
  const requested = new URLSearchParams(search).get('service');
  if (requested === null) {
    return null;
  }
  return availableServiceIds.includes(requested) ? requested : null;
}
