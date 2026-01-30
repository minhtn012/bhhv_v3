/**
 * Pacific Cross API Client
 * Handles authentication and API calls to Pacific Cross portal
 */

import { BaseApiClient, ApiResponse } from '@/core/providers/base-api-client';
import { PACIFIC_CROSS_API } from './products/travel/constants';
import { logInfo, logDebug, logError as logErr } from '@/lib/errorLogger';

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

  // Store member IDs parsed from edit page (e.g., { id_1: "672282", id_2: "672283" })
  private memberIds: Record<string, string> | null = null;

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
    logInfo('Pacific Cross authentication started', {
      operation: 'PC_AUTH_START',
      additionalInfo: { baseUrl: this.baseUrl, username }
    });

    try {
      // Step 1: Get login page for CSRF token
      const loginUrl = `${this.baseUrl}${PACIFIC_CROSS_API.LOGIN_PATH}`;
      logDebug('PC_AUTH: Fetching login page', { url: loginUrl });

      const loginPageResponse = await fetch(loginUrl, {
        method: 'GET',
        headers: this.getDefaultHeaders(),
        redirect: 'manual',
      });

      logDebug('PC_AUTH: Login page response', {
        status: loginPageResponse.status,
        headers: Object.fromEntries(loginPageResponse.headers.entries())
      });

      // Extract cookies from login page
      const initialCookies = this.parseCookiesFromHeaders(loginPageResponse.headers);
      if (initialCookies) {
        this.sessionCookies = initialCookies;
        logDebug('PC_AUTH: Initial cookies set', { cookieLength: initialCookies.length });
      }

      const loginPageHtml = await loginPageResponse.text();
      const csrfToken = this.extractCsrfToken(loginPageHtml);

      if (!csrfToken) {
        logErr(new Error('CSRF token extraction failed'), {
          operation: 'PC_AUTH_CSRF',
          additionalInfo: { htmlLength: loginPageHtml.length }
        });
        return {
          success: false,
          error: 'Could not extract CSRF token from login page',
        };
      }

      this.csrfToken = csrfToken;
      logDebug('PC_AUTH: CSRF token obtained', { tokenLength: csrfToken.length });

      // Step 2: POST login credentials
      const formData = new URLSearchParams();
      formData.append('_token', csrfToken);
      formData.append('username', username);
      formData.append('password', password);

      logDebug('PC_AUTH: Posting login credentials', { username });

      const loginResponse = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          ...this.getDefaultHeaders(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
        redirect: 'manual',
      });

      logDebug('PC_AUTH: Login response', {
        status: loginResponse.status,
        location: loginResponse.headers.get('location')
      });

      // Update cookies from response
      const authCookies = this.parseCookiesFromHeaders(loginResponse.headers);
      if (authCookies) {
        this.sessionCookies = authCookies;
        logDebug('PC_AUTH: Auth cookies updated', {
        cookieLength: authCookies.length,
        cookieNames: authCookies.split(';').map(c => c.trim().split('=')[0]).filter(Boolean)
      });
      }

      // Check for redirect (success) or error
      const locationHeader = loginResponse.headers.get('location');
      if (loginResponse.status === 302 && locationHeader && !locationHeader.includes('login')) {
        logInfo('Pacific Cross authentication successful', {
          operation: 'PC_AUTH_SUCCESS',
          additionalInfo: { redirectTo: locationHeader }
        });
        return {
          success: true,
          data: { cookies: this.sessionCookies || undefined },
        };
      }

      // Failed - check for error message
      const responseText = await loginResponse.text();
      logErr(new Error('Login failed'), {
        operation: 'PC_AUTH_FAILED',
        additionalInfo: {
          status: loginResponse.status,
          location: locationHeader,
          responseLength: responseText.length
        }
      });
      return {
        success: false,
        error: 'Login failed - invalid credentials or session expired',
        rawResponse: responseText,
      };

    } catch (error) {
      logErr(error, {
        operation: 'PC_AUTH_ERROR',
        additionalInfo: { baseUrl: this.baseUrl }
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Build multipart/form-data body with proper file field handling
   * File fields need to be inserted right after their corresponding input fields
   * Order: input_message_file → message_file (file) | input_import_members → import_members (file)
   */
  private buildMultipartBody(
    data: Record<string, string | undefined>,
    boundary: string
  ): string {
    const parts: string[] = [];

    // File field mappings: after which key to insert the file field
    const fileFieldInsertions: Record<string, string> = {
      'input_message_file': 'message_file',
      'input_import_members': 'import_members',
    };

    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;

      // Add the regular field
      parts.push(`------${boundary}\r\n`);
      parts.push(`Content-Disposition: form-data; name="${key}"\r\n\r\n`);
      parts.push(`${value}\r\n`);

      // Check if we need to insert a file field after this key
      const fileField = fileFieldInsertions[key];
      if (fileField) {
        parts.push(`------${boundary}\r\n`);
        parts.push(`Content-Disposition: form-data; name="${fileField}"; filename=""\r\n`);
        parts.push(`Content-Type: application/octet-stream\r\n\r\n`);
        parts.push(`\r\n`);
      }
    }

    parts.push(`------${boundary}--\r\n`);
    return parts.join('');
  }

  /**
   * Create quote or confirm contract
   * @param payload Form data payload (must include 'product' field)
   * @param isQuote true for quote (is_quote=1), false for confirm (is_quote=0)
   */
  async createCertificate(
    payload: Record<string, string | undefined>,
    isQuote: boolean = true
  ): Promise<PacificCrossQuoteResponse> {
    const operation = isQuote ? 'PC_CREATE_QUOTE' : 'PC_CREATE_CONTRACT';
    const product = payload.product || '2';

    logInfo(`Pacific Cross ${isQuote ? 'quote' : 'contract'} creation started`, {
      operation,
      additionalInfo: { isQuote, payloadKeys: Object.keys(payload) }
    });

    try {
      // Ensure we have CSRF token
      if (!this.csrfToken) {
        logErr(new Error('No CSRF token'), { operation });
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

      logDebug(`${operation}: Building payload`, {
        tokenLength: this.csrfToken.length,
        is_quote: formPayload.is_quote,
        product: formPayload.product,
        plan: formPayload.plan
      });

      const boundary = 'WebKitFormBoundary' + Math.random().toString(36).substring(2);
      const body = this.buildMultipartBody(formPayload, boundary);

      const certUrl = `${this.baseUrl}${PACIFIC_CROSS_API.CERT_PATH}`;

      // Log detailed request info for debugging
      logDebug(`${operation}: Request details`, {
        url: certUrl,
        bodyLength: body.length,
        cookieLength: this.sessionCookies?.length || 0,
        cookieNames: this.sessionCookies?.split(';').map(c => c.trim().split('=')[0]).filter(Boolean),
        csrfTokenLength: this.csrfToken?.length || 0,
        boundaryUsed: `----${boundary}`,
      });

      // Log first 500 chars of body for comparison with curl
      logDebug(`${operation}: Body preview`, {
        bodyPreview: body.substring(0, 500)
      });

      const response = await fetch(certUrl, {
        method: 'POST',
        headers: {
          ...this.getDefaultHeaders(),
          'Content-Type': `multipart/form-data; boundary=----${boundary}`,
          'Origin': this.baseUrl,
          'Referer': `${this.baseUrl}/cert/create?product=${product}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Fetch-User': '?1',
        },
        body,
        redirect: 'manual',
      });

      logDebug(`${operation}: Response received`, {
        status: response.status,
        location: response.headers.get('location'),
        contentType: response.headers.get('content-type')
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
          logInfo(`Pacific Cross ${isQuote ? 'quote' : 'contract'} created successfully`, {
            operation: `${operation}_SUCCESS`,
            additionalInfo: { certId: certInfo.certId, certNo: certInfo.certNo }
          });
          return {
            success: true,
            certId: certInfo.certId,
            certNo: certInfo.certNo,
            redirectUrl: locationHeader,
          };
        }
      }

      // Failed - follow redirect to get error messages
      const responseText = await response.text();

      // If redirected back to create page, follow it to get error messages
      let errorMessages: string[] = [];
      if (locationHeader && locationHeader.includes('/cert/create')) {
        try {
          logDebug(`${operation}: Following redirect to get errors`, { location: locationHeader });
          const errorPageResponse = await fetch(locationHeader, {
            method: 'GET',
            headers: this.getDefaultHeaders(),
          });
          const errorPageHtml = await errorPageResponse.text();

          // Extract error messages from Laravel validation errors
          // Pattern 1: <div class="alert alert-danger">...</div>
          const alertMatch = errorPageHtml.match(/<div[^>]*class="[^"]*alert-danger[^"]*"[^>]*>([\s\S]*?)<\/div>/gi);
          if (alertMatch) {
            errorMessages.push(...alertMatch.map(m => m.replace(/<[^>]+>/g, '').trim()));
          }

          // Pattern 2: <span class="invalid-feedback">...</span>
          const feedbackMatch = errorPageHtml.match(/<span[^>]*class="[^"]*invalid-feedback[^"]*"[^>]*>([\s\S]*?)<\/span>/gi);
          if (feedbackMatch) {
            errorMessages.push(...feedbackMatch.map(m => m.replace(/<[^>]+>/g, '').trim()));
          }

          // Pattern 3: <li> inside error list
          const liMatch = errorPageHtml.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
          if (liMatch && liMatch.length < 20) { // Limit to avoid capturing unrelated lists
            const relevantLis = liMatch.filter(li => li.toLowerCase().includes('error') || li.toLowerCase().includes('invalid'));
            errorMessages.push(...relevantLis.map(m => m.replace(/<[^>]+>/g, '').trim()));
          }

          logDebug(`${operation}: Error messages extracted`, {
            errorCount: errorMessages.length,
            errors: errorMessages.slice(0, 5) // Log first 5 errors
          });
        } catch (e) {
          logDebug(`${operation}: Failed to fetch error page`, { error: e instanceof Error ? e.message : 'Unknown' });
        }
      }

      logErr(new Error('Certificate creation failed'), {
        operation: `${operation}_FAILED`,
        additionalInfo: {
          status: response.status,
          location: locationHeader,
          responsePreview: responseText.substring(0, 500),
          validationErrors: errorMessages
        }
      });
      return {
        success: false,
        error: errorMessages.length > 0 ? errorMessages.join('; ') : `Creation failed - status ${response.status}`,
        rawResponse: responseText,
      };

    } catch (error) {
      logErr(error, {
        operation: `${operation}_ERROR`,
        additionalInfo: { isQuote }
      });
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
    logDebug('PC_CSRF_REFRESH: Starting', {
      product,
      maxRetries: PacificCrossApiClient.MAX_CSRF_RETRIES,
      hasCookies: !!this.sessionCookies,
      cookieNames: this.sessionCookies?.split(';').map(c => c.trim().split('=')[0]).filter(Boolean)
    });

    for (let attempt = 1; attempt <= PacificCrossApiClient.MAX_CSRF_RETRIES; attempt++) {
      try {
        const url = `${this.baseUrl}${PACIFIC_CROSS_API.CERT_PATH}/create?product=${product}`;
        logDebug(`PC_CSRF_REFRESH: Attempt ${attempt}`, { url });

        const response = await fetch(url, {
          method: 'GET',
          headers: this.getDefaultHeaders(),
        });

        logDebug(`PC_CSRF_REFRESH: Response`, { status: response.status, attempt });

        // IMPORTANT: Update cookies from response (server may send new XSRF-TOKEN)
        const newCookies = this.parseCookiesFromHeaders(response.headers);
        if (newCookies) {
          this.sessionCookies = newCookies;
          logDebug('PC_CSRF_REFRESH: Cookies updated', {
            cookieNames: newCookies.split(';').map(c => c.trim().split('=')[0]).filter(Boolean)
          });
        }

        const html = await response.text();
        const token = this.extractCsrfToken(html);

        if (token) {
          this.csrfToken = token;
          logInfo('Pacific Cross CSRF token refreshed', {
            operation: 'PC_CSRF_REFRESH_SUCCESS',
            additionalInfo: { attempt, tokenLength: token.length }
          });
          return true;
        }

        logDebug(`PC_CSRF_REFRESH: Token not found in response`, { attempt, htmlLength: html.length });

        // Wait before retry
        if (attempt < PacificCrossApiClient.MAX_CSRF_RETRIES) {
          await this.sleep(PacificCrossApiClient.CSRF_RETRY_DELAY * attempt);
        }
      } catch (error) {
        logDebug(`PC_CSRF_REFRESH: Error on attempt ${attempt}`, {
          error: error instanceof Error ? error.message : 'Unknown'
        });
        if (attempt < PacificCrossApiClient.MAX_CSRF_RETRIES) {
          await this.sleep(PacificCrossApiClient.CSRF_RETRY_DELAY * attempt);
        }
      }
    }

    logErr(new Error('CSRF token refresh failed after all retries'), {
      operation: 'PC_CSRF_REFRESH_FAILED',
      additionalInfo: { product, attempts: PacificCrossApiClient.MAX_CSRF_RETRIES }
    });
    return false;
  }

  /**
   * Get certificate premium from edit page
   * Parses premium values from HTML input fields (premium_1, premium_2, etc.)
   */
  async getCertificatePremium(certId: string): Promise<{ success: boolean; premium?: number; error?: string }> {
    try {
      const url = `${this.baseUrl}${PACIFIC_CROSS_API.CERT_PATH}/${certId}/edit`;
      logDebug('PC_GET_PREMIUM: Fetching edit page', { url });

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getDefaultHeaders(),
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }

      const html = await response.text();

      // Extract all premium_N values and sum them
      // Pattern: <input id="premium_1" ... value="324000"/>
      const premiumPattern = /id="premium_\d+"[^>]*value="(\d+)"/g;
      let totalPremium = 0;
      let match;
      let count = 0;

      while ((match = premiumPattern.exec(html)) !== null) {
        const value = parseInt(match[1], 10);
        if (!isNaN(value)) {
          totalPremium += value;
          count++;
        }
      }

      if (count > 0) {
        // Also extract policyholder for verification
        const policyholderMatch = html.match(/name="policyholder"[^>]*value="([^"]*)"/);
        const policyholder = policyholderMatch ? policyholderMatch[1] : 'N/A';

        logInfo('PC_GET_PREMIUM: Premium extracted', {
          operation: 'PC_GET_PREMIUM_SUCCESS',
          additionalInfo: { totalPremium, memberCount: count, policyholder }
        });
        return { success: true, premium: totalPremium };
      }

      logDebug('PC_GET_PREMIUM: Premium not found in HTML', { htmlLength: html.length });
      return { success: false, error: 'Premium not found in HTML' };

    } catch (error) {
      logErr(error, { operation: 'PC_GET_PREMIUM_ERROR' });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get CSRF token from certificate edit page
   */
  async refreshCsrfTokenFromEditPage(certId: string): Promise<boolean> {
    try {
      const url = `${this.baseUrl}${PACIFIC_CROSS_API.CERT_PATH}/${certId}/edit`;
      logDebug('PC_CSRF_EDIT: Fetching edit page', { url });

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getDefaultHeaders(),
      });

      // Update cookies
      const newCookies = this.parseCookiesFromHeaders(response.headers);
      if (newCookies) {
        this.sessionCookies = newCookies;
      }

      const html = await response.text();
      const token = this.extractCsrfToken(html);

      if (token) {
        this.csrfToken = token;

        // Parse member IDs from edit page (e.g., id="id_1" value="672282")
        this.memberIds = {};
        const memberIdPattern = /name="id_(\d+)"[^>]*value="(\d+)"/g;
        let match;
        while ((match = memberIdPattern.exec(html)) !== null) {
          const memberIndex = match[1];
          const memberId = match[2];
          this.memberIds[`id_${memberIndex}`] = memberId;
        }

        logDebug('PC_CSRF_EDIT: Token obtained', {
          tokenLength: token.length,
          memberIds: this.memberIds
        });
        return true;
      }

      return false;
    } catch (error) {
      logDebug('PC_CSRF_EDIT: Error', { error: error instanceof Error ? error.message : 'Unknown' });
      return false;
    }
  }

  /**
   * Update existing certificate on Pacific Cross
   * Uses POST with _method=PUT (Laravel convention)
   */
  async updateCertificate(
    certId: string,
    payload: Record<string, string | undefined>
  ): Promise<PacificCrossQuoteResponse> {
    const operation = 'PC_UPDATE_CERT';

    logInfo('Pacific Cross certificate update started', {
      operation,
      additionalInfo: { certId, payloadKeys: Object.keys(payload) }
    });

    try {
      // Get fresh CSRF token from edit page
      const csrfRefreshed = await this.refreshCsrfTokenFromEditPage(certId);
      if (!csrfRefreshed || !this.csrfToken) {
        logErr(new Error('Failed to get CSRF token from edit page'), { operation });
        return {
          success: false,
          error: 'Failed to get CSRF token from edit page',
        };
      }

      // Build payload with _method first (field order matters for Laravel)
      const now = new Date();
      const lastUpdate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      // Create ordered payload - _method must be first
      const formPayload: Record<string, string | undefined> = {
        _method: 'PUT',
        _token: this.csrfToken,
        is_quote: '1',
        last_update: lastUpdate,
      };

      // Add remaining fields from payload (skip fields we already set above)
      for (const [key, value] of Object.entries(payload)) {
        if (key !== '_token' && key !== 'is_quote' && key !== 'last_update') {
          formPayload[key] = value;
        }
      }

      // Add member IDs parsed from edit page (critical for update to work)
      if (this.memberIds) {
        for (const [key, value] of Object.entries(this.memberIds)) {
          formPayload[key] = value;
        }
      }

      logDebug(`${operation}: Building payload`, {
        certId,
        lastUpdate,
        tokenLength: this.csrfToken.length,
        fieldCount: Object.keys(formPayload).length,
        memberIds: this.memberIds,
      });

      const boundary = 'WebKitFormBoundary' + Math.random().toString(36).substring(2);
      const body = this.buildMultipartBody(formPayload, boundary);

      const certUrl = `${this.baseUrl}${PACIFIC_CROSS_API.CERT_PATH}/${certId}`;

      logDebug(`${operation}: Request details`, {
        url: certUrl,
        bodyLength: body.length,
        bodyPreview: body.substring(0, 800),
      });

      const response = await fetch(certUrl, {
        method: 'POST',
        headers: {
          ...this.getDefaultHeaders(),
          'Content-Type': `multipart/form-data; boundary=----${boundary}`,
          'Origin': this.baseUrl,
          'Referer': `${this.baseUrl}${PACIFIC_CROSS_API.CERT_PATH}/${certId}/edit`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Fetch-User': '?1',
        },
        body,
        redirect: 'manual',
      });

      logDebug(`${operation}: Response received`, {
        status: response.status,
        location: response.headers.get('location'),
        headers: Object.fromEntries(response.headers.entries()),
      });

      // Update cookies
      const newCookies = this.parseCookiesFromHeaders(response.headers);
      if (newCookies) {
        this.sessionCookies = newCookies;
      }

      // Check for redirect (success) - redirects back to cert view/edit
      const locationHeader = response.headers.get('location');
      // Extract certNo from certId for comparison (e.g., 306485 from 306485::4nlL9SEOiP)
      const certNo = certId.split('::')[0];

      // Log response body for debugging (302 could be success or validation error)
      const responseText = await response.text();
      const hasValidationErrors = responseText.includes('alert-danger') || responseText.includes('validation-error') || responseText.includes('is-invalid');

      logDebug(`${operation}: Response body analysis`, {
        hasValidationErrors,
        bodyLength: responseText.length,
        // Check for old values still present (validation failed)
        bodyPreview: responseText.substring(0, 500),
      });

      if (response.status === 302 && locationHeader && locationHeader.includes(`/cert/${certNo}`) && !hasValidationErrors) {
        logInfo('Pacific Cross certificate updated successfully', {
          operation: `${operation}_SUCCESS`,
          additionalInfo: { certId, redirectUrl: locationHeader }
        });
        return {
          success: true,
          certId: certId,
          redirectUrl: locationHeader,
        };
      }

      // Failed - log response body for debugging
      logErr(new Error('Certificate update failed'), {
        operation: `${operation}_FAILED`,
        additionalInfo: {
          status: response.status,
          location: locationHeader,
          responsePreview: responseText.substring(0, 1000),
        }
      });

      return {
        success: false,
        error: `Update failed - status ${response.status}`,
        rawResponse: responseText,
      };

    } catch (error) {
      logErr(error, { operation: `${operation}_ERROR` });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Fetch PDF from Pacific Cross with authenticated session
   */
  async fetchPdf(pdfUrl: string): Promise<ApiResponse<ArrayBuffer>> {
    try {
      if (!this.sessionCookies) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(pdfUrl, {
        headers: {
          'Cookie': this.sessionCookies,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/pdf,*/*',
        },
      });

      if (!response.ok) {
        return { success: false, error: `PDF fetch failed: ${response.status}` };
      }

      const buffer = await response.arrayBuffer();
      return { success: true, data: buffer };
    } catch (error) {
      logErr(error, { operation: 'PC_FETCH_PDF_ERROR' });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Export default instance
export const pacificCrossApiClient = new PacificCrossApiClient();
