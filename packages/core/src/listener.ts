/** Invoke a public callback without allowing consumer code to corrupt widget state or skip other subscribers. */
export function callContext7ListenerSafely<Payload>(listener: (payload: Payload) => void, payload: Payload): void {
  try {
    listener(payload);
  } catch (error) {
    const reporter =
      (globalThis as typeof globalThis & { reportError?: (reason: unknown) => void }).reportError || console.error;
    reporter(error);
  }
}
