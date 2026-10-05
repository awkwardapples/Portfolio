/**
 * The footage loop's decisions (spec K.3, N.6; ADR-0046), as pure functions
 * so they are unit-tested: whether a loop may start on its own, and which
 * encoded files to offer. The files are the set `pnpm media:video` writes to
 * public/media/video/<name>/.
 */

export interface PlaybackEnvironment {
  reducedMotion: boolean;
  /** navigator.connection.saveData */
  saveData?: boolean | undefined;
  /** navigator.connection.effectiveType: 'slow-2g', '2g', '3g' or '4g' */
  effectiveType?: string | undefined;
}

const SLOW_CONNECTIONS = new Set(['slow-2g', '2g', '3g']);

/**
 * A loop starts by itself only when nothing argues against it: never with
 * reduced motion, never with Save-Data, never on a slow connection. Those
 * visitors see the poster and a Play button.
 */
export function mayAutoplay(environment: PlaybackEnvironment): boolean {
  if (environment.reducedMotion || environment.saveData) return false;
  return !SLOW_CONNECTIONS.has(environment.effectiveType ?? '');
}

export interface Source {
  src: string;
  type: string;
}

const AV1 = 'video/mp4; codecs="av01.0.08M.08"';
const H264 = 'video/mp4; codecs="avc1.640028"';

/**
 * AV1 first, H.264 second; the portrait crop for phones held upright when
 * there is one; 1080p for screens that need it, 720p otherwise.
 */
export function chooseSources(
  base: string,
  screen: { width: number; pixelRatio: number; portrait: boolean },
  hasPortrait: boolean,
): Source[] {
  if (hasPortrait && screen.portrait && screen.width < 768) {
    return [
      { src: `${base}/portrait-720.av1.mp4`, type: AV1 },
      { src: `${base}/portrait-720.h264.mp4`, type: H264 },
    ];
  }
  const size = screen.width * screen.pixelRatio > 1280 ? 1080 : 720;
  return [
    { src: `${base}/${size}.av1.mp4`, type: AV1 },
    { src: `${base}/${size}.h264.mp4`, type: H264 },
  ];
}
