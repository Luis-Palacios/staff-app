export interface ApiFetchOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: HeadersInit;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
}

export class ApiError extends Error {
  readonly status: number;
  readonly url: string;
  readonly method: string;
  readonly body: unknown;

  constructor(params: {
    status: number;
    statusText: string;
    url: string;
    method: string;
    body: unknown;
  }) {
    super(
      `API request failed: ${params.method} ${params.url} → ${params.status} ${params.statusText}`,
    );

    this.name = "ApiError";
    this.status = params.status;
    this.url = params.url;
    this.method = params.method;
    this.body = params.body;
  }
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

async function parseBodySafely(response: Response): Promise<unknown> {
  const text = await response.text().catch(() => "");

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

export async function apiFetch<TResponse>(
  baseUrl: string,
  path: string,
  options: ApiFetchOptions = {},
): Promise<TResponse> {
  const url = joinUrl(baseUrl, path);
  const method = options.method ?? "GET";

  const response = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      ...(options.body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
      ...options.headers,
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    ...(options.cache !== undefined ? { cache: options.cache } : {}),
    ...(options.next !== undefined ? { next: options.next } : {}),
  });

  if (!response.ok) {
    const body = await parseBodySafely(response);

    throw new ApiError({
      status: response.status,
      statusText: response.statusText,
      url,
      method,
      body,
    });
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}
