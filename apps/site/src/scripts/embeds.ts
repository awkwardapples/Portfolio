/**
 * Third-party facades (spec N.7, P.2): the YouTube or Spotify player is
 * created only when the visitor presses Play, replaces the poster panel, and
 * takes focus. Until then the button is an ordinary link to the video or
 * track on the provider's own site.
 */
document.addEventListener('click', (event) => {
  const play = (event.target as Element).closest<HTMLAnchorElement>('[data-embed-play]');
  const panel = play?.closest<HTMLElement>('[data-embed]');
  if (!play || !panel?.dataset.embed) return;
  event.preventDefault();

  const frame = document.createElement('iframe');
  frame.src = panel.dataset.embed;
  frame.title = panel.dataset.embedTitle ?? 'Embedded player';
  frame.allow = panel.dataset.embedAllow ?? '';
  frame.allowFullscreen = true;
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  // Video fills its 16:9 panel; Spotify's player has a fixed height.
  frame.className = 'w-full rounded-media';
  if (panel.dataset.embedHeight) frame.style.height = `${panel.dataset.embedHeight}px`;
  else frame.classList.add('h-full');

  panel.replaceChildren(frame);
  panel.classList.remove('p-6', 'justify-end', 'gap-4');
  frame.focus();
});

// A module, so its top-level names stay its own.
export {};
