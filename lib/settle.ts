import { unstable_rethrow } from "next/navigation";

// A fetch result that never rejects, so one failing section can render its
// own error state instead of throwing to app/error.tsx.
export type Settled<T> = { ok: true; value: T } | { ok: false };

// Attaches the catch straight away, so a rejection is never unhandled even if
// nothing awaits the promise yet. The error is logged on the server.
//
// Next.js control flow (redirect(), e.g. authenticatedFetch turning away a
// user without a role) is settled quietly, not logged and not rethrown: the
// (app) layout makes the same check and has already redirected, and the page
// it drops never awaits these promises, so a rethrow would only surface as an
// unhandled rejection.
export function settle<T>(promise: Promise<T>): Promise<Settled<T>> {
  return promise.then(
    (value) => ({ ok: true as const, value }),
    (error: unknown) => {
      if (!isNextControlFlow(error)) {
        // eslint-disable-next-line no-console
        console.error(error);
      }

      return { ok: false as const };
    },
  );
}

// unstable_rethrow is Next's public way to recognise its own control-flow
// errors: it throws those and ignores everything else.
function isNextControlFlow(error: unknown): boolean {
  try {
    unstable_rethrow(error);

    return false;
  } catch {
    return true;
  }
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
