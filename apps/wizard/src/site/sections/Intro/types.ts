export interface IntroContent {
  heading: string;
  body: string;
  bulletPoints?: string[];
  /**
   * How `bulletPoints` should be presented. `'credibility'` features the
   * first point in a separate quote-styled panel (the home page's curated,
   * independently-quotable trust facts); `'checklist'` renders every point
   * as a plain list in the main column with nothing promoted out (service
   * pages' full-coverage checklists, where every item must stay visible and
   * no single item is more "featured" than another). Explicit, not inferred
   * from list length — Phase 10 finding: inferring from shape silently drops
   * the first checklist item into a pull-quote and off the visible list.
   */
  variant: 'credibility' | 'checklist';
  cta?: {
    label: string;
    href: string;
  };
}
