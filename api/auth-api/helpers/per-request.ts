import { headers } from "next/headers";

// Shares one result of `load` per incoming request, in a page render and in a server action alike.
//
// React's cache() only dedupes while rendering; in a server action every call runs again, so an
// auto-save that checked a permission and then fetched read the session twice. Next keeps one
// headers object per request (its request store), so a WeakMap keyed on it lasts exactly one
// request in both. A rejected result stays for the rest of that request, as with cache().
export function perRequest<T>(
  load: (incoming: Headers) => Promise<T>,
): () => Promise<T> {
  const results = new WeakMap<Headers, Promise<T>>();

  return async () => {
    const incoming = await headers();
    let result = results.get(incoming);

    if (!result) {
      result = load(incoming);
      results.set(incoming, result);
    }

    return result;
  };
}
