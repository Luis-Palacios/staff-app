// Sets or drops one query param with replaceState, as on the applications page: the filters run
// over a list already fetched, so a click must not refetch it. `useSearchParams` follows along.
export function replaceParam(name: string, value: string | null) {
  const params = new URLSearchParams(window.location.search);

  if (value === null) params.delete(name);
  else params.set(name, value);

  const search = params.toString();

  window.history.replaceState(
    null,
    "",
    search ? `?${search}` : window.location.pathname,
  );
}
