import { createContext, useContext, type ReactNode } from 'react';

import type { ContentResultStep } from '@/domain/config/wizard-config';

/**
 * What a content-result step shows (portfolio spec I.4, ADR-0042). The
 * engine knows nothing about the host's content: the host computes items for
 * each selection at build time and provides them here, with the handler for
 * the step's exit button.
 */
export interface ContentResultAction {
  readonly label: string;
  readonly href: string;
  readonly download?: boolean;
}

export interface ContentResultItem {
  readonly title: string;
  readonly summary: string;
  /** "Research, 2025" */
  readonly meta?: string;
  readonly url: string;
  readonly coverUrl?: string;
  readonly coverAlt?: string;
  readonly actions: readonly ContentResultAction[];
}

export type ContentSelection = ContentResultStep['selection'];

export interface ContentResults {
  readonly items: Readonly<Partial<Record<ContentSelection, readonly ContentResultItem[]>>>;
  /** A direct action shown above the items, per selection (e.g. "Download CV (PDF)"). */
  readonly primaryActions?: Readonly<Partial<Record<ContentSelection, ContentResultAction>>>;
  /** Called by the step's exit button ("Keep exploring"). */
  readonly onExit: () => void;
}

const ContentResultsContext = createContext<ContentResults | null>(null);

export function ContentResultsProvider({
  value,
  children,
}: {
  value: ContentResults;
  children: ReactNode;
}): JSX.Element {
  return <ContentResultsContext.Provider value={value}>{children}</ContentResultsContext.Provider>;
}

/** Null when the host provides no content (the step then shows only its text). */
export function useContentResults(): ContentResults | null {
  return useContext(ContentResultsContext);
}
