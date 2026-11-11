/**
 * Document cards (spec H.7, N.11, N.13):
 *
 * - "Read here", on wider screens only, opens the browser's own PDF viewer
 *   in an inline frame below the card, created on click so nothing loads
 *   before it is asked for. The same button closes it and keeps focus.
 * - A link to a card's id (the CV's short links land on "#read", Pass 11
 *   D.2) scrolls to it, on load and on hashchange; on wider screens it also
 *   opens the reader, keeping focus on the card's heading rather than moving
 *   it into the PDF. Phones only scroll: Open and Download are right there.
 * - Copy buttons for citations: the label changes to "Copied" at once, a
 *   polite live region announces it, and it reverts after two seconds. If
 *   the clipboard is unavailable, the text is selected instead.
 */

const liveRegion = document.createElement('span');
liveRegion.setAttribute('role', 'status');
liveRegion.className = 'sr-only';
document.body.append(liveRegion);

function announce(message: string): void {
  liveRegion.textContent = '';
  window.setTimeout(() => (liveRegion.textContent = message), 50);
}

/** Opens each card's reader without moving focus, by the card's id. */
const openers = new Map<string, () => boolean>();

function initReader(card: HTMLElement, index: number): void {
  const url = card.dataset.document;
  const title = card.dataset.documentTitle ?? 'Document';
  const actions = card.querySelector<HTMLElement>('[data-document-actions]');
  const quiet = actions?.querySelector('a')?.className;
  if (!url || !actions || !quiet) return;

  const viewerId = `document-viewer-${index}`;
  const item = document.createElement('li');
  // Phones handle inline PDFs poorly, so they get Open and Download only (spec H.7).
  item.className = 'max-md:hidden';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = quiet;
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', viewerId);
  button.textContent = 'Read here';
  item.append(button);
  actions.prepend(item);

  let viewer: HTMLElement | undefined;
  const open = (focusFrame: boolean) => {
    if (viewer) return;
    viewer = document.createElement('div');
    viewer.id = viewerId;
    viewer.className = 'document-viewer col-span-full';
    const frame = document.createElement('iframe');
    frame.src = url;
    frame.title = `${title} (PDF)`;
    viewer.append(frame);
    card.classList.add('col-span-full');
    card.append(viewer);
    button.textContent = 'Close the document';
    button.setAttribute('aria-expanded', 'true');
    if (focusFrame) frame.focus();
  };
  if (card.id) {
    // "Read here" shows from 768 px (max-md:hidden); below that, landing only scrolls.
    openers.set(card.id, () => {
      if (item.offsetParent === null) return false;
      open(false);
      return true;
    });
  }
  button.addEventListener('click', () => {
    if (viewer) {
      viewer.remove();
      viewer = undefined;
      card.classList.remove('col-span-full');
      button.textContent = 'Read here';
      button.setAttribute('aria-expanded', 'false');
      return;
    }
    open(true);
  });
}

/** Lands on the card the address names, if it names one. */
function land(): void {
  const id = decodeURIComponent(window.location.hash.slice(1));
  const card = id ? document.getElementById(id) : null;
  if (!card?.matches('[data-document]')) return;
  if (openers.get(id)?.()) {
    card.querySelector<HTMLElement>('[data-document-heading]')?.focus({ preventScroll: true });
  }
  card.scrollIntoView({ block: 'start' });
}

/** After the page's reveal transition (global.css), if one is running. */
function afterReveal(): Promise<void> {
  const transition = (document as Document & { activeViewTransition?: ViewTransition | null })
    .activeViewTransition;
  if (!transition) return Promise.resolve();
  return transition.finished.then(
    () => undefined,
    () => undefined,
  );
}

async function copy(button: HTMLButtonElement): Promise<void> {
  const source = button.closest('div')?.querySelector<HTMLElement>('[data-copy-source]');
  if (!source) return;
  const label = button.innerHTML;
  button.textContent = 'Copied';
  announce('Citation copied');
  try {
    await navigator.clipboard.writeText(source.textContent?.trim() ?? '');
  } catch {
    button.textContent = 'Press Ctrl+C to copy';
    window.getSelection()?.selectAllChildren(source);
    announce('Press Ctrl+C to copy');
  }
  window.setTimeout(() => (button.innerHTML = label), 2000);
}

document.querySelectorAll<HTMLElement>('[data-document]').forEach(initReader);
// After load: the browser's own scroll to the fragment on load takes focus back to the page.
const loaded =
  document.readyState === 'complete'
    ? Promise.resolve()
    : new Promise<void>((resolve) =>
        window.addEventListener('load', () => resolve(), { once: true }),
      );
void loaded.then(afterReveal).then(() => requestAnimationFrame(land));
window.addEventListener('hashchange', land);

for (const control of document.querySelectorAll<HTMLElement>('[data-copy-control]')) {
  control.hidden = false;
  control
    .querySelector<HTMLButtonElement>('[data-copy]')
    ?.addEventListener('click', (event) => void copy(event.currentTarget as HTMLButtonElement));
}

// A module, so its top-level names stay its own.
export {};
