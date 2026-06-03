/**
 * Per-session volatile base64 store for photo files.
 *
 * Lives in a useRef inside WizardProvider so it resets on remount. NOT
 * serializable; NOT persisted to sessionStorage. The FSM state holds
 * PhotoMetadata only; this map holds the actual encoded bytes keyed by fileId.
 *
 * At submission time the WizardProvider's submission-payload builder merges
 * this map with the FSM's photo metadata to produce PhotoFilePayload entries.
 */
export class PhotoStore {
  private readonly data = new Map<string, string>();

  set(fileId: string, base64: string): void {
    this.data.set(fileId, base64);
  }

  get(fileId: string): string | undefined {
    return this.data.get(fileId);
  }

  delete(fileId: string): void {
    this.data.delete(fileId);
  }

  has(fileId: string): boolean {
    return this.data.has(fileId);
  }

  clear(): void {
    this.data.clear();
  }

  size(): number {
    return this.data.size;
  }
}

/**
 * Generate a stable client-side file ID. Uses crypto.randomUUID when
 * available; falls back to a timestamped random string.
 *
 * Must be called from the effects layer only — NOT from the reducer, which
 * must remain pure and deterministic.
 */
export function generateFileId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
