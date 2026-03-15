'use client';

import { getAuth } from 'firebase/auth';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000')
    .replace(/\/+$/, '')
    // Accept either http://host or http://host/api in env config.
    .replace(/\/api$/i, '');

const IS_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

async function getAuthToken(): Promise<string | null> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Core request function
// ---------------------------------------------------------------------------

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Skip auth token injection */
  noAuth?: boolean;
  /** Override base URL for this request */
  baseUrl?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, noAuth, baseUrl, headers: customHeaders, ...fetchOptions } = options;

  const base = baseUrl ?? API_BASE_URL;
  const url = `${base}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  // Inject Firebase auth token
  if (!noAuth) {
    const token = await getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const config: RequestInit = {
    ...fetchOptions,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: fetchOptions.signal ?? AbortSignal.timeout(10_000),
  };

  const response = await fetch(url, config);

  // On 401, sign out via Firebase — onAuthStateChanged fires null,
  // AuthProvider clears the RQ cache, and AppLayout redirects to /login.
  // This avoids a jarring hard redirect on background refetches.
  if (response.status === 401 && typeof window !== 'undefined') {
    import('@/lib/firebase').then(({ auth }) =>
      import('firebase/auth').then(({ signOut }) => {
        if (auth) {
          return signOut(auth).catch(() => {});
        }
        return Promise.resolve();
      })
    );
  }

  // Handle non-OK responses
  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text().catch(() => null);
    }
    const message = (errorData as { message?: string })?.message ?? `HTTP ${response.status}`;
    throw new ApiError(message, response.status, errorData);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Public API client
// ---------------------------------------------------------------------------

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

export { API_BASE_URL, IS_MOCK };
