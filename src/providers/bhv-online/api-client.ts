/**
 * BHV Online API Client - Extends base client with BHV-specific functionality
 * Migrated from src/lib/bhvApiClient.ts
 */

import { BaseApiClient, ApiResponse } from '@/core/providers/base-api-client';

export interface BhvApiResponse {
  success: boolean;
  contractNumber?: string;
  pdfBase64?: string;
  error?: string;
  rawResponse?: unknown;
}

export interface BhvPremiumResponse {
  success: boolean;
  htmlData?: string;
  error?: string;
  rawResponse?: unknown;
}

export interface BhvConfirmResponse {
  success: boolean;
  bhvContractNumber?: string;
  error?: string;
  rawResponse?: unknown;
}

export interface BhvAuthResponse {
  success: boolean;
  cookies?: string;
  error?: string;
  rawResponse?: unknown;
}

export interface BhvRequestData {
  action_name: string;
  data: string;
  d_info: object;
}

/**
 * BHV Online API Client
 */
export class BhvApiClient extends BaseApiClient {
  private static readonly ENDPOINT = 'https://my.bhv.com.vn/3f2fb62a-662a-4911-afad-d0ec4925f29e';

  constructor() {
    super(BhvApiClient.ENDPOINT);
  }

  /**
   * Get BHV-specific headers
   */
  protected override getDefaultHeaders(): Record<string, string> {
    const headers = super.getDefaultHeaders();
    return {
      ...headers,
      'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Linux"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'Referer': 'https://my.bhv.com.vn/',
    };
  }

  /**
   * Authenticate with BHV API
   */
  async authenticate(
    username: string,
    password: string
  ): Promise<ApiResponse<{ cookies?: string }>> {
    console.log('🔐 Authenticating with BHV API...');

    const authData = {
      action_name: 'public/user/login',
      data: JSON.stringify({
        total_click: '1',
        account: username,
        password: password,
      }),
      d_info: {},
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.getDefaultHeaders(),
        body: JSON.stringify(authData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }

      // Extract cookies from response
      const cookies = this.parseCookiesFromHeaders(response.headers);
      if (cookies) {
        this.setSessionCookies(cookies);
      }

      const responseData = await response.json();

      if (responseData.status_code === 200 && cookies && responseData.data_key) {
        console.log('✅ BHV Authentication successful');
        return {
          success: true,
          data: { cookies },
          rawResponse: responseData,
        };
      }

      return {
        success: false,
        error: responseData.message || 'Authentication failed',
        rawResponse: responseData,
      };
    } catch (error) {
      console.error('💥 BHV Auth error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Submit contract to BHV API (get PDF)
   */
  async submitContract(
    requestData: BhvRequestData,
    cookie?: string
  ): Promise<BhvApiResponse> {
    if (cookie) {
      this.setSessionCookies(cookie);
    }

    const result = await this.request<{ status_code: number; data: string; message?: string }>(
      '',
      {
        method: 'POST',
        body: requestData,
      }
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        rawResponse: result.rawResponse,
      };
    }

    const data = result.data;
    if (data?.status_code === 200 && data.data) {
      if (this.isValidPdfBase64(data.data)) {
        return {
          success: true,
          pdfBase64: data.data,
          rawResponse: data,
        };
      }
      return {
        success: false,
        error: 'Invalid PDF content',
        rawResponse: data,
      };
    }

    return {
      success: false,
      error: data?.message || 'Unexpected response',
      rawResponse: data,
    };
  }

  /**
   * Confirm contract with BHV API (2-step process)
   */
  async confirmContract(
    requestData: BhvRequestData,
    cookie?: string
  ): Promise<BhvConfirmResponse> {
    if (cookie) {
      this.setSessionCookies(cookie);
    }

    const result = await this.request<{ status_code: number; data: string; message?: string }>(
      '',
      {
        method: 'POST',
        body: requestData,
      }
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        rawResponse: result.rawResponse,
      };
    }

    const data = result.data;
    if (data?.status_code !== 200 || !data.data) {
      return {
        success: false,
        error: data?.message || 'No sale_code received',
        rawResponse: data,
      };
    }

    // Extract contract number from HTML
    const htmlData = data.data;
    if (typeof htmlData === 'string') {
      const contractNumberMatch = htmlData.match(/HVXCG\d+/);
      if (contractNumberMatch) {
        return {
          success: true,
          bhvContractNumber: contractNumberMatch[0],
          rawResponse: htmlData,
        };
      }
    }

    return {
      success: false,
      error: 'Contract number not found in response',
      rawResponse: htmlData,
    };
  }

  /**
   * Check premium for contract
   */
  async checkPremium(
    requestData: BhvRequestData,
    cookie?: string
  ): Promise<BhvPremiumResponse> {
    if (cookie) {
      this.setSessionCookies(cookie);
    }

    const result = await this.request<{ status_code: number; data: string; message?: string }>(
      '',
      {
        method: 'POST',
        body: requestData,
      }
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        rawResponse: result.rawResponse,
      };
    }

    const data = result.data;
    if (data?.status_code === 200 && data.data) {
      return {
        success: true,
        htmlData: data.data,
        rawResponse: data,
      };
    }

    return {
      success: false,
      error: data?.message || 'Unexpected response',
      rawResponse: data,
    };
  }

  /**
   * Submit health contract to BHV API (Step 1 - Create/Preview)
   * Returns saleCode and HTML preview
   */
  async submitHealthContract(
    requestData: BhvRequestData,
    cookie?: string
  ): Promise<{
    success: boolean;
    saleCode?: string;
    htmlPreview?: string;
    error?: string;
    rawResponse?: unknown;
  }> {
    if (cookie) {
      this.setSessionCookies(cookie);
    }

    // Log curl command for debugging
    const headers = this.getDefaultHeaders();
    const bodyJson = JSON.stringify(requestData);
    console.log('\n🔍 === BHV Health Contract Submit - CURL Debug ===');
    console.log(`curl -X POST '${this.baseUrl}' \\`);
    Object.entries(headers).forEach(([key, value]) => {
      console.log(`  -H '${key}: ${value}' \\`);
    });
    if (this.sessionCookies) {
      console.log(`  -H 'Cookie: ${this.sessionCookies}' \\`);
    }
    console.log(`  -d '${bodyJson}'`);
    console.log('=== END CURL Debug ===\n');

    const result = await this.request<{ status_code: number; data: string; message?: string }>(
      '',
      {
        method: 'POST',
        body: requestData,
      }
    );

    // Log raw response for debugging
    console.log('\n📦 === BHV Health Contract Response ===');
    console.log('Success:', result.success);
    console.log('Raw Response:', JSON.stringify(result.rawResponse, null, 2));
    if (result.error) {
      console.log('Error:', result.error);
    }
    console.log('=== END Response ===\n');

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        rawResponse: result.rawResponse,
      };
    }

    const data = result.data as { status_code: number; data: string; data_type?: string; message?: string };

    // Step 1 success: status_code 100 with data_type "yesno" - data contains sale_code UUID directly
    if (data?.status_code === 100 && data?.data_type === 'yesno' && data.data) {
      return {
        success: true,
        saleCode: data.data, // UUID directly from response
        rawResponse: data,
      };
    }

    // Fallback: status_code 200 (legacy handling)
    if (data?.status_code === 200 && data.data) {
      const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
      const matches = typeof data.data === 'string' ? data.data.match(uuidPattern) : null;
      return {
        success: true,
        saleCode: matches ? matches[0] : undefined,
        htmlPreview: typeof data.data === 'string' ? data.data : undefined,
        rawResponse: data,
      };
    }

    return {
      success: false,
      error: data?.message || 'Unexpected response',
      rawResponse: data,
    };
  }

  /**
   * Confirm health contract with BHV API (Step 2 - with saleCode)
   * Returns contract number
   */
  async confirmHealthContract(
    requestData: BhvRequestData,
    cookie?: string
  ): Promise<{
    success: boolean;
    contractNumber?: string;
    error?: string;
    rawResponse?: unknown;
  }> {
    if (cookie) {
      this.setSessionCookies(cookie);
    }

    const result = await this.request<{ status_code: number; data: string; message?: string }>(
      '',
      {
        method: 'POST',
        body: requestData,
      }
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        rawResponse: result.rawResponse,
      };
    }

    const data = result.data;
    if (data?.status_code !== 200 || !data.data) {
      return {
        success: false,
        error: data?.message || 'No response data',
        rawResponse: data,
      };
    }

    // Extract contract number from HTML response (pattern: HV*** followed by digits)
    const htmlData = data.data;
    if (typeof htmlData === 'string') {
      const contractPattern = /HV[A-Z]{2,3}\d+/gi;
      const matches = htmlData.match(contractPattern);
      if (matches) {
        return {
          success: true,
          contractNumber: matches[0],
          rawResponse: htmlData,
        };
      }
    }

    return {
      success: false,
      error: 'Contract number not found in response',
      rawResponse: htmlData,
    };
  }

  /**
   * Validate PDF base64 data
   */
  private isValidPdfBase64(base64Data: string): boolean {
    try {
      const cleanBase64 = base64Data.replace(/^data:application\/pdf;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      const pdfHeader = buffer.slice(0, 4).toString();
      return pdfHeader === '%PDF';
    } catch {
      return false;
    }
  }

  /**
   * Save PDF from base64 data
   */
  savePdfFromBase64(base64Data: string, filename: string): string {
    try {
      const cleanBase64 = base64Data.replace(/^data:application\/pdf;base64,/, '');

      if (typeof window === 'undefined') {
        // Node.js environment
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const fs = require('fs');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const path = require('path');

        const pdfBuffer = Buffer.from(cleanBase64, 'base64');
        const filepath = path.join(process.cwd(), 'public', 'contracts', filename);

        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(filepath, pdfBuffer);
        console.log('📄 PDF saved to:', filepath);

        return `/contracts/${filename}`;
      }

      // Browser environment
      return `data:application/pdf;base64,${cleanBase64}`;
    } catch {
      throw new Error('Failed to save PDF file');
    }
  }
}

// Export default instance for backward compatibility
export const bhvApiClient = new BhvApiClient();
