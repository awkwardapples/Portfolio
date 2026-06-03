import { useContext } from 'react';

import { PhotoStoreContext } from '@/runtime/WizardProvider';
import type { PhotoStore } from '@/runtime/photos-store';

/**
 * Returns the per-session volatile PhotoStore from the nearest WizardProvider.
 *
 * Must be called inside <WizardProvider>. Throws if the context is missing.
 * Use this in PhotoField to store/delete base64 bytes as the user selects or
 * removes photos.
 */
export function usePhotoStore(): PhotoStore {
  const store = useContext(PhotoStoreContext);
  if (store === null) {
    throw new Error('usePhotoStore must be called inside <WizardProvider>.');
  }
  return store;
}
