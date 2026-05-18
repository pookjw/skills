const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  statusCode: number;
  errorCode?: string;
  details?: unknown;

  constructor(message: string, statusCode: number, errorCode?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  const hasBody = options.body !== undefined && options.body !== null;

  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    cache: options.cache ?? 'no-store',
    headers,
    credentials: 'include',
    body: hasBody ? JSON.stringify(options.body) : undefined,
  });

  const raw = await response.text();
  const payload = raw ? tryParseJson(raw) : null;

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && 'message' in payload && payload.message) ||
      response.statusText ||
      'Request failed';
    const statusCode =
      (payload && typeof payload === 'object' && 'statusCode' in payload && payload.statusCode) ||
      response.status;
    const errorCode =
      payload && typeof payload === 'object' && 'errorCode' in payload
        ? String(payload.errorCode)
        : undefined;
    const details =
      payload && typeof payload === 'object' && 'details' in payload ? payload.details : payload;

    throw new ApiError(String(message), Number(statusCode), errorCode, details);
  }

  if (response.status === 204 || !raw) {
    return undefined as T;
  }

  return (payload as T) ?? (raw as T);
}

function tryParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export { request };
