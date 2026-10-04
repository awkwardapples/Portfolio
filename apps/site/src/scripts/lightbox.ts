/**
 * The photo lightbox (spec N.15): a native modal <dialog> with the full
 * image and its caption. The dialog provides focus containment and Escape;
 * the arrow keys and the Previous and Next buttons move through the other
 * zoomable images on the page, and focus returns to the image that opened
 * it. The full image loads only when the lightbox opens.
 */
const triggers = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[data-lightbox]'));

function build(): {
  dialog: HTMLDialogElement;
  show: (index: number) => void;
} {
  const dialog = document.createElement('dialog');
  dialog.className = 'lightbox';
  dialog.setAttribute('aria-label', 'Image');
  dialog.innerHTML = `
    <figure class="lightbox-figure">
      <img alt="" />
      <figcaption></figcaption>
    </figure>
    <div class="lightbox-controls">
      <button type="button" data-step="-1">Previous</button>
      <button type="button" data-step="1">Next</button>
      <button type="button" data-close>Close</button>
    </div>`;
  document.body.append(dialog);

  const image = dialog.querySelector('img') as HTMLImageElement;
  const caption = dialog.querySelector('figcaption') as HTMLElement;
  const stepButtons = dialog.querySelectorAll<HTMLButtonElement>('[data-step]');
  let current = 0;

  const show = (index: number) => {
    current = (index + triggers.length) % triggers.length;
    const trigger = triggers[current];
    if (!trigger) return;
    image.src = trigger.href;
    image.alt = trigger.dataset.alt ?? '';
    caption.textContent = trigger.dataset.caption ?? '';
    caption.hidden = !trigger.dataset.caption;
    for (const button of stepButtons) button.hidden = triggers.length < 2;
  };

  for (const button of stepButtons) {
    button.addEventListener('click', () => show(current + Number(button.dataset.step)));
  }
  dialog.querySelector('[data-close]')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') show(current - 1);
    if (event.key === 'ArrowRight') show(current + 1);
  });
  // A click on the backdrop (the dialog itself, outside its content) closes it.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('scroll-locked');
    triggers[current]?.focus();
  });
  return { dialog, show };
}

let lightbox: ReturnType<typeof build> | undefined;

triggers.forEach((trigger, index) => {
  trigger.addEventListener('click', (event) => {
    event.preventDefault();
    lightbox ??= build();
    lightbox.show(index);
    lightbox.dialog.showModal();
    document.documentElement.classList.add('scroll-locked');
  });
});

// A module, so its top-level names stay its own.
export {};
