import { Monitor, Smartphone, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactElement } from 'react';

import { Tooltip } from '@/components/primitives/Tooltip';

import { buttonClass } from '~/design/button';
import { addressFor, frameScale, readNavigateMessage } from '~/lib/site-frame';

interface Still {
  src: string;
  width: number;
  height: number;
}

export interface SiteFrameProps {
  /** The demo's address on this site, e.g. /demo/scb-handyman/. */
  demoUrl: string;
  /** The client's own domain, shown in the address bar. */
  domain: string;
  /** What the frame holds, for the iframe title and the button's description. */
  siteName: string;
  desktopStill: Still;
  mobileStill: Still;
}

const DESKTOP_WIDTH = 1280;
const MOBILE_WIDTH = 390;
/** The frame's height as a share of its width on wider screens: 16:10. */
const FRAME_RATIO = 0.625;

type Viewport = 'desktop' | 'mobile';

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
function DemoSkeleton(): ReactElement {
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

/**
 * The client site inside the portfolio (spec J.4, N.4; ADR-0044).
 *
 * Facade first: a still of the SCB homepage and "Try the live site". Nothing
 * of the demo loads before that click. On wider screens the demo then runs
 * in the frame at a true 1280 px (or 390 px) viewport, scaled to fit, with a
 * skeleton until it loads and the address bar following the demo's pages.
 * On phones the frame is a phone outline, and the button opens the demo
 * full screen in a dialog so it scrolls natively. "Open in a new tab" is
 * always there.
 */
export function SiteFrame({
  demoUrl,
  domain,
  siteName,
  desktopStill,
  mobileStill,
}: SiteFrameProps): ReactElement {
  const [live, setLive] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [path, setPath] = useState('/');
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [boxWidth, setBoxWidth] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const dialogFrameRef = useRef<HTMLIFrameElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const phoneTriggerRef = useRef<HTMLAnchorElement>(null);

  // The address bar follows the demo (validated: this origin, our frame only).
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      for (const frame of [frameRef.current, dialogFrameRef.current]) {
        const next = readNavigateMessage(event, {
          origin: window.location.origin,
          source: frame?.contentWindow ?? null,
        });
        if (next !== null) setPath(next);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const observer = new ResizeObserver(([entry]) => setBoxWidth(entry?.contentRect.width ?? 0));
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  const viewportWidth = viewport === 'desktop' ? DESKTOP_WIDTH : MOBILE_WIDTH;
  const scale = frameScale(boxWidth, viewportWidth);
  const boxHeight = Math.round(boxWidth * FRAME_RATIO);

  const openPhoneDialog = () => {
    setLoaded(false);
    setPhoneOpen(true);
    dialogRef.current?.showModal();
    document.documentElement.classList.add('scroll-locked');
  };
  const closePhoneDialog = () => dialogRef.current?.close();

  const tryLabel = (
    <>
      Try the live site
      <span className="sr-only">: loads an interactive demo of the {siteName} site</span>
    </>
  );

  return (
    <div className="site-frame">
      {/* Wider screens: a browser window. */}
      <div className="hidden overflow-hidden rounded-media border border-rule bg-paper md:block">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <AddressBar address={addressFor(domain, live ? path : '/')} />
          </div>
        </div>
        <div
          ref={boxRef}
          className="relative overflow-hidden bg-paper-sunken"
          style={{ height: boxHeight || undefined }}
        >
          {live ? (
            <>
              {!loaded && <DemoSkeleton />}
              <iframe
                ref={frameRef}
                src={demoUrl}
                title={`${siteName} site (demo)`}
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
              alt={`The ${siteName} homepage`}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover object-top"
            />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-rule px-4 py-3">
          {live ? (
            <div role="group" aria-label="Viewport" className="flex gap-2">
              {(
                [
                  ['desktop', 'Desktop view, 1280 pixels wide', Monitor],
                  ['mobile', 'Mobile view, 390 pixels wide', Smartphone],
                ] as const
              ).map(([value, label, Icon]) => (
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
              {tryLabel}
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
        <div className="phone-outline mx-auto w-3/4 max-w-xs">
          <img
            src={mobileStill.src}
            width={mobileStill.width}
            height={mobileStill.height}
            alt={`The ${siteName} homepage on a phone`}
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
            {tryLabel}
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
        <dialog
          ref={dialogRef}
          aria-label={`${siteName} site (demo)`}
          className="site-frame-dialog"
          onClose={() => {
            setPhoneOpen(false);
            document.documentElement.classList.remove('scroll-locked');
            phoneTriggerRef.current?.focus();
          }}
        >
          <div className="flex items-center justify-between gap-3 border-b border-rule bg-paper px-3 py-2">
            <span className="min-w-0 truncate text-xs text-graphite">
              {addressFor(domain, path)}
            </span>
            <button
              type="button"
              aria-label="Close the demo"
              onClick={closePhoneDialog}
              className="icon-button"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
          <div className="relative flex-1">
            {phoneOpen && (
              <>
                {!loaded && <DemoSkeleton />}
                <iframe
                  ref={dialogFrameRef}
                  src={demoUrl}
                  title={`${siteName} site (demo)`}
                  onLoad={() => setLoaded(true)}
                  className="absolute inset-0 h-full w-full border-0 bg-paper"
                />
              </>
            )}
          </div>
        </dialog>
      </div>
    </div>
  );
}
