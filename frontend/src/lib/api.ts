export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/$/, '');

function getErrorMessageFromBody(body: string) {
  if (!body) {
    return null;
  }

  try {
    const parsed = JSON.parse(body) as { message?: string; error?: string };
    return parsed.message || parsed.error || body;
  } catch {
    return body;
  }
}

export function getApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL);
  }

  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }

  return 'http://localhost:8000';
}

export async function apiFetch(path: string, init?: RequestInit) {
  try {
    return await fetch(`${getApiBaseUrl()}${path}`, init);
  } catch {
    throw new ApiError(
      'Unable to reach the backend service. Make sure the API server is running on port 8000.'
    );
  }
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(path, init);
  const text = await response.text();

  if (!response.ok) {
    throw new ApiError(
      getErrorMessageFromBody(text) ?? `Request failed with status ${response.status}.`,
      response.status
    );
  }

  return (text ? JSON.parse(text) : {}) as T;
}
