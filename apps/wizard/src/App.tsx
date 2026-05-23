import { config } from '@/config-loader';

/**
 * Placeholder App component.
 *
 * In Step 3E this renders just enough to prove the PHP → React contract:
 *   - Business name appears (proves config flowed through)
 *   - The "Scaffold OK" badge uses the primary colour (proves CSS variable wiring)
 *   - Plugin version is shown (proves build identity round-trip)
 *
 * Phase 4 replaces this with the real wizard engine + step components.
 */
export function App(): JSX.Element {
  const showVersionBadge = config.pluginVersion !== '';

  return (
    <div className="mx-auto max-w-xl p-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          {config.businessName || 'Quote Wizard'}
        </h1>
        <p className="mt-2 text-slate-600">
          The wizard is loading. Real steps will replace this placeholder in Phase 4.
        </p>
        <div className="mt-4 inline-block rounded bg-primary px-3 py-1 text-sm font-medium text-white">
          Scaffold OK
        </div>
        {showVersionBadge && (
          <p className="mt-4 text-xs text-slate-400">Quote Wizard v{config.pluginVersion}</p>
        )}
      </div>
    </div>
  );
}
