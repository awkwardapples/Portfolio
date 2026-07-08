# Audit C — Navigation State Machine (5.13a)

## Scope

Understand how wizard back navigation works and whether "adjust" navigation
(jumping backwards to a specific prior step) is already supported.

## Findings

### History-based backward navigation

`getPreviousStepId(currentStepId, visitedStepIds)` in `navigation.ts` returns the step
immediately before the last occurrence of `currentStepId` in the `visitedStepIds` array.
It is strictly history-based: it does NOT recompute visibility or scan config order.

`visitedStepIds` is append-only in the FSM. `handleStepNext` appends `nextId` to the array.
`handleStepBack` removes the last occurrence of `currentStepId` from the array (pop, not
append) — this prevents forward-navigation on a second Back press.

### Jump-to-specific-step: STEP_GOTO already exists

`handleStepGoto(state, event, config, fieldKeyById)` in `transition.ts` supports jumping
directly to any named step ID. Guards:

1. Target must appear in `visitedStepIds` (user visited it this session).
2. Target must still be currently visible (conditions re-evaluated).

On success: appends the target to `visitedStepIds` and sets `currentStepId` to the target.

### Multi-step backward jump

STEP_GOTO handles jumping back multiple steps at once. The only constraints are that the
target was visited and is still visible. This is exactly what "Adjust" needs.

## Impact on 5.13a

### No FSM changes required

The "Adjust" button in `EstimateDisplayStep` dispatches:

```typescript
dispatch({ type: 'STEP_GOTO', stepId: step.onAdjustGoTo });
```

`onAdjustGoTo` is a step ID that the user must have visited to reach the estimate display
step (they passed through it). The STEP_GOTO guard passes. Behavior: returns the user to
the specified step with answers preserved.

### The "Continue" button

"Continue" dispatches `dispatch({ type: 'STEP_NEXT' })`. `handleStepNext` finds the next
visible step in config order after the current estimate-display step. After updating
`validateStep` to return trivially valid for non-field steps, `STEP_NEXT` from an
estimate-display step advances normally.

### No "adjust to unvisited future step" needed

The spec's `onAcceptGoTo` field is not needed — "Continue" simply uses `STEP_NEXT` which
always advances to the next step in config order. Removed from the implementation to
keep the schema minimal.

### Summary

| Action   | Event     | Already supported?              |
| -------- | --------- | ------------------------------- |
| Continue | STEP_NEXT | Yes (after trivial-valid patch) |
| Adjust   | STEP_GOTO | Yes (no changes needed)         |
| Back     | STEP_BACK | Yes (unchanged)                 |
