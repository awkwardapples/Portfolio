# Media pipeline

The scripts that prepare photographs, PDFs and video for the site (spec T.3). They run on Josh's machine (Windows) or in CI (Linux), from the repository root, through `pnpm`. Paths can be absolute or relative to where the command is run.

| Command              | Prerequisite                           | Writes                                                                                |
| -------------------- | -------------------------------------- | ------------------------------------------------------------------------------------- |
| `pnpm media:images`  | none (uses `sharp`)                    | JPEGs in the entry folder                                                             |
| `pnpm media:pdf`     | none (`pdfjs-dist`, `@napi-rs/canvas`) | the PDF in `public/documents/`, its cover beside the entry, `src/data/documents.json` |
| `pnpm media:video`   | ffmpeg with SVT-AV1 and x264           | a loop set in `public/media/video/<name>/`                                            |
| `pnpm media:screens` | Playwright                             | stills of the SCB demo for the GrowTrades frame                                       |
| `pnpm media:og`      | Playwright, `sharp`                    | the default share image and the site icons in `public/`                               |

## Photographs: `pnpm media:images`

```bash
pnpm media:images C:/Users/Josh/Pictures/gig1.jpg C:/Users/Josh/Pictures/gig2.jpg --to apps/site/src/content/posts/2026-10-04-gig
pnpm media:images Headshot.png --to apps/site/src/content/profile --name portrait
```

- Resizes to at most 2560 pixels on the long edge (never enlarges), applies the camera's rotation, converts to sRGB, and **removes all metadata, including GPS location** (spec Q.5).
- Writes high-quality JPEG originals named after the file (or `--name`). Astro makes the AVIF and WebP versions at build time.
- Prints the `media:` lines to paste, with placeholders for alt text and captions.
- HEIC files (iPhone default) cannot be read: export them as JPEG first.

## PDFs: `pnpm media:pdf`

```bash
pnpm media:pdf "C:/Users/Josh/Desktop/My Paper.pdf" --to apps/site/src/content/work/my-paper
pnpm media:pdf report.pdf --to apps/site/src/content/work/my-project --name my-project-report
pnpm media:pdf report.pdf --dry-run
```

- Copies the PDF to `apps/site/public/documents/<name>.pdf`. The name is the entry folder's name unless `--name` is given, and the URL `/documents/<name>.pdf` is permanent, so citations keep working.
- Renders page one to `<name>.cover.png` in the entry folder, 1200 pixels wide.
- Records the page count, file size, and the PDF's embedded title and author in `apps/site/src/data/documents.json`. Warns if the PDF has no embedded title: set one in the source document (File, Properties) and export again.
- Prints the `documents:` lines to paste.
- `--dry-run` renders the cover to a temporary folder and changes nothing; CI uses it to check rendering on Linux.

Before adding a PDF, check its first pages for personal details: the public site never shows a personal email address, home address or personal phone number (spec Q.5, U.8).

## Footage loops: `pnpm media:video`

Install ffmpeg once: `winget install Gyan.FFmpeg`, then open a new terminal.

```bash
pnpm media:video "D:/Lumix/P1000123.MOV" --name studio --start 00:00:12 --duration 10
pnpm media:video clip.mov --name stage --start 00:01:05 --duration 12 --lut "C:/LUTs/VLog_to_V709.cube" --portrait --poster-at 3
```

Writes `apps/site/public/media/video/<name>/`:

| File                                     | What it is                                                  |
| ---------------------------------------- | ----------------------------------------------------------- |
| `1080.av1.mp4`, `720.av1.mp4`            | AV1 (SVT-AV1), for browsers that decode it                  |
| `1080.h264.mp4`, `720.h264.mp4`          | H.264, the fallback Safari needs                            |
| `portrait-720.*.mp4` (with `--portrait`) | a 9:16 centre crop for phones held upright                  |
| `poster.avif`, `poster.jpg`              | the still shown before the loop plays                       |
| `manifest.json`                          | durations, sizes and dimensions, read by the loop component |

- Loops are 8 to 15 seconds, silent (no audio track), 30 frames per second constant, with `+faststart`.
- `--lut` applies a `.cube` LUT for footage shot in a log profile such as V-Log.
- Targets: about 3 MB for 1080 AV1 and 6 MB for 1080 H.264. The script flags files over target, and fails if any file is over Cloudflare's 25 MiB limit.
- Reference the set from an entry as `type: video` with `name: <name>`.

## SCB demo stills: `pnpm media:screens`

```bash
pnpm --filter @growth-ops/wizard build:demo   # once, to build the demo
pnpm media:screens
```

Opens the built demo in Playwright's Chromium and saves the homepage at desktop and phone sizes, and the quote page, as PNGs in `src/content/work/growtrades/screens/`. Astro turns them into AVIF and WebP for the frame's still. Run it again when the SCB site changes.

## Share image and icons: `pnpm media:og`

```bash
pnpm media:og
```

Renders the default share image (`public/og/default.png`, 1200 by 630: the name and headline from the profile on the stage colour) and the icons (`favicon-32.png`, `favicon.ico`, `apple-touch-icon.png`) with the site's own fonts. Work pages share their cover instead, cut at build time (ADR-0049). Run it again when the name or headline changes, and commit the files.
