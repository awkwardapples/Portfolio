/**
 * Navigation behaviour (spec F.2, N.2; ADR-0045), without a framework so no
 * page loads React just for its header.
 *
 * Ported from the wizard's SCB site: the condensing bar from
 * useHeaderScrollState (with a second threshold, so it cannot flicker), and the drawer behaviour
 * from MobileMenu and useFocusTrap (dialog semantics, focus kept inside,
 * Escape closes, focus returns to the trigger, the page behind does not
 * scroll). The drawer is a native modal <dialog>, which provides the dialog
 * semantics, the focus containment and Escape itself.
 */

// The bar condenses past 32 px and grows again only within 8 px of the top.
// The gap is wider than the 16 px the bar loses, so the browser's scroll
// anchoring (which moves the page by that much as the bar changes) cannot
// bounce it between the two states. With one threshold it did, every frame.
const CONDENSE_AFTER_PX = 32;
const EXPAND_WITHIN_PX = 8;

function initCondensing(header: HTMLElement): void {
  const update = () => {
    const condensed = header.hasAttribute('data-condensed');
    if (!condensed && window.scrollY > CONDENSE_AFTER_PX)
      header.toggleAttribute('data-condensed', true);
    if (condensed && window.scrollY <= EXPAND_WITHIN_PX)
      header.toggleAttribute('data-condensed', false);
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
}

/**
 * Follow the surface beneath the bar: when a stage section passes under it,
 * the bar switches to fog on stage so it never disappears (spec N.2).
 */
function initSurfaceFollowing(header: HTMLElement): void {
  if (!('IntersectionObserver' in window)) return;
  const stages = Array.from(
    document.querySelectorAll<HTMLElement>(
      'main [data-surface="stage"], footer[data-surface="stage"]',
    ),
  );
  if (stages.length === 0) return;

  const underBar = new Set<Element>();
  let observer: IntersectionObserver | undefined;

  const observe = () => {
    observer?.disconnect();
    underBar.clear();
    // Only the band the bar covers counts: the top `header height` pixels.
    const below = Math.max(0, window.innerHeight - header.offsetHeight);
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) underBar.add(entry.target);
          else underBar.delete(entry.target);
        }
        header.dataset.under = underBar.size > 0 ? 'stage' : 'paper';
      },
      { rootMargin: `0px 0px -${below}px 0px` },
    );
    for (const stage of stages) observer.observe(stage);
  };

  observe();
  let timer: number | undefined;
  window.addEventListener('resize', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(observe, 150);
  });
}

function initMenu(): void {
  const dialog = document.getElementById('site-menu');
  const trigger = document.querySelector<HTMLAnchorElement>('[data-menu-trigger]');
  if (
    !(dialog instanceof HTMLDialogElement) ||
    !trigger ||
    typeof dialog.showModal !== 'function'
  ) {
    return; // The trigger stays a link to the footer navigation.
  }

  trigger.setAttribute('role', 'button');
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-controls', dialog.id);
  trigger.setAttribute('aria-expanded', 'false');

  const open = () => {
    dialog.showModal();
    document.documentElement.classList.add('scroll-locked');
    trigger.setAttribute('aria-expanded', 'true');
  };
  const close = () => dialog.close();

  trigger.addEventListener('click', (event) => {
    event.preventDefault();
    open();
  });
  // A link acting as a button also opens with Space.
  trigger.addEventListener('keydown', (event) => {
    if (event.key === ' ') {
      event.preventDefault();
      open();
    }
  });

  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('scroll-locked');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.focus();
  });

  dialog.querySelector('[data-menu-close]')?.addEventListener('click', close);
  // A click on the backdrop lands on the dialog element itself.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });
  for (const link of dialog.querySelectorAll('a')) link.addEventListener('click', close);

  // The drawer only exists below the tablet breakpoint.
  window.matchMedia('(min-width: 768px)').addEventListener('change', (event) => {
    if (event.matches && dialog.open) close();
  });
}

/** Escape hides a tooltip without moving focus or the pointer (WCAG 1.4.13). */
function initTooltipDismissal(): void {
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    for (const element of document.querySelectorAll(
      '[data-tooltip]:hover, [data-tooltip]:focus-visible',
    )) {
      element.setAttribute('data-tooltip-dismissed', '');
    }
  });
  const reset = (event: Event) => {
    const target = event.target;
    if (target instanceof Element && target.hasAttribute('data-tooltip-dismissed')) {
      target.removeAttribute('data-tooltip-dismissed');
    }
  };
  document.addEventListener('focusout', reset);
  document.addEventListener('mouseout', reset);
}

const header = document.querySelector<HTMLElement>('[data-site-header]');
if (header) {
  initCondensing(header);
  initSurfaceFollowing(header);
}
initMenu();
initTooltipDismissal();
