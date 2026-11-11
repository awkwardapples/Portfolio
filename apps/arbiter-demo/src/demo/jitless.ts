/**
 * Zod 4 probes once whether `new Function` works, to compile faster parsers.
 * Under the demo's Content Security Policy (no 'unsafe-eval', public/_headers)
 * the browser reports that probe as a violation even though zod catches it.
 * Jitless mode skips the probe; parsing is the same, only not compiled.
 */
import * as z from 'zod';

z.config({ jitless: true });
