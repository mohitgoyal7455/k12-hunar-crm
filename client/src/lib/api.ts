const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

if (!API_URL) {
  // Fail loudly in development; a missing value in production would make
  // every request hit the frontend's own origin.
  console.error('VITE_API_URL is not set. Copy client/.env.example to client/.env.');
}

const TOKEN_KEY = 'k12hunar.token';

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable (private mode) — session lasts until reload */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

export interface FieldIssue {
  field: string;
  message: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: FieldIssue[];

  constructor(status: number, code: string, message: string, details?: FieldIssue[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** Called when a protected request returns 401, so the app can log out. */
let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

type Query = Record<string, string | number | undefined | null>;

export function buildQuery(params: Query): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
}

async function send(path: string, { method = 'GET', body, auth = false, signal }: RequestOptions) {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Could not reach the server. Check your connection — if the server was asleep it can take up to a minute to wake up.',
    );
  }

  if (res.ok) return res;

  let payload: { error?: { code?: string; message?: string; details?: FieldIssue[] } } = {};
  try {
    payload = await res.json();
  } catch {
    /* non-JSON error body */
  }

  if (res.status === 401 && auth) {
    tokenStore.clear();
    onUnauthorized?.();
  }

  throw new ApiError(
    res.status,
    payload.error?.code ?? 'HTTP_ERROR',
    payload.error?.message ?? `Request failed (${res.status})`,
    payload.error?.details,
  );
}

export async function apiJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await send(path, options);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function apiBlob(path: string, options: RequestOptions = {}) {
  const res = await send(path, options);
  const disposition = res.headers.get('Content-Disposition') ?? '';
  const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? 'download';
  return { blob: await res.blob(), filename };
}
