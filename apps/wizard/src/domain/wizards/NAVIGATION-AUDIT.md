# Navigation State Machine Audit — Step 5.9-Remediation

**Date:** 2026-06-22  
**Scope:** R2 — back-button navigation bug  
**Files read:** `domain/runtime/state.ts`, `navigation.ts`, `transition.ts`, `WizardStore.ts`, `WizardShell.tsx`, `StepRenderer.tsx`, `NavigationControls.tsx`, `QuotePage.tsx`

---

## How "current step" is tracked

`WizardState.currentStepId: string | null` — the ID of the step currently displayed.

`WizardState.visitedStepIds: ReadonlyArray<string>` — append-only list of all step IDs visited during the session, in the order they were first (or repeatedly) reached. May contain duplicates by design.

---

## How Next navigation works

`handleStepNext()` in `transition.ts`:

1. Validates the current step via `validateStep()`.
2. If invalid: stays on current step, writes validation snapshot.
3. If valid: calls `getNextStepId()` to find the next visible step in config order.
4. Appends the next step's ID to `visitedStepIds`.
5. Sets `currentStepId` to the next step.

---

## How Back navigation works (current — BUGGY)

`handleStepBack()` in `transition.ts`:

1. Calls `getPreviousStepId(currentStepId, visitedStepIds)`.
2. `getPreviousStepId` scans `visitedStepIds` from the end, finds the **last occurrence** of `currentStepId`, and returns the entry **before** it.
3. **APPENDS** `prevId` to `visitedStepIds`.
4. Sets `currentStepId` to `prevId`.

---

## Root cause: "Back twice navigates forward"

The bug is in step 3 above: `handleStepBack` **appends** the previous step to history instead of **popping** the current step.

Trace with wizard steps A → B → C:

| Action      | currentStepId    | visitedStepIds                |
| ----------- | ---------------- | ----------------------------- |
| Hydrate     | A                | [A]                           |
| Next        | B                | [A, B]                        |
| Next        | C                | [A, B, C]                     |
| **Back #1** | B                | [A, B, C, **B**] ← B appended |
| **Back #2** | C ← **FORWARD!** | [A, B, C, B, C]               |

`getPreviousStepId('B', [A, B, C, B])`:

- Scans from end, finds B at index 3 (the appended one).
- Returns `visited[2]` = C ← **goes forward instead of backward**.

---

## Fix

Change `handleStepBack` to **pop** the current step's last occurrence from history instead of appending the previous step.

**Fixed trace:**

| Action      | currentStepId | visitedStepIds    |
| ----------- | ------------- | ----------------- |
| Hydrate     | A             | [A]               |
| Next        | B             | [A, B]            |
| Next        | C             | [A, B, C]         |
| **Back #1** | B             | [A, B] ← C popped |
| **Back #2** | A             | [A] ← B popped    |
| **Back #3** | A (no-op)     | [A]               |

`getPreviousStepId('C', [A, B, C])` → B ✓  
After pop: `visited = [A, B]`, current = B  
`getPreviousStepId('B', [A, B])` → A ✓  
After pop: `visited = [A]`, current = A  
`getPreviousStepId('A', [A])` → null (firstEntry) → no-op ✓

**Existing test that must be updated:** `transition.test.ts` — "appends the previous step to visitedStepIds" asserts `['s1', 's3', 's1']`; with the fix it becomes `['s1']`.

**Back-and-forth still works:**

- A → B → Back → Next → Back: A→B (visited=[A,B]) → Back, pop B (visited=[A]) → Next, append B (visited=[A,B]) → Back, pop B (visited=[A]) → at A ✓

---

## Back button on first wizard step

**Current behavior:** `NavigationControls` renders `<div aria-hidden>` (no back button) when `isFirst === true`. The button row is intentionally empty on the left.

**Required behavior (OV criterion 34):** Show a Back button on the first step that returns to the service selector.

**Change required:**

- `NavigationControls.tsx`: always render the Back button (remove `isFirst ? <div> : <Button>` branch).
- `StepRenderer.tsx`: add `onFirstBack?: () => void` prop. `handleBack()` calls `onFirstBack?.()` when `isFirst`, else dispatches `STEP_BACK`.
- `WizardShell.tsx`: add `onReturnToSelector?: () => void` prop; pass as `onFirstBack` to StepRenderer.
- `QuotePage.tsx`: pass `onReturnToSelector={() => setSelectedId(null)}` to `<WizardShell>`.

---

## Existing tests affected

| File                     | Test                                          | Change                                              |
| ------------------------ | --------------------------------------------- | --------------------------------------------------- |
| `transition.test.ts:281` | "appends the previous step to visitedStepIds" | Update assertion: `['s1']` not `['s1', 's3', 's1']` |
| `transition.test.ts:303` | "handles back-and-forth correctly"            | Logic still correct; intermediate history changed   |
