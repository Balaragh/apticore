const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { body, headers, ...rest } = options;

    const config: RequestInit = {
      credentials: 'include', // Send cookies for session-based auth
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      ...rest,
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);

    if (response.status === 401) {
      // Session expired or not authenticated
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      throw new ApiError('Session expired. Please log in again.', 401);
    }

    if (response.status === 403) {
      throw new ApiError('You do not have permission to perform this action.', 403);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.error?.message || errorData.message || `Request failed with status ${response.status}`;
      throw new ApiError(message, response.status);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    const resData = await response.json();
    return (resData && typeof resData === 'object' && 'data' in resData && resData.data !== undefined)
      ? resData.data
      : resData;
  }

  get<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  put<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  patch<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  delete<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
      // Don't set Content-Type — browser sets multipart boundary
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.error?.message || errorData.message || 'Upload failed';
      throw new ApiError(message, response.status);
    }

    const resData = await response.json();
    return (resData && typeof resData === 'object' && 'data' in resData && resData.data !== undefined)
      ? resData.data
      : resData;
  }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const apiClient = new ApiClient(API_BASE);
