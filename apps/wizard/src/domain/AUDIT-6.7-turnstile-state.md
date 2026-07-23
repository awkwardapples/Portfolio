# Audit B — Turnstile Token State Access (Step 6.7)

## Command

```powershell
Get-ChildItem -Path "apps/wizard/src" -Recurse -Include "*.tsx","*.ts" |
  Select-String "turnstileToken" -List
```

## Result (files matching) and classification

| File                                   | Role                                                                                                                                                             |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `runtime/bot-protection-store.ts`      | `BotProtectionStore` (plain, non-reactive class) holds `turnstileToken` for the **submission payload** — the value actually sent to the server for verification. |
| `runtime/submission-bot-protection.ts` | Reads `store.getTurnstileToken()` to merge into the outbound submission request.                                                                                 |
| `runtime/http-submission-port.ts`      | `turnstileToken` field on the HTTP request/port types — payload shape, not UI state.                                                                             |
| `runtime/submission.ts`                | `turnstileToken?: string                                                                                                                                         | null` on the submission-request type — same payload concern. |
| `components/TurnstileWidget.tsx`       | Calls `store?.setTurnstileToken(token)` (writes into the class above) **and separately** `onTokenChange?.(token)` (a callback prop — see below).                 |

**Corrected assumption:** the spec's Undocumented Assumption #1 and Audit B
both assume a single `turnstileToken` state that "should be available to"
both submit paths. **No such shared reactive state exists.** `turnstileToken`
as a name refers exclusively to `BotProtectionStore`'s internal field —
a plain class instance (not React state, not a context value), used only
to build the outbound submission request body. It is not read anywhere to
decide whether a button is enabled or disabled.

## What actually gates the UI

`components/steps/StepRenderer.tsx` derives its own **local, reactive**
boolean from `TurnstileWidget`'s `onTokenChange` callback:

```tsx
const turnstileConfigured = isLast && config.turnstileSiteKey !== '';
const [turnstileReady, setTurnstileReady] = useState(!turnstileConfigured);
const handleTurnstileTokenChange = useCallback((token: string | null) => {
  setTurnstileReady(token !== null);
}, []);
```

```tsx
{
  isLast && <TurnstileWidget onTokenChange={handleTurnstileTokenChange} />;
}
```

`turnstileReady` is `true` immediately when Turnstile isn't configured for
this deployment (`config.turnstileSiteKey === ''`) — matching
`BotProtection`'s server-side behavior of skipping Layer 3 entirely in
that case (Step 5.13f) — and otherwise starts `false`, flipping to `true`
only once `TurnstileWidget` reports a non-null token.

This is `useState` local to `StepRenderer`, not a store or context value.
It exists purely to gate the button row it renders in the same component.

## Whether Skip and Submit has access to the same state

**Yes, trivially** — `handleSkip` is defined in the same component
(`StepRenderer`) as `handleNext`, in the same closure as `turnstileReady`
and `hasMissingPhotos`. The bug was never a state-_access_ problem; it's
that `NavigationControls`, the presentational component the two handlers
are wired into, only threads its `disabled` prop to one of its two
submit-triggering buttons. See `AUDIT-6.7-submit-pattern.md` and
`AUDIT-6.7-skip-and-submit.md`.
