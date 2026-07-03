/**
 * Minimal API client — fetches from Laravel backend.
 *
 * After Scribe generates OpenAPI, this file will be replaced (partially) by
 * auto-generated TypeScript types + SDK methods in `src/generated/`.
 *
 * For now, a thin manual wrapper keeps apps unblocked.
 */

export type ApiClientConfig = {
  baseUrl: string;
  getAuthToken?: () => string | null | Promise<string | null>;
  onUnauthorized?: () => void;
};

export class MyPosApiClient {
  constructor(private config: ApiClientConfig) {}

  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = await this.config.getAuthToken?.();
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${this.config.baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (response.status === 401) {
      this.config.onUnauthorized?.();
      throw new ApiError('Unauthorized', 401);
    }

    if (!response.ok) {
      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }
      throw new ApiError(`HTTP ${response.status}`, response.status, errorBody);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
