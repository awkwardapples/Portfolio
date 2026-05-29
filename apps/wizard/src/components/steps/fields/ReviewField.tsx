import { useWizardSelector } from '@/runtime/useWizard';
import type { WizardConfig } from '@/domain/config/wizard-config';
import type { AnswerMap, AnswerValue } from '@/domain/runtime/answer-types';

import type { FieldRendererProps } from '../types';

// Single intentional exception to the prop-driven renderer pattern.
// ReviewField needs all answers + all field labels from every step to render a
// complete summary. Receiving these as props would require StepRenderer to know
// about the review field type specifically. Per Option A decision: ReviewField
// reads from the store directly and documents itself as the sole exception.

interface SummaryRow {
  label: string;
  display: string;
}

function buildAnswerSummary(answers: AnswerMap, wizard: WizardConfig): SummaryRow[] {
  const rows: SummaryRow[] = [];
  for (const step of wizard.steps) {
    for (const field of step.fields) {
      if (field.type === 'review') continue;
      const val: AnswerValue | undefined = answers[field.key];
      if (val === undefined || val === null || val === '') continue;
      if (Array.isArray(val) && val.length === 0) continue;

      let display: string;
      if (Array.isArray(val)) {
        display = (val as ReadonlyArray<string>)
          .map((v) => field.options?.find((o) => o.value === v)?.label ?? v)
          .join(', ');
      } else if (field.options !== undefined) {
        display = field.options.find((o) => o.value === String(val))?.label ?? String(val);
      } else {
        display = String(val);
      }

      rows.push({ label: field.label, display });
    }
  }
  return rows;
}

export function ReviewField({ field }: FieldRendererProps): JSX.Element {
  const { answers, wizard } = useWizardSelector((state, config) => ({
    answers: state.answers,
    wizard: config.wizard,
  }));

  const rows = buildAnswerSummary(answers, wizard);

  return (
    <div id={`${field.key}-content`} aria-label={field.label}>
      {rows.length === 0 ? (
        <p className="text-sm text-text-muted">No answers recorded yet.</p>
      ) : (
        <dl className="space-y-3">
          {rows.map((row) => (
            <div key={row.label}>
              <dt className="text-sm font-medium text-text">{row.label}</dt>
              <dd className="mt-1 text-base text-text-muted">{row.display}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
