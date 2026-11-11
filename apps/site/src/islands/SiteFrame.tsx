import { Monitor, Smartphone, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactElement } from 'react';

import { Tooltip } from '@/components/primitives/Tooltip';

import { buttonClass } from '~/design/button';
import { addressFor, frameScale, phoneFrame, readNavigateMessage } from '~/lib/site-frame';

interface Still {
  src: string;
  width: number;
  height: number;
  alt: string;
}

type Viewport = 'desktop' | 'mobile';

export interface SiteFrameProps {
  /** The demo's address on this site, e.g. /demo/scb-handyman. */
  demoUrl: string;
  /** Where the real thing lives, shown in the address bar. */
  domain: string;
  /** The address bar's path before the demo reports one: "/" or "/console/". */
  initialPath?: string;
  /** What the frame holds, for "Open in a new tab". */
  siteName: string;
  /** The iframe's and the phone dialog's accessible name. */
  frameTitle: string;
  tryLabel: string;
  /** What the button loads, for screen readers. */
  tryDescription: string;
  /** The type of the messages the demo sends as it navigates. */
  messageType: string;
  skeleton?: 'scb' | 'arbiter';
  viewports?: readonly Viewport[];
  /** On phones narrower than this, the dialog runs the demo at this width, scaled to fit. */
  phoneViewportWidth?: number | undefined;
  desktopStill: Still;
  mobileStill: Still & { orientation: 'portrait' | 'landscape' };
}

const DESKTOP_WIDTH = 1280;
const MOBILE_WIDTH = 390;
/** The frame's height as a share of its width on wider screens: 16:10. */
const FRAME_RATIO = 0.625;

function AddressBar({ address }: { address: string }): ReactElement {
  return (
    <div className="flex items-center gap-3 border-b border-rule bg-paper-sunken px-4 py-2">
      <span aria-hidden="true" className="flex gap-2">
        <span className="h-3 w-3 rounded-full bg-rule" />
        <span className="h-3 w-3 rounded-full bg-rule" />
        <span className="h-3 w-3 rounded-full bg-rule" />
      </span>
      <span className="min-w-0 flex-1 truncate rounded bg-paper px-3 py-1 text-xs text-graphite">
        <span className="sr-only">Address: </span>
        {address}
      </span>
    </div>
  );
}

/** The SCB homepage's layout while the demo loads (spec P.4): dark header, hero, two buttons. */
function ScbSkeleton(): ReactElement {
  return (
    <div aria-hidden="true" className="absolute inset-0 flex flex-col bg-paper-sunken">
      <div className="h-10 animate-goqw-pulse bg-line-strong" />
      <div className="flex flex-1 flex-col justify-center gap-4 px-16">
        <div className="h-6 w-3/4 animate-goqw-pulse rounded bg-rule" />
        <div className="h-6 w-2/3 animate-goqw-pulse rounded bg-rule" />
        <div className="h-6 w-1/2 animate-goqw-pulse rounded bg-rule" />
        <div className="mt-4 flex gap-3">
          <div className="h-8 w-40 animate-goqw-pulse rounded bg-rule" />
          <div className="h-8 w-28 animate-goqw-pulse rounded bg-rule" />
        </div>
      </div>
    </div>
  );
}

/** Arbiter's console while it loads: a 200 px rail, a header bar, a tab row and five rows. */
function ArbiterSkeleton(): ReactElement {
  return (
    <div aria-hidden="true" className="absolute inset-0 flex bg-paper-sunken">
      <div className="flex flex-col gap-3 border-r border-rule p-4" style={{ width: 200 }}>
        <div className="h-10 animate-goqw-pulse rounded bg-line-strong" />
        {[0, 1, 2, 3, 4, 5, 6].map((row) => (
          <div key={row} className="h-6 animate-goqw-pulse rounded bg-rule" />
        ))}
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex h-16 items-center border-b border-rule px-6">
          <div className="h-6 w-1/3 animate-goqw-pulse rounded bg-rule" />
        </div>
        <div className="flex gap-4 px-6 py-4">
          <div className="h-6 w-28 animate-goqw-pulse rounded bg-rule" />
          <div className="h-6 w-24 animate-goqw-pulse rounded bg-rule" />
        </div>
        <div className="mx-6 flex flex-col gap-3">
          {[0, 1, 2, 3, 4].map((row) => (
            <div key={row} className="h-12 animate-goqw-pulse rounded bg-rule" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * A demo inside the portfolio, in a browser frame (spec J.4, N.4;
 * ADR-0044, ADR-0050): the SCB site, or Arbiter's console.
 *
 * Facade first: a still and "Try the live site" (or "Try the live demo").
 * Nothing of the demo loads before that click. On wider screens the demo
 * then runs in the frame at a true 1280 px viewport (or 390 px, where the
 * demo offers both), scaled to fit, with a skeleton until it loads and the
 * address bar following the demo's pages. On phones the frame is a phone
 * outline, and the button opens the demo full screen in a dialog. A demo
 * that needs a wider viewport than a phone has (Arbiter's 844 px) runs at
 * that width, scaled, with a hint to turn the phone sideways while it is
 * upright. "Open in a new tab" is always there.
 */
export function SiteFrame({
  demoUrl,
  domain,
  initialPath = '/',
  siteName,
  frameTitle,
  tryLabel,
  tryDescription,
  messageType,
  skeleton = 'scb',
  viewports = ['desktop', 'mobile'],
  phoneViewportWidth,
  desktopStill,
  mobileStill,
}: SiteFrameProps): ReactElement {
  const [live, setLive] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [viewport, setViewport] = useState<Viewport>(viewports[0] ?? 'desktop');
  const [path, setPath] = useState(initialPath);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [boxWidth, setBoxWidth] = useState(0);
  const [phoneBox, setPhoneBox] = useState({ width: 0, height: 0 });
  const [upright, setUpright] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const phoneBoxRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const dialogFrameRef = useRef<HTMLIFrameElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const phoneTriggerRef = useRef<HTMLAnchorElement>(null);

  // The address bar follows the demo (validated: this origin, our frame, this demo's messages).
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      for (const frame of [frameRef.current, dialogFrameRef.current]) {
        const next = readNavigateMessage(
          event,
          { origin: window.location.origin, source: frame?.contentWindow ?? null },
          messageType,
        );
        if (next !== null) setPath(next);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [messageType]);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const observer = new ResizeObserver(([entry]) => setBoxWidth(entry?.contentRect.width ?? 0));
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  // The phone dialog's box, for a demo that needs a wider viewport than the phone.
  useEffect(() => {
    const box = phoneBoxRef.current;
    if (!box || !phoneOpen) return;
    const observer = new ResizeObserver(([entry]) =>
      setPhoneBox({ width: entry?.contentRect.width ?? 0, height: entry?.contentRect.height ?? 0 }),
    );
    observer.observe(box);
    return () => observer.disconnect();
  }, [phoneOpen]);

  useEffect(() => {
    if (!phoneViewportWidth) return;
    const query = window.matchMedia('(orientation: portrait)');
    const update = () => setUpright(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [phoneViewportWidth]);

  const viewportWidth = viewport === 'desktop' ? DESKTOP_WIDTH : MOBILE_WIDTH;
  const scale = frameScale(boxWidth, viewportWidth);
  const boxHeight = Math.round(boxWidth * FRAME_RATIO);
  const phone = phoneFrame(phoneBox, phoneViewportWidth);

  const openPhoneDialog = () => {
    setLoaded(false);
    setPhoneOpen(true);
    dialogRef.current?.showModal();
    document.documentElement.classList.add('scroll-locked');
  };
  const closePhoneDialog = () => dialogRef.current?.close();

  const tryContent = (
    <>
      {tryLabel}
      <span className="sr-only">: {tryDescription}</span>
    </>
  );
  const Skeleton = skeleton === 'arbiter' ? ArbiterSkeleton : ScbSkeleton;
  const landscape = mobileStill.orientation === 'landscape';

  return (
    <div className="site-frame">
      {/* Wider screens: a browser window. */}
      <div className="hidden overflow-hidden rounded-media border border-rule bg-paper md:block">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <AddressBar address={addressFor(domain, live ? path : initialPath)} />
          </div>
        </div>
        <div
          ref={boxRef}
          className="relative overflow-hidden bg-paper-sunken"
          style={{ height: boxHeight || undefined }}
        >
          {live ? (
            <>
              {!loaded && <Skeleton />}
              <iframe
                ref={frameRef}
                src={demoUrl}
                title={frameTitle}
                onLoad={() => setLoaded(true)}
                className="absolute left-1/2 top-0 origin-top border-0 bg-paper"
                style={{
                  width: viewportWidth,
                  height: boxHeight / scale || '100%',
                  transform: `translateX(-50%) scale(${scale})`,
                }}
              />
            </>
          ) : (
            <img
              src={desktopStill.src}
              width={desktopStill.width}
              height={desktopStill.height}
              alt={desktopStill.alt}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover object-top"
            />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-rule px-4 py-3">
          {live ? (
            viewports.length > 1 && (
              <div role="group" aria-label="Viewport" className="flex gap-2">
                {(
                  [
                    ['desktop', 'Desktop view, 1280 pixels wide', Monitor],
                    ['mobile', 'Mobile view, 390 pixels wide', Smartphone],
                  ] as const
                )
                  .filter(([value]) => viewports.includes(value))
                  .map(([value, label, Icon]) => (
                    <Tooltip key={value} label={label}>
                      <button
                        type="button"
                        aria-label={label}
                        aria-pressed={viewport === value}
                        onClick={() => setViewport(value)}
                        className={`icon-button ${viewport === value ? 'bg-paper-sunken' : ''}`}
                      >
                        <Icon aria-hidden="true" className="h-5 w-5" />
                      </button>
                    </Tooltip>
                  ))}
              </div>
            )
          ) : (
            // A link to the demo until JavaScript takes over, so it works without it.
            <a
              href={demoUrl}
              onClick={(event) => {
                event.preventDefault();
                setLive(true);
              }}
              className={buttonClass()}
            >
              {tryContent}
            </a>
          )}
          <a
            href={demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass({ variant: 'quiet' })}
          >
            Open in a new tab<span className="sr-only">: the {siteName} demo</span>
          </a>
        </div>
      </div>

      {/* Phones: a phone outline with the still; the demo opens full screen. */}
      <div className="md:hidden">
        <div
          className={`phone-outline mx-auto ${landscape ? 'w-full max-w-md' : 'w-3/4 max-w-xs'}`}
        >
          <img
            src={mobileStill.src}
            width={mobileStill.width}
            height={mobileStill.height}
            alt={mobileStill.alt}
            loading="lazy"
            decoding="async"
            className="block h-auto w-full"
          />
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
          <a
            ref={phoneTriggerRef}
            href={demoUrl}
            onClick={(event) => {
              event.preventDefault();
              openPhoneDialog();
            }}
            className={buttonClass()}
          >
            {tryContent}
          </a>
          <a
            href={demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass({ variant: 'quiet' })}
          >
            Open in a new tab<span className="sr-only">: the {siteName} demo</span>
          </a>
        </div>
      </div>

      {/* Outside the phone block, so an open demo stays open when the phone is turned sideways. */}
      <dialog
        ref={dialogRef}
        aria-label={frameTitle}
        className="site-frame-dialog"
        onClose={() => {
          setPhoneOpen(false);
          document.documentElement.classList.remove('scroll-locked');
          phoneTriggerRef.current?.focus();
        }}
      >
        <div className="flex items-center justify-between gap-3 border-b border-rule bg-paper px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-xs text-graphite">{addressFor(domain, path)}</p>
            {phoneViewportWidth && upright && phone.scale < 1 && (
              <p className="text-xs" data-sideways-hint>
                Best with your phone turned sideways.
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Close the demo"
            onClick={closePhoneDialog}
            className="icon-button"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <div ref={phoneBoxRef} className="relative flex-1 overflow-hidden">
          {phoneOpen && (
            <>
              {!loaded && <Skeleton />}
              <iframe
                ref={dialogFrameRef}
                src={demoUrl}
                title={frameTitle}
                onLoad={() => setLoaded(true)}
                className={
                  phone.scale < 1
                    ? 'absolute left-0 top-0 origin-top-left border-0 bg-paper'
                    : 'absolute inset-0 h-full w-full border-0 bg-paper'
                }
                style={
                  phone.scale < 1
                    ? {
                        width: phone.width,
                        height: phone.height,
                        transform: `scale(${phone.scale})`,
                      }
                    : undefined
                }
              />
            </>
          )}
        </div>
      </dialog>
    </div>
  );
}
