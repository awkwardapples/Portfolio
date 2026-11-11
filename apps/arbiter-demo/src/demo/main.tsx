/**
 * The demo's entry (Pass 11, E.3; ADR-0050): Arbiter's own console, its own
 * routes and providers, on a memory router, under a banner that says what
 * the demo is. Zod's eval probe is switched off and the API stand-in is
 * installed before anything else loads.
 */
import './jitless';
import './api-shim';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createMemoryRouter, RouterProvider } from 'react-router';

import '../design/fonts';
import '../design/tokens.css';
import '@xyflow/react/dist/base.css';
import './demo.css';

import { Providers } from '../app/providers';
import { routes } from '../app/router';
import { reportNavigation } from './navigation';

const router = createMemoryRouter(routes, { initialEntries: ['/'] });
router.subscribe((state) => {
  // A memory router keeps the scroll position; a browser resets it on navigation.
  window.scrollTo(0, 0);
  reportNavigation(window, state.location.pathname);
});
reportNavigation(window, '/');

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <p className="demo-banner">
        Demo: assessments replay recorded runs of Arbiter&apos;s engine in sample mode. Nothing you
        enter leaves this page.
      </p>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </StrictMode>,
  );
}
