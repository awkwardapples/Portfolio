import { Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState, type ReactElement } from 'react';

import { Tooltip } from '@/components/primitives/Tooltip';

import { chooseSources, mayAutoplay, type Source } from '~/lib/footage';

export interface FootageLoopProps {
  /** The loop set's folder name under /media/video/. */
  name: string;
  /** What the footage shows, for the controls' labels. */
  title: string;
  /** Whether `pnpm media:video --portrait` made a vertical crop. */
  hasPortrait?: boolean;
  /** The loop opens the page (on /music): its poster loads at once, not lazily. */
  priority?: boolean;
  /**
   * The loop is the background of its section (the homepage's music section and
   * the /music title): it fills the nearest positioned ancestor under a flat
   * scrim, so text can sit on it, instead of keeping its own 16:9 box.
   */
  fill?: boolean;
  class?: string;
}

interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: string;
}

/**
 * Josh's footage as a quiet loop (spec K.3, N.6; ADR-0046). The poster is a
 * picture at a fixed 16:9, so nothing shifts: AVIF at the screen's width,
 * JPEG otherwise, and lazy unless the loop opens the page (a video's own
 * poster attribute would download at once, wherever the loop sits). The video
 * stays invisible until it plays. Video files are attached only
 * when the loop comes within a screen of view, chosen for the screen (AV1,
 * then H.264). It plays while at least half visible and pauses otherwise;
 * it never starts by itself with reduced motion, Save-Data or a slow
 * connection, where the button reads "Play". The pause and play button is
 * always there. The video itself is decorative and hidden from assistive
 * technology; the button is not. As a background (`fill`), it plays while a
 * third of the section is visible, since the section can be taller than the
 * screen.
 */
export function FootageLoop({
  name,
  title,
  hasPortrait = false,
  priority = false,
  fill = false,
  class: className,
}: FootageLoopProps): ReactElement {
  const base = `/media/video/${name}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [auto, setAuto] = useState(false);
  const [playing, setPlaying] = useState(false);
  // The poster picture shows until the first frame plays.
  const [started, setStarted] = useState(false);
  // Once the visitor pauses, scrolling never restarts it.
  const userPaused = useRef(false);

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    setAuto(
      mayAutoplay({
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        saveData: connection?.saveData,
        effectiveType: connection?.effectiveType,
      }),
    );
  }, []);

  // Attach the files when the loop is within one screen of view.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setSources(
          chooseSources(
            base,
            {
              width: window.innerWidth,
              pixelRatio: window.devicePixelRatio || 1,
              portrait: window.matchMedia('(orientation: portrait)').matches,
            },
            hasPortrait,
          ),
        );
        near.disconnect();
      },
      { rootMargin: '100% 0px' },
    );
    near.observe(root);
    return () => near.disconnect();
  }, [base, hasPortrait]);

  // Play while at least half visible, if it may; pause otherwise.
  useEffect(() => {
    const root = rootRef.current;
    const video = videoRef.current;
    if (!root || !video || sources.length === 0) return;
    video.load();
    const visible = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && auto && !userPaused.current)
          void video.play().catch(() => undefined);
        else video.pause();
      },
      { threshold: fill ? 0.3 : 0.5 },
    );
    visible.observe(root);
    return () => visible.disconnect();
  }, [sources, auto, fill]);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      userPaused.current = false;
      if (sources.length === 0) {
        setSources(
          chooseSources(
            base,
            { width: window.innerWidth, pixelRatio: window.devicePixelRatio || 1, portrait: false },
            hasPortrait,
          ),
        );
        setAuto(true);
        return;
      }
      void video.play().catch(() => undefined);
    } else {
      userPaused.current = true;
      video.pause();
    }
  };

  const label = playing ? `Pause the footage: ${title}` : `Play the footage: ${title}`;

  return (
    <div
      ref={rootRef}
      className={`${fill ? 'absolute inset-0' : 'relative aspect-video w-full'} overflow-hidden bg-stage ${className ?? ''}`}
    >
      <picture>
        <source
          type="image/avif"
          srcSet={`${base}/poster-800.avif 800w, ${base}/poster-1280.avif 1280w, ${base}/poster.avif 1920w`}
          sizes="100vw"
        />
        <img
          src={`${base}/poster.jpg`}
          alt=""
          width={1920}
          height={1080}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </picture>
      <video
        ref={videoRef}
        muted
        playsInline
        loop
        preload="none"
        disablePictureInPicture
        aria-hidden="true"
        onPlay={() => setPlaying(true)}
        onPlaying={() => setStarted(true)}
        onPause={() => setPlaying(false)}
        className={`absolute inset-0 h-full w-full object-cover ${started ? '' : 'opacity-0'}`}
      >
        {sources.map((source) => (
          <source key={source.src} src={source.src} type={source.type} />
        ))}
      </video>
      {fill && <div aria-hidden="true" className="footage-scrim absolute inset-0" />}
      <div className="absolute bottom-4 right-4 z-10" data-surface="stage">
        <Tooltip label={label}>
          <button
            type="button"
            aria-label={label}
            onClick={toggle}
            className="icon-button bg-stage"
          >
            {playing ? (
              <Pause aria-hidden="true" className="h-5 w-5" />
            ) : (
              <Play aria-hidden="true" className="h-5 w-5" />
            )}
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
