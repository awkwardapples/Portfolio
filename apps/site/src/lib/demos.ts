/**
 * The demos the browser frame can hold (Pass 11, E.5; ADR-0044, ADR-0050),
 * one entry each. LiveDemo.astro reads an entry and SiteFrame renders it, so
 * the SCB site and Arbiter's console share one frame.
 *
 * Stills come from `pnpm media:screens`. Each demo reports its pages to the
 * frame with its own message type, so neither frame can be steered by the
 * other demo.
 */
import type { ImageMetadata } from 'astro';

import arbiterDesktop from '~/content/work/arbiter/screens/console-ruling-desktop.png';
import arbiterPhone from '~/content/work/arbiter/screens/console-assess-landscape.png';
import scbDesktop from '~/content/work/growtrades/screens/scb-home-desktop.png';
import scbPhone from '~/content/work/growtrades/screens/scb-home-mobile.png';

export type DemoKey = 'scb' | 'arbiter';

export interface Demo {
  /** Where the demo is served: Workers serves the folder without a trailing slash. */
  demoUrl: string;
  /** The Astro dev server serves only the folder's index.html by name. */
  devUrl: string;
  /** Where the real thing lives, shown in the address bar. */
  domain: string;
  /** The address bar's path before the demo reports one. */
  initialPath: string;
  siteName: string;
  /** The iframe's and the phone dialog's accessible name. */
  frameTitle: string;
  tryLabel: string;
  /** What the button loads, for screen readers. */
  tryDescription: string;
  messageType: string;
  skeleton: 'scb' | 'arbiter';
  viewports: readonly ('desktop' | 'mobile')[];
  /** On phones narrower than this, the dialog runs the demo at this width, scaled. */
  phoneViewportWidth?: number;
  stills: {
    desktop: { src: ImageMetadata; alt: string };
    phone: { src: ImageMetadata; alt: string; orientation: 'portrait' | 'landscape' };
  };
  caption: string;
}

export const DEMOS: Record<DemoKey, Demo> = {
  scb: {
    demoUrl: '/demo/scb-handyman',
    devUrl: '/demo/scb-handyman/index.html',
    domain: 'scbhandyman.co.uk',
    initialPath: '/',
    siteName: 'SCB Handyman',
    frameTitle: 'SCB Handyman site (demo)',
    tryLabel: 'Try the live site',
    tryDescription: 'loads an interactive demo of the SCB Handyman site',
    messageType: 'scb-demo:navigate',
    skeleton: 'scb',
    viewports: ['desktop', 'mobile'],
    stills: {
      desktop: { src: scbDesktop, alt: 'The SCB Handyman homepage' },
      phone: {
        src: scbPhone,
        alt: 'The SCB Handyman homepage on a phone',
        orientation: 'portrait',
      },
    },
    caption:
      'The SCB Handyman site, the first GrowTrades client, running here as a demo. Nothing you enter in it is sent anywhere.',
  },
  arbiter: {
    demoUrl: '/demo/arbiter',
    devUrl: '/demo/arbiter/index.html',
    // Where Arbiter's console really runs (`python run.py serve`).
    domain: 'localhost:8000',
    initialPath: '/console/',
    siteName: 'Arbiter console',
    frameTitle: 'Arbiter console (demo)',
    tryLabel: 'Try the live demo',
    tryDescription: "loads an interactive demo of Arbiter's analyst console",
    messageType: 'arbiter-demo:navigate',
    skeleton: 'arbiter',
    viewports: ['desktop'],
    phoneViewportWidth: 844,
    stills: {
      desktop: {
        src: arbiterDesktop,
        alt: "Arbiter's console after assessing Quillfeather Payroll Cloud Ltd: the agents' bench, and the ruling card reading Escalate, with the brief “Escalate to the TPRM lead: Quillfeather Payroll Cloud Ltd says EU, but its contract (CTR-30007) shows US.”",
      },
      phone: {
        src: arbiterPhone,
        alt: "Arbiter's Assess page on a phone turned sideways: the vendors, each with Start assessment.",
        orientation: 'landscape',
      },
    },
    caption:
      "Arbiter's analyst console, running here as a demo. Pick a vendor and press Start assessment to watch the agents reach a ruling. Assessments replay runs recorded from the real engine in sample mode, on synthetic data with no models connected; the recorded live runs used Zetaris and Nemotron on 24 and 25 October 2026.",
  },
};
