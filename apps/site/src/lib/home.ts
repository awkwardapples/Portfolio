/**
 * Decisions behind the homepage (spec G): which work it shows, and where each
 * call to action leads. Kept apart from the components so they are
 * unit-tested (home.test.ts).
 */
import type { IntentValue } from './intents';

/** Homepage section ids (spec G); the threshold's answers lead to some of them. */
export type HomeSection =
  | 'intro'
  | 'selected-work'
  | 'research'
  | 'growtrades'
  | 'music'
  | 'get-in-touch';

export interface CallToAction {
  label: string;
  href: string;
  download?: boolean;
}

export const SELECTED_WORK_COUNT = 4;

/**
 * Featured entries in their order (spec G.2). While fewer than four are
 * published, the newest other entries fill the remaining rows, so published
 * work is never missing from the homepage. Marking an entry `featured`
 * always takes precedence.
 */
export function selectWork<T extends { id: string }>(
  featured: readonly T[],
  newestFirst: readonly T[],
  count = SELECTED_WORK_COUNT,
): T[] {
  const chosen = featured.slice(0, count);
  const ids = new Set(chosen.map((entry) => entry.id));
  for (const entry of newestFirst) {
    if (chosen.length >= count) break;
    if (!ids.has(entry.id)) chosen.push(entry);
  }
  return chosen;
}

export interface CtaInputs {
  /** The sections this build of the homepage contains. */
  sections: ReadonlySet<HomeSection>;
  /** The public CV, when there is one: its URL and size ("140 kB"). */
  cv?: { href: string; size?: string } | undefined;
  /** Pages that exist in this build. */
  pages: { contact: boolean; research: boolean; growtrades: boolean };
}

/**
 * The two calls to action for each answer (spec G.1). A destination that
 * does not exist yet is never linked: until /contact exists, the
 * conversation action becomes "Get in touch" and leads to the email address
 * at the foot of the page, and an answer whose primary action has nowhere to
 * go uses the default set.
 */
export function intentCtas({
  sections,
  cv,
  pages,
}: CtaInputs): Record<IntentValue, CallToAction[]> {
  const conversation = (label: string, intent: IntentValue): CallToAction | undefined => {
    if (pages.contact) return { label, href: `/contact?intent=${intent}` };
    if (sections.has('get-in-touch')) return { label: 'Get in touch', href: '#get-in-touch' };
    return undefined;
  };
  const destination = (section: HomeSection, page: string | undefined) =>
    page ?? (sections.has(section) ? `#${section}` : undefined);
  const pair = (primary: CallToAction | undefined, secondary: CallToAction | undefined) =>
    primary ? (secondary ? [primary, secondary] : [primary]) : undefined;

  const selectedWork = destination('selected-work', undefined);
  const lookingConversation = conversation('Start a conversation', 'looking');
  const looking =
    pair(
      selectedWork ? { label: 'See selected work', href: selectedWork } : undefined,
      lookingConversation,
    ) ?? (lookingConversation ? [lookingConversation] : []);

  const research = destination('research', pages.research ? '/research' : undefined);
  const growtrades = destination('growtrades', pages.growtrades ? '/work/growtrades' : undefined);

  return {
    hiring:
      pair(
        cv
          ? {
              label: cv.size ? `Download CV (PDF, ${cv.size})` : 'Download CV (PDF)',
              href: cv.href,
              download: true,
            }
          : undefined,
        conversation('Start a conversation', 'hiring'),
      ) ?? looking,
    research:
      pair(
        research ? { label: 'Read the research', href: research } : undefined,
        conversation('Start a conversation', 'research'),
      ) ?? looking,
    experience:
      pair(
        growtrades ? { label: 'See GrowTrades', href: growtrades } : undefined,
        conversation('Start a conversation', 'experience'),
      ) ?? looking,
    looking,
  };
}
