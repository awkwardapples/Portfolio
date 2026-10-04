/**
 * Document cards (spec H.7, N.11, N.13):
 *
 * - "Read here", on wider screens only, opens the browser's own PDF viewer
 *   in an inline frame below the card, created on click so nothing loads
 *   before it is asked for. The same button closes it and keeps focus.
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
  button.addEventListener('click', () => {
    if (viewer) {
      viewer.remove();
      viewer = undefined;
      card.classList.remove('col-span-full');
      button.textContent = 'Read here';
      button.setAttribute('aria-expanded', 'false');
      return;
    }
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
    frame.focus();
  });
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

for (const control of document.querySelectorAll<HTMLElement>('[data-copy-control]')) {
  control.hidden = false;
  control
    .querySelector<HTMLButtonElement>('[data-copy]')
    ?.addEventListener('click', (event) => void copy(event.currentTarget as HTMLButtonElement));
}

// A module, so its top-level names stay its own.
export {};
