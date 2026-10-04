/**
 * Instant filtering over a pre-rendered list (spec H.6, N.14). The page
 * renders every item; this shows the filter control, applies the choice
 * from the URL on load, and on each click hides items whose
 * `data-filter-tags` do not include the choice, hides any group
 * (`data-filter-group`) left empty, updates `?param=` without reloading,
 * and announces the result.
 */
for (const control of document.querySelectorAll<HTMLElement>('[data-filter]')) {
  const param = control.dataset.filter ?? 'filter';
  const buttons = Array.from(control.querySelectorAll<HTMLButtonElement>('[data-filter-value]'));
  const status = control.querySelector<HTMLElement>('[data-filter-status]');
  const items = Array.from(document.querySelectorAll<HTMLElement>('[data-filter-item]'));
  const groups = Array.from(document.querySelectorAll<HTMLElement>('[data-filter-group]'));
  const known = new Set(buttons.map((button) => button.dataset.filterValue ?? ''));

  const apply = (value: string, announce: boolean) => {
    for (const button of buttons) {
      button.setAttribute('aria-pressed', String((button.dataset.filterValue ?? '') === value));
    }
    let shown = 0;
    for (const item of items) {
      const tags = (item.dataset.filterTags ?? '').split(' ');
      item.hidden = value !== '' && !tags.includes(value);
      if (!item.hidden) shown += 1;
    }
    for (const group of groups) {
      group.hidden = !group.querySelector('[data-filter-item]:not([hidden])');
    }
    if (announce && status) {
      const label = buttons.find((button) => button.dataset.filterValue === value)?.textContent;
      status.textContent = `Showing ${shown} ${shown === 1 ? 'item' : 'items'}${value ? `: ${label?.trim()}` : ''}`;
    }
  };

  const url = new URL(window.location.href);
  const initial = url.searchParams.get(param) ?? '';
  control.hidden = false;
  apply(known.has(initial) ? initial : '', false);

  for (const button of buttons) {
    button.addEventListener('click', () => {
      const value = button.dataset.filterValue ?? '';
      apply(value, true);
      const next = new URL(window.location.href);
      if (value) next.searchParams.set(param, value);
      else next.searchParams.delete(param);
      history.replaceState(history.state, '', next);
    });
  }
}

// A module, so its top-level names stay its own.
export {};
