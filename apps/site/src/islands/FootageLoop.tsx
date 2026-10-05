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
  class?: string;
}

interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: string;
}

/**
 * Josh's footage as a quiet loop (spec K.3, N.6; ADR-0046). The poster shows
 * at once, at a fixed 16:9, so nothing shifts. Video files are attached only
 * when the loop comes within a screen of view, chosen for the screen (AV1,
 * then H.264). It plays while at least half visible and pauses otherwise;
 * it never starts by itself with reduced motion, Save-Data or a slow
 * connection, where the button reads "Play". The pause and play button is
 * always there. The video itself is decorative and hidden from assistive
 * technology; the button is not.
 */
export function FootageLoop({
  name,
  title,
  hasPortrait = false,
  class: className,
}: FootageLoopProps): ReactElement {
  const base = `/media/video/${name}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [auto, setAuto] = useState(false);
  const [playing, setPlaying] = useState(false);
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
      { threshold: 0.5 },
    );
    visible.observe(root);
    return () => visible.disconnect();
  }, [sources, auto]);

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
      className={`relative aspect-video w-full overflow-hidden bg-stage ${className ?? ''}`}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        loop
        preload="none"
        disablePictureInPicture
        aria-hidden="true"
        poster={`${base}/poster.jpg`}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="absolute inset-0 h-full w-full object-cover"
      >
        {sources.map((source) => (
          <source key={source.src} src={source.src} type={source.type} />
        ))}
      </video>
      <div className="absolute bottom-4 right-4" data-surface="stage">
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
