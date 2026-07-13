import { useState } from 'react';

import { useBotProtectionStore } from '@/runtime/hooks/useBotProtectionStore';

/**
 * Invisible honeypot field (Step 5.13f, ADR-0027).
 *
 * Mounted once in WizardShell — NOT inside StepRenderer, which remounts
 * (fresh local state) on every step change via its `key={step.id}` prop.
 * A honeypot that reset itself every step would discard whatever a bot
 * wrote into it before the final step is ever reached. WizardShell's
 * <main> is unkeyed across step transitions, so this stays mounted for the
 * whole wizard session.
 *
 * A real user never sees or fills this field (offscreen, aria-hidden,
 * tabIndex={-1}, autoComplete="off" so password managers don't touch it).
 * Naive bots that indiscriminately fill every text input on the page will
 * fill it; the value is reported to BotProtectionStore on every change and
 * merged into the submission payload by createBotProtectionEnrichedPort.
 */
export function HoneypotField(): JSX.Element {
  const store = useBotProtectionStore();
  const [value, setValue] = useState('');

  return (
    // sr-only clips this off-screen without display:none/visibility:hidden —
    // naive bots that skip those specific hiding techniques still fill it in.
    // aria-hidden additionally removes it from the accessibility tree so a
    // real screen-reader user never encounters it either.
    <div aria-hidden="true" className="sr-only">
      <label>
        Leave this field blank
        <input
          type="text"
          name="goqw_website"
          autoComplete="off"
          tabIndex={-1}
          value={value}
          onChange={(e) => {
            const next = e.target.value;
            setValue(next);
            store?.setHoneypotValue(next);
          }}
        />
      </label>
    </div>
  );
}
