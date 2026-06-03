/**
 * Photo-enriched submission port wrapper (Step 4.8).
 *
 * The FSM state holds PhotoMetadata only — base64 bytes live in the
 * PhotoStore (volatile, not persisted). This wrapper intercepts the
 * SubmissionRequest, merges base64 from the PhotoStore into every
 * photo-field answer, then calls the underlying port.
 *
 * Wrapping the port (not the store) means WizardStore is unchanged and the
 * enrichment point is collocated with the submission boundary.
 */

import { isPhotoAnswerValue } from '@/domain/runtime/photos';
import type { PhotoFilePayload } from '@/domain/runtime/photos';
import type { PhotoStore } from '@/runtime/photos-store';
import type { SubmissionPort, SubmissionRequest } from '@/runtime/submission';

/**
 * Wrap a SubmissionPort so photo answers are enriched with base64 data from
 * the PhotoStore before the request is forwarded to the real port.
 *
 * @param base  The real submission port to delegate to.
 * @param store The volatile PhotoStore owned by WizardProvider.
 */
export function createPhotoEnrichedPort(base: SubmissionPort, store: PhotoStore): SubmissionPort {
  return {
    submit(request: SubmissionRequest) {
      return base.submit(enrichRequest(request, store));
    },
  };
}

function enrichRequest(request: SubmissionRequest, store: PhotoStore): SubmissionRequest {
  const enrichedAnswers: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(request.answers)) {
    if (isPhotoAnswerValue(value)) {
      const files: PhotoFilePayload[] = value.files.map((meta) => ({
        ...meta,
        dataBase64: store.get(meta.fileId) ?? '',
      }));
      enrichedAnswers[key] = { files };
    } else {
      enrichedAnswers[key] = value;
    }
  }
  return { ...request, answers: enrichedAnswers as SubmissionRequest['answers'] };
}
