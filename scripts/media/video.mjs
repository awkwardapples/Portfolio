#!/usr/bin/env node
/**
 * pnpm media:video <source> --name <name> [--start 00:00:12] [--duration 10]
 *                  [--poster-at 2] [--lut file.cube] [--portrait] [--player]
 *
 * Encodes a silent footage loop for the site (spec K.3, N.6) with ffmpeg,
 * into apps/site/public/media/video/<name>/:
 *
 *   1080.av1.mp4  1080.h264.mp4  720.av1.mp4  720.h264.mp4
 *   portrait-720.av1.mp4  portrait-720.h264.mp4   (with --portrait)
 *   poster.avif  poster-1280.avif  poster-800.avif  poster.jpg  manifest.json
 *
 * No audio track, constant frame rate, `+faststart`. AV1 (SVT-AV1) is listed
 * first for browsers that decode it; H.264 is the fallback Safari needs.
 * --lut applies a .cube LUT, for footage shot in a log profile such as V-Log.
 * Loops are 5 to 15 seconds (8 to 15 where the footage allows); targets are
 * about 3 MB for 1080 AV1 and 6 MB for 1080 H.264. With --player the clip is
 * a recording shown with player controls (`type: video` without `loop`), and
 * may run to 120 seconds; it is still silent, so a recording with speech needs
 * captions first. Every file must stay under Cloudflare's 25 MiB limit.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

import sharp from 'sharp';

import { ROOT, ensureDir, fail, formatBytes, fromCwd, parseArgs, slugify } from './lib.mjs';

const LIMIT = 25 * 1024 * 1024;
const TARGETS = { '1080.av1.mp4': 3 * 1024 * 1024, '1080.h264.mp4': 6 * 1024 * 1024 };

const { positional, flags } = parseArgs(process.argv.slice(2), ['portrait', 'player']);
const [input] = positional;
if (!input || typeof flags.name !== 'string') {
  fail(
    'Usage: pnpm media:video <source> --name <name> [--start 00:00:12] [--duration 10] [--poster-at 2] [--lut file.cube] [--portrait] [--player]',
  );
}

const ffmpegCheck = spawnSync('ffmpeg', ['-hide_banner', '-encoders'], { encoding: 'utf8' });
if (ffmpegCheck.error || ffmpegCheck.status !== 0) {
  fail(
    'ffmpeg is not installed or not on PATH. On Windows: winget install Gyan.FFmpeg, then open a new terminal. On macOS: brew install ffmpeg.',
  );
}
for (const encoder of ['libsvtav1', 'libx264']) {
  if (!ffmpegCheck.stdout.includes(encoder)) {
    fail(
      `This ffmpeg build has no ${encoder} encoder. Install a full build (winget install Gyan.FFmpeg).`,
    );
  }
}

const source = fromCwd(input);
if (!existsSync(source)) fail(`No file at ${source}.`);
const name = slugify(flags.name);
const duration = Number(flags.duration ?? 10);
const player = Boolean(flags.player);
if (player && !(duration >= 5 && duration <= 120)) {
  fail('Recordings for the player are 5 to 120 seconds (--duration).');
}
if (!player && !(duration >= 5 && duration <= 15)) fail('Loops are 5 to 15 seconds (--duration).');
const start = typeof flags.start === 'string' ? flags.start : '0';
const posterAt = Number(flags['poster-at'] ?? 0);
const lut = typeof flags.lut === 'string' ? fromCwd(flags.lut) : null;
if (lut && !existsSync(lut)) fail(`No LUT at ${lut}.`);

const outDir = join(ROOT, 'apps', 'site', 'public', 'media', 'video', name);
ensureDir(outDir);

// The LUT path is escaped for ffmpeg's filter syntax (Windows drive colons).
const lutFilter = lut ? `lut3d=file='${lut.replaceAll('\\', '/').replace(':', '\\:')}',` : '';
const variants = [
  { file: '1080', filter: `${lutFilter}scale=-2:1080` },
  { file: '720', filter: `${lutFilter}scale=-2:720` },
  ...(flags.portrait
    ? [{ file: 'portrait-720', filter: `${lutFilter}crop=ih*9/16:ih,scale=720:-2` }]
    : []),
];
const codecs = [
  {
    ext: 'av1.mp4',
    args: ['-c:v', 'libsvtav1', '-preset', '6', '-crf', '38', '-pix_fmt', 'yuv420p', '-g', '240'],
  },
  {
    ext: 'h264.mp4',
    args: [
      '-c:v',
      'libx264',
      '-preset',
      'slow',
      '-crf',
      '24',
      '-profile:v',
      'high',
      '-pix_fmt',
      'yuv420p',
    ],
  },
];

function run(args, label) {
  console.log(`Encoding ${label}...`);
  const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    stdio: 'inherit',
  });
  if (result.status !== 0) fail(`ffmpeg failed while encoding ${label}.`);
}

const files = {};
for (const variant of variants) {
  for (const codec of codecs) {
    const file = `${variant.file}.${codec.ext}`;
    run(
      [
        '-ss',
        start,
        '-t',
        String(duration),
        '-i',
        source,
        '-an',
        '-vf',
        variant.filter,
        '-fps_mode',
        'cfr',
        '-r',
        '30',
        ...codec.args,
        '-movflags',
        '+faststart',
        join(outDir, file),
      ],
      file,
    );
    files[file] = statSync(join(outDir, file)).size;
  }
}

const posterFilter = `${lutFilter}scale=-2:1080`;
run(
  [
    '-ss',
    start,
    '-i',
    source,
    '-ss',
    String(posterAt),
    '-frames:v',
    '1',
    '-vf',
    posterFilter,
    '-q:v',
    '3',
    join(outDir, 'poster.jpg'),
  ],
  'poster.jpg',
);
// ffmpeg's JPEG is large (a 1080p poster came to 233 kB); mozjpeg at quality 72 is about a
// third of that, which keeps the homepage inside its weight budget (spec P.1).
const posterPath = join(outDir, 'poster.jpg');
writeFileSync(
  posterPath,
  await sharp(readFileSync(posterPath)).jpeg({ quality: 72, mozjpeg: true }).toBuffer(),
);
// AVIF posters at three widths for the loop's <picture> (src/islands/FootageLoop.tsx); a phone
// takes the 800 px one, which is a fraction of the JPEG.
for (const [file, width] of [
  ['poster.avif', 1920],
  ['poster-1280.avif', 1280],
  ['poster-800.avif', 800],
]) {
  writeFileSync(
    join(outDir, file),
    await sharp(readFileSync(posterPath))
      .resize({ width, withoutEnlargement: true })
      .avif({ quality: 50 })
      .toBuffer(),
  );
}

const probe = spawnSync(
  'ffprobe',
  [
    '-v',
    'error',
    '-select_streams',
    'v:0',
    '-show_entries',
    'stream=width,height',
    '-of',
    'csv=p=0',
    join(outDir, '1080.h264.mp4'),
  ],
  { encoding: 'utf8' },
);
const [width, height] = (probe.stdout ?? '').trim().split(',').map(Number);

const manifest = {
  name,
  source: basename(source),
  duration,
  width: width || null,
  height: height || null,
  portrait: Boolean(flags.portrait),
  player,
  files: Object.fromEntries(Object.entries(files).map(([file, bytes]) => [file, bytes])),
};
writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

console.log(`\nWrote apps/site/public/media/video/${name}/:`);
for (const [file, bytes] of Object.entries(files)) {
  const over =
    bytes > LIMIT
      ? '  OVER the 25 MiB limit; shorten the clip'
      : !player && TARGETS[file] && bytes > TARGETS[file]
        ? '  over target; consider a shorter loop'
        : '';
  console.log(`  ${file.padEnd(24)} ${formatBytes(bytes)}${over}`);
}
if (Object.values(files).some((bytes) => bytes > LIMIT)) process.exit(1);
console.log(
  `\nReference it from an entry with:\n  - type: video\n    name: ${name}\n    title: "TODO(josh): what the footage shows"${player ? '' : '\n    loop: true'}`,
);
