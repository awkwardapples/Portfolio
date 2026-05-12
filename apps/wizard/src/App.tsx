/**
 * Placeholder App component.
 *
 * This is what step 3B ships: a visible, styled placeholder proving that
 * React mounts, Tailwind processes, and the build pipeline emits a working
 * bundle. Real wizard logic arrives in Phase 4.
 *
 * Do not add business logic here. When the real wizard ships, this file
 * will be replaced by the engine + step components.
 */
export function App(): JSX.Element {
  return (
    <div className="mx-auto max-w-xl p-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Quote Wizard</h1>
        <p className="mt-2 text-slate-600">
          The wizard is loading. Real steps will replace this placeholder in Phase 4.
        </p>
        <div className="mt-4 inline-block rounded bg-primary px-3 py-1 text-sm font-medium text-white">
          Scaffold OK
        </div>
      </div>
    </div>
  );
}
