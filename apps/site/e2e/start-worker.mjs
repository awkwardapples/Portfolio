// Starts the Worker for browser tests (playwright.config.ts): a fresh local
// D1 database with the migrations applied, then `wrangler dev` with test-only
// variables pointing forwards at the webhook stub (e2e/webhook-stub.mjs).
// Nothing here is a real secret: the webhook is a local stub, the salt is a
// test value, and Turnstile is off because the build has no site key.
import { spawn, spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const EDGE = fileURLToPath(new URL('../../edge/', import.meta.url));
const STATE = '.wrangler/e2e-state';
const PORT = process.env.PORT ?? '8788';
const STUB = `http://127.0.0.1:${process.env.WEBHOOK_STUB_PORT ?? 8799}/hook`;
const shell = process.platform === 'win32';

rmSync(new URL(`../../edge/${STATE}/`, import.meta.url), { recursive: true, force: true });

const migrate = spawnSync(
  'pnpm',
  ['exec', 'wrangler', 'd1', 'migrations', 'apply', 'DB', '--local', '--persist-to', STATE],
  { cwd: EDGE, stdio: 'inherit', shell },
);
if (migrate.status !== 0) process.exit(migrate.status ?? 1);

const vars = {
  MAKE_WEBHOOK_URL: STUB,
  MAKE_WEBHOOK_SECRET: 'e2e-webhook-secret',
  RATE_LIMIT_SALT: 'e2e-salt',
};
const dev = spawn(
  'pnpm',
  [
    'exec',
    'wrangler',
    'dev',
    '--port',
    PORT,
    '--ip',
    '127.0.0.1',
    '--persist-to',
    STATE,
    ...Object.entries(vars).flatMap(([key, value]) => ['--var', `${key}:${value}`]),
  ],
  { cwd: EDGE, stdio: 'inherit', shell },
);
const stop = () => dev.kill();
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
dev.on('exit', (code) => process.exit(code ?? 0));
