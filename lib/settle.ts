// A fetch result that never rejects, so one failing section can render its
// own error state instead of throwing to app/error.tsx.
export type Settled<T> = { ok: true; value: T } | { ok: false };

// Attaches the catch straight away, so a rejection is never unhandled even if
// nothing awaits the promise yet. The error is logged on the server.
export function settle<T>(promise: Promise<T>): Promise<Settled<T>> {
  return promise.then(
    (value) => ({ ok: true as const, value }),
    (error: unknown) => {
      // eslint-disable-next-line no-console
      console.error(error);

      return { ok: false as const };
    },
  );
}

// Derives a value from a settled result, passing failures through.
export function mapSettled<T, U>(
  settled: Promise<Settled<T>>,
  map: (value: T) => U,
): Promise<Settled<U>> {
  return settled.then((result) =>
    result.ok ? { ok: true as const, value: map(result.value) } : result,
  );
}
