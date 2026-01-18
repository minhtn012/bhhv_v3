/**
 * Pacific Cross API Client
 * Handles authentication and API calls to Pacific Cross portal
 */

import { BaseApiClient, ApiResponse } from '@/core/providers/base-api-client';
import { PACIFIC_CROSS_API } from './products/travel/constants';

export interface PacificCrossAuthResponse {
  success: boolean;
  cookies?: string;
  csrfToken?: string;
  error?: string;
}

export interface PacificCrossQuoteResponse {
  success: boolean;
  certId?: string;       // Format: {number}::{hash}
  certNo?: number;       // Extracted number
  redirectUrl?: string;
  error?: string;
  rawResponse?: unknown;
}

export interface PacificCrossConfirmResponse {
  success: boolean;
  certId?: string;
  error?: string;
  rawResponse?: unknown;
}

export interface PacificCrossHistoryResponse {
  success: boolean;
  historyIds?: Record<string, string>;
  revisions?: Array<{
    user: string;
    key: string;
    field: string;
    old: string | null;
    new: string;
    time: string;
    sort: number;
  }>;
  error?: string;
}

/**
 * Pacific Cross API Client
 */
export class PacificCrossApiClient extends BaseApiClient {
  private static readonly DEFAULT_BASE_URL = 'https://paris.pacificcross.com.vn';
  private static readonly MAX_CSRF_RETRIES = 3;
  private static readonly CSRF_RETRY_DELAY = 1000;

  constructor(baseUrl?: string) {
    super(baseUrl || process.env.PACIFIC_CROSS_BASE_URL || PacificCrossApiClient.DEFAULT_BASE_URL);
  }

  /**
   * Validate that required environment variables are set
   */
  static validateEnv(): { valid: boolean; missing: string[] } {
    const required = ['PACIFIC_CROSS_USERNAME', 'PACIFIC_CROSS_PASSWORD'];
    const missing = required.filter(key => !process.env[key]);
    return { valid: missing.length === 0, missing };
  }

  /**
   * Override to handle multipart/form-data
   */
  protected override getDefaultHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
      'Connection': 'keep-alive',
      'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      'Upgrade-Insecure-Requests': '1',
    };

    if (this.sessionCookies) {
      headers['Cookie'] = this.sessionCookies;
    }

    return headers;
  }

  /**
   * Extract CSRF token from HTML page
   */
  private extractCsrfToken(html: string): string | null {
    // Look for _token input field
    const tokenMatch = html.match(/<input[^>]*name="_token"[^>]*value="([^"]+)"/);
    if (tokenMatch) return tokenMatch[1];

    // Look for meta tag
    const metaMatch = html.match(/<meta[^>]*name="csrf-token"[^>]*content="([^"]+)"/);
    if (metaMatch) return metaMatch[1];

    return null;
  }

  /**
   * Extract cert ID from redirect URL
   * URL format: /cert/{number}::{hash}/edit
   */
  private extractCertIdFromUrl(url: string): { certId: string; certNo: number } | null {
    const match = url.match(/\/cert\/(\d+)::([^/]+)/);
    if (match) {
      return {
        certId: `${match[1]}::${match[2]}`,
        certNo: parseInt(match[1], 10),
      };
    }
    return null;
  }

  /**
   * Authenticate with Pacific Cross portal
   * 1. GET login page to get CSRF token
   * 2. POST login credentials
   */
  async authenticate(username: string, password: string): Promise<ApiResponse<{ cookies?: string }>> {
    // Debug:('🔐 Authenticating with Pacific Cross...');

    try {
      // Step 1: Get login page for CSRF token
      const loginPageResponse = await fetch(`${this.baseUrl}${PACIFIC_CROSS_API.LOGIN_PATH}`, {
        method: 'GET',
        headers: this.getDefaultHeaders(),
        redirect: 'manual',
      });

      // Extract cookies from login page
      const initialCookies = this.parseCookiesFromHeaders(loginPageResponse.headers);
      if (initialCookies) {
        this.sessionCookies = initialCookies;
      }

      const loginPageHtml = await loginPageResponse.text();
      const csrfToken = this.extractCsrfToken(loginPageHtml);

      if (!csrfToken) {
        return {
          success: false,
          error: 'Could not extract CSRF token from login page',
        };
      }

      this.csrfToken = csrfToken;
      // Debug:('📝 CSRF token obtained');

      // Step 2: POST login credentials
      const formData = new URLSearchParams();
      formData.append('_token', csrfToken);
      formData.append('username', username);
      formData.append('password', password);

      const loginResponse = await fetch(`${this.baseUrl}${PACIFIC_CROSS_API.LOGIN_PATH}`, {
        method: 'POST',
        headers: {
          ...this.getDefaultHeaders(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
        redirect: 'manual',
      });

      // Update cookies from response
      const authCookies = this.parseCookiesFromHeaders(loginResponse.headers);
      if (authCookies) {
        this.sessionCookies = authCookies;
      }

      // Check for redirect (success) or error
      const locationHeader = loginResponse.headers.get('location');
      if (loginResponse.status === 302 && locationHeader && !locationHeader.includes('login')) {
        // Debug:('✅ Pacific Cross authentication successful');
        return {
          success: true,
          data: { cookies: this.sessionCookies || undefined },
        };
      }

      // Failed - check for error message
      const responseText = await loginResponse.text();
      return {
        success: false,
        error: 'Login failed - invalid credentials or session expired',
        rawResponse: responseText,
      };

    } catch (error) {
      // Error:('💥 Pacific Cross auth error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Build multipart/form-data body
   */
  private buildMultipartBody(
    data: Record<string, string | undefined>,
    boundary: string
  ): string {
    const parts: string[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;
      parts.push(`------${boundary}\r\n`);
      parts.push(`Content-Disposition: form-data; name="${key}"\r\n\r\n`);
      parts.push(`${value}\r\n`);
    }

    parts.push(`------${boundary}--\r\n`);
    return parts.join('');
  }

  /**
   * Create quote or confirm contract
   * @param payload Form data payload
   * @param isQuote true for quote (is_quote=1), false for confirm (is_quote=0)
   */
  async createCertificate(
    payload: Record<string, string | undefined>,
    isQuote: boolean = true
  ): Promise<PacificCrossQuoteResponse> {
    // Debug:(`📤 Creating ${isQuote ? 'quote' : 'contract'} on Pacific Cross...`);

    try {
      // Ensure we have CSRF token
      if (!this.csrfToken) {
        return {
          success: false,
          error: 'No CSRF token - please authenticate first',
        };
      }

      // Add required fields
      const formPayload = {
        ...payload,
        _token: this.csrfToken,
        is_quote: isQuote ? '1' : '0',
      };

      const boundary = 'WebKitFormBoundary' + Math.random().toString(36).substring(2);
      const body = this.buildMultipartBody(formPayload, boundary);

      const response = await fetch(`${this.baseUrl}${PACIFIC_CROSS_API.CERT_PATH}`, {
        method: 'POST',
        headers: {
          ...this.getDefaultHeaders(),
          'Content-Type': `multipart/form-data; boundary=----${boundary}`,
          'Origin': this.baseUrl,
          'Referer': `${this.baseUrl}/cert/create`,
        },
        body,
        redirect: 'manual',
      });

      // Update cookies
      const newCookies = this.parseCookiesFromHeaders(response.headers);
      if (newCookies) {
        this.sessionCookies = newCookies;
      }

      // Check for redirect (success)
      const locationHeader = response.headers.get('location');
      if (response.status === 302 && locationHeader) {
        const certInfo = this.extractCertIdFromUrl(locationHeader);
        if (certInfo) {
          // Debug:(`✅ Certificate created: ${certInfo.certId}`);
          return {
            success: true,
            certId: certInfo.certId,
            certNo: certInfo.certNo,
            redirectUrl: locationHeader,
          };
        }
      }

      // Failed - parse error from response
      const responseText = await response.text();
      // Error:('❌ Certificate creation failed:', response.status);
      return {
        success: false,
        error: `Creation failed - status ${response.status}`,
        rawResponse: responseText,
      };

    } catch (error) {
      // Error:('💥 Certificate creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get certificate history
   */
  async getCertificateHistory(certId: string): Promise<PacificCrossHistoryResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}${PACIFIC_CROSS_API.CERT_PATH}/${certId}${PACIFIC_CROSS_API.HISTORY_PATH_SUFFIX}`,
        {
          method: 'GET',
          headers: {
            ...this.getDefaultHeaders(),
            'Accept': '*/*',
            'X-Requested-With': 'XMLHttpRequest',
          },
        }
      );

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        historyIds: data.historyIds,
        revisions: data.revisions,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Refresh CSRF token from create page with retry logic
   */
  async refreshCsrfToken(product: number = 2): Promise<boolean> {
    for (let attempt = 1; attempt <= PacificCrossApiClient.MAX_CSRF_RETRIES; attempt++) {
      try {
        const response = await fetch(
          `${this.baseUrl}${PACIFIC_CROSS_API.CERT_PATH}/create?product=${product}`,
          {
            method: 'GET',
            headers: this.getDefaultHeaders(),
          }
        );

        const html = await response.text();
        const token = this.extractCsrfToken(html);

        if (token) {
          this.csrfToken = token;
          return true;
        }

        // Wait before retry
        if (attempt < PacificCrossApiClient.MAX_CSRF_RETRIES) {
          await this.sleep(PacificCrossApiClient.CSRF_RETRY_DELAY * attempt);
        }
      } catch {
        if (attempt < PacificCrossApiClient.MAX_CSRF_RETRIES) {
          await this.sleep(PacificCrossApiClient.CSRF_RETRY_DELAY * attempt);
        }
      }
    }
    return false;
  }
}

// Export default instance
export const pacificCrossApiClient = new PacificCrossApiClient();
