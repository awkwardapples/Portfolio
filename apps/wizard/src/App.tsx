import { config } from '@/config-loader';
import { Button, IconButton, Input, Skeleton } from '@/components/primitives';

/**
 * Step 4.0 foundation preview.
 *
 * This is NOT the wizard. It renders the design-system primitives so the
 * foundation can be visually verified and so the build has real usage to
 * compile. Phase 4.4+ replaces this with the actual wizard steps.
 *
 * Everything here uses the closed token system via semantic classes only.
 */

/** A simple "restart" glyph as inline SVG. Icons are SVG, never emoji/text glyphs. */
function RestartIcon(): JSX.Element {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 8a6 6 0 1 1 1.8 4.3" />
      <path d="M2 12V8h4" />
    </svg>
  );
}

export function App(): JSX.Element {
  return (
    <div className="mx-auto max-w-xl p-6">
      <div className="rounded border border-border bg-surface p-6">
        <h1 className="text-xl font-semibold text-text">{config.businessName || 'Quote Wizard'}</h1>
        <p className="mt-2 text-base text-text-muted">
          Design-system foundation. The wizard steps are built in a later part of Phase 4.
        </p>

        <div className="mt-6 flex items-center gap-3">
          <Button variant="primary">Continue</Button>
          <Button variant="secondary">Back</Button>
          <Button variant="ghost">Skip</Button>
          <IconButton label="Start over">
            <RestartIcon />
          </IconButton>
        </div>

        <div className="mt-6">
          <label htmlFor="demo" className="mb-1 block text-sm font-medium text-text">
            Postcode
          </label>
          <Input id="demo" placeholder="e.g. SW1A 1AA" />
        </div>

        <div className="mt-6 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>

        {config.pluginVersion !== '' && (
          <p className="mt-6 text-xs text-text-subtle">Quote Wizard v{config.pluginVersion}</p>
        )}
      </div>
    </div>
  );
}
