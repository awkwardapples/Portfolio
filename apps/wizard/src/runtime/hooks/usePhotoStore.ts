import { useContext } from 'react';

import { PhotoStoreContext } from '@/runtime/WizardProvider';
import type { PhotoStore } from '@/runtime/photos-store';

/**
 * Returns the per-session volatile PhotoStore from the nearest WizardProvider,
 * or null when no PhotoStore was provided (wizard has no photo fields).
 *
 * PhotoField requires a non-null store (throws if null). StepRenderer uses
 * the nullable form to skip photo-gate checks for non-photo wizards.
 */
export function usePhotoStore(): PhotoStore | null {
  return useContext(PhotoStoreContext);
}
