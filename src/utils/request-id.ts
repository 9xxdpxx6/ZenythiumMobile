/**
 * Idempotency key generation for client-initiated mutations.
 *
 * Used so that automatic request retries (see services/api.ts) can't create
 * duplicate records when a request actually reached the server but its
 * response was lost on a flaky connection.
 */
export function generateClientRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback for WebViews without crypto.randomUUID (older Android/iOS)
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
