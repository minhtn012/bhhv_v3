/**
 * Base API Client - Shared HTTP utilities for insurance providers
 * Provides cookie management, retry logic, and CSRF token handling
 */

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  rawResponse?: unknown;
}

const DEFAULT_TIMEOUT = 30000;
const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000;

/**
 * Base API Client with common functionality for all providers
 */
export abstract class BaseApiClient {
  protected baseUrl: string;
  protected sessionCookies: string | null = null;
  protected csrfToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get default headers for requests
   */
  protected getDefaultHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'accept': 'application/json, text/javascript, */*; q=0.01',
      'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
      'content-type': 'application/json; charset=UTF-8',
      'x-requested-with': 'XMLHttpRequest',
    };

    if (this.sessionCookies) {
      headers['cookie'] = this.sessionCookies;
    }

    if (this.csrfToken) {
      headers['x-csrf-token'] = this.csrfToken;
    }

    return headers;
  }

  /**
   * Parse cookies from response headers
   */
  protected parseCookiesFromHeaders(headers: Headers): string {
    const cookies: string[] = [];
    headers.forEach((value, name) => {
      if (name.toLowerCase() === 'set-cookie') {
        const cookiePart = value.split(';')[0];
        if (cookiePart) {
          cookies.push(cookiePart);
        }
      }
    });
    return cookies.join('; ');
  }

  /**
   * Set session cookies
   */
  setSessionCookies(cookies: string): void {
    this.sessionCookies = cookies;
  }

  /**
   * Get current session cookies
   */
  getSessionCookies(): string | null {
    return this.sessionCookies;
  }

  /**
   * Clear session
   */
  clearSession(): void {
    this.sessionCookies = null;
    this.csrfToken = null;
  }

  /**
   * Set CSRF token
   */
  setCsrfToken(token: string): void {
    this.csrfToken = token;
  }

  /**
   * Sleep utility for retry delay
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Make HTTP request with retry logic and exponential backoff
   */
  protected async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'POST',
      headers = {},
      body,
      timeout = DEFAULT_TIMEOUT,
      retries = DEFAULT_RETRIES,
      retryDelay = DEFAULT_RETRY_DELAY,
    } = config;

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method,
          headers: { ...this.getDefaultHeaders(), ...headers },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Update cookies from response
        const newCookies = this.parseCookiesFromHeaders(response.headers);
        if (newCookies) {
          this.sessionCookies = newCookies;
        }

        if (!response.ok) {
          const errorText = await response.text();
          return {
            success: false,
            error: `HTTP ${response.status}: ${errorText}`,
            statusCode: response.status,
          };
        }

        const data = await response.json();
        return {
          success: true,
          data: data as T,
          statusCode: response.status,
          rawResponse: data,
        };
      } catch (error) {
        lastError = error as Error;

        // Don't retry on abort/timeout
        if (error instanceof Error && error.name === 'AbortError') {
          return {
            success: false,
            error: 'Request timeout',
          };
        }

        // Exponential backoff for retries
        if (attempt < retries) {
          const delay = retryDelay * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Request failed after retries',
    };
  }

  /**
   * Abstract method for provider-specific authentication
   */
  abstract authenticate(
    username: string,
    password: string
  ): Promise<ApiResponse<{ cookies?: string }>>;
}
