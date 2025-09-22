/**
 * BHV API Client - Handle requests to BHV insurance system
 */

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
 * BHV API Client class
 */
export class BhvApiClient {
  private readonly BHV_ENDPOINT = 'https://my.bhv.com.vn/3f2fb62a-662a-4911-afad-d0ec4925f29e';
  private sessionCookies: string | null = null;

  // Headers from captured requests
  private getHeaders(cookie?: string): HeadersInit {
    const cookieToUse = cookie || this.sessionCookies || '4c5234cd-80ac-4deb-ae8e-a79b531f901e=CfDJ8O51rrl%2FT6hIiLxg3JwU5426BMK1as7%2BeHYo%2F607Z9IOpLr7aSRRhewApmJ0Ugiya7K0MqNNKin8%2FTbWlDGEpNRVUcAC3KthZJvf7pD4Bh8NKLYMjpq7cA0ppNVothT1iAPVe%2BVR9YvEyWJui9M0gpTOQ%2BpOYUWVrx1bzCsaysB8';

    return {
      'accept': 'application/json, text/javascript, */*; q=0.01',
      'accept-language': 'en-US,en;q=0.9,vi;q=0.8,lb;q=0.7',
      'content-type': 'application/json; charset=UTF-8',
      'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Linux"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'x-requested-with': 'XMLHttpRequest',
      'cookie': cookieToUse,
      'Referer': 'https://my.bhv.com.vn/'
    };
  }

  /**
   * Parse cookies from response headers
   */
  private parseCookiesFromHeaders(headers: Headers): string {
    const cookies: string[] = [];

    headers.forEach((value, name) => {
      if (name.toLowerCase() === 'set-cookie') {
        // Extract cookie name=value part (before first semicolon)
        const cookiePart = value.split(';')[0];
        if (cookiePart) {
          cookies.push(cookiePart);
        }
      }
    });

    return cookies.join('; ');
  }

  /**
   * Authenticate with BHV API and get session cookies
   */
  async authenticate(username: string, password: string): Promise<BhvAuthResponse> {
    try {
      console.log('🔐 Authenticating with BHV API...');

      const authData = {
        action_name: 'public/user/login',
        data: JSON.stringify({
          total_click: '1',
          account: username,
          password: password
        }),
        d_info: {}
      };

      const response = await fetch(this.BHV_ENDPOINT, {
        method: 'POST',
        headers: {
          'accept': 'application/json, text/javascript, */*; q=0.01',
          'accept-language': 'en-US,en;q=0.9,vi;q=0.8,lb;q=0.7',
          'content-type': 'application/json; charset=UTF-8',
          'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Linux"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'x-requested-with': 'XMLHttpRequest',
          'cookie': '_ga=GA1.1.1701792270.1756137871; _ga_GCQNHXB6V5=GS2.1.s1756137871$o1$g0$t1756138135$j60$l0$h0',
          'Referer': 'https://my.bhv.com.vn/'
        },
        body: JSON.stringify(authData)
      });

      console.log('📡 Auth response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ BHV Auth error:', errorText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
          rawResponse: { status: response.status, text: errorText }
        };
      }

      // Extract cookies from response headers
      const cookies = this.parseCookiesFromHeaders(response.headers);
      if (cookies) {
        this.sessionCookies = cookies;
        console.log('🍪 Authentication cookies obtained:', cookies.substring(0, 50) + '...');
      } else {
        console.log('❌ No cookies found in response headers');
      }

      const responseData = await response.json();
      console.log('📋 Auth response data:', responseData);

      // Check if authentication was successful
      // Success criteria: status_code 200 AND cookies obtained AND data_key exists
      if (responseData.status_code === 200 && cookies && responseData.data_key) {
        console.log('✅ BHV Authentication successful - cookies and session data obtained');
        return {
          success: true,
          cookies: cookies,
          rawResponse: responseData
        };
      } else if (responseData.status_code === 200 && !cookies) {
        console.log('⚠️ BHV returned 200 but no cookies - likely auth failed');
        return {
          success: false,
          error: `Authentication failed: No session cookies received`,
          rawResponse: responseData
        };
      } else {
        return {
          success: false,
          error: `Authentication failed: ${responseData.message || 'Invalid credentials'}`,
          rawResponse: responseData
        };
      }

    } catch (error) {
      console.error('💥 BHV Auth error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown authentication error',
        rawResponse: { error: error }
      };
    }
  }

  /**
   * Get current session cookies
   */
  getSessionCookies(): string | null {
    return this.sessionCookies;
  }

  /**
   * Set session cookies manually
   */
  setSessionCookies(cookies: string): void {
    this.sessionCookies = cookies;
  }

  /**
   * Clear session cookies
   */
  clearSession(): void {
    this.sessionCookies = null;
  }

  /**
   * Confirm contract with BHV API (2-step process)
   */
  async confirmContract(requestData: BhvRequestData, cookie?: string): Promise<BhvConfirmResponse> {
    try {
      console.log('🔄 Starting BHV contract confirmation process...');

      // Step 1: Get sale_code with empty sale_code
      console.log('📋 Step 1: Getting sale_code...');
      const step1Response = await fetch(this.BHV_ENDPOINT, {
        method: 'POST',
        headers: this.getHeaders(cookie),
        body: JSON.stringify(requestData)
      });

      if (!step1Response.ok) {
        const errorText = await step1Response.text();
        console.error('❌ Step 1 failed:', errorText);
        return {
          success: false,
          error: `Step 1 failed - HTTP ${step1Response.status}: ${errorText}`,
          rawResponse: { status: step1Response.status, text: errorText }
        };
      }

      const step1Data = await step1Response.json();
      console.log('📋 Step 1 response:', step1Data);

      if (step1Data.status_code !== 200 || !step1Data.data) {
        return {
          success: false,
          error: `Step 1 failed - Invalid response: ${step1Data.message || 'No sale_code received'}`,
          rawResponse: step1Data
        };
      }

      const saleCode = step1Data.data;
      console.log('✓ Sale code received:', saleCode);

      // Step 2: Confirm with the received sale_code
      console.log('📋 Step 2: Confirming contract with sale_code...');

      // Update request data with sale_code
      const step2RequestData = {
        ...requestData,
        data: JSON.stringify({
          ...JSON.parse(requestData.data),
          sale_code: saleCode
        })
      };

      const step2Response = await fetch(this.BHV_ENDPOINT, {
        method: 'POST',
        headers: this.getHeaders(cookie),
        body: JSON.stringify(step2RequestData)
      });

      if (!step2Response.ok) {
        const errorText = await step2Response.text();
        console.error('❌ Step 2 failed:', errorText);
        return {
          success: false,
          error: `Step 2 failed - HTTP ${step2Response.status}: ${errorText}`,
          rawResponse: { status: step2Response.status, text: errorText }
        };
      }

      const step2Data = await step2Response.json();
      console.log('📋 Step 2 response keys:', Object.keys(step2Data));

      if (step2Data.status_code !== 200) {
        return {
          success: false,
          error: `Step 2 failed - Status ${step2Data.status_code}`,
          rawResponse: step2Data
        };
      }

      // Extract contract number from HTML response
      const htmlData = step2Data.data;
      if (typeof htmlData === 'string') {
        // Extract contract number from HTML using regex
        const contractNumberMatch = htmlData.match(/HVXCG\d+/);
        if (contractNumberMatch) {
          const bhvContractNumber = contractNumberMatch[0];
          console.log('✅ BHV contract confirmation successful:', bhvContractNumber);

          return {
            success: true,
            bhvContractNumber: bhvContractNumber,
            rawResponse: step2Data
          };
        } else {
          console.warn('⚠️ Contract number not found in HTML response');
          return {
            success: false,
            error: 'Contract number not found in response',
            rawResponse: step2Data
          };
        }
      } else {
        return {
          success: false,
          error: 'Invalid HTML response format',
          rawResponse: step2Data
        };
      }

    } catch (error) {
      console.error('💥 BHV contract confirmation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        rawResponse: { error: error }
      };
    }
  }

  /**
   * Submit contract to BHV API
   */
  async submitContract(requestData: BhvRequestData, cookie?: string): Promise<BhvApiResponse> {
    try {
      console.log('🚀 Submitting contract to BHV API...');
      console.log('Request data:', JSON.stringify(requestData, null, 2));

      const response = await fetch(this.BHV_ENDPOINT, {
        method: 'POST',
        headers: this.getHeaders(cookie),
        body: JSON.stringify(requestData)
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ BHV API error:', errorText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
          rawResponse: { status: response.status, text: errorText }
        };
      }

      const responseData = await response.json();
      console.log('📋 BHV API response keys:', Object.keys(responseData));

      // BHV API returns { "data": "base64PDFcontent", "status_code": 200 }
      if (responseData.status_code === 200 && responseData.data) {
        const pdfBase64 = responseData.data;

        // Validate it's actually PDF content
        if (this.isValidPdfBase64(pdfBase64)) {
          return {
            success: true,
            pdfBase64: pdfBase64,
            rawResponse: responseData
          };
        } else {
          console.warn('⚠️ Response data is not valid PDF format');
          return {
            success: false,
            error: 'Invalid PDF content received from BHV API',
            rawResponse: responseData
          };
        }
      }

      // Handle error responses
      if (responseData.status_code && responseData.status_code !== 200) {
        return {
          success: false,
          error: `BHV API error: Status ${responseData.status_code}`,
          rawResponse: responseData
        };
      }

      // Check for other error patterns
      if (responseData.error || responseData.message) {
        return {
          success: false,
          error: responseData.error || responseData.message,
          rawResponse: responseData
        };
      }

      // Unexpected response format
      return {
        success: false,
        error: 'Unexpected response format from BHV API',
        rawResponse: responseData
      };

    } catch (error) {
      console.error('💥 BHV API client error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        rawResponse: { error: error }
      };
    }
  }

  /**
   * Save PDF file from base64 data
   */
  savePdfFromBase64(base64Data: string, filename: string): string {
    try {
      // Remove data URL prefix if present
      const cleanBase64 = base64Data.replace(/^data:application\/pdf;base64,/, '');

      // In Node.js environment, we can save to filesystem
      if (typeof window === 'undefined') {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const fs = require('fs');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const path = require('path');

        const pdfBuffer = Buffer.from(cleanBase64, 'base64');
        const filepath = path.join(process.cwd(), 'public', 'contracts', filename);

        // Ensure directory exists
        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(filepath, pdfBuffer);
        console.log('📄 PDF saved to:', filepath);

        return `/contracts/${filename}`;
      }

      // In browser environment, return data URL
      return `data:application/pdf;base64,${cleanBase64}`;

    } catch {
      throw new Error('Failed to save PDF file');
    }
  }

  /**
   * Check premium for contract (returns HTML response)
   */
  async checkPremium(requestData: BhvRequestData, cookie?: string): Promise<BhvPremiumResponse> {
    try {
      console.log('🔍 Checking premium with BHV API...');
      console.log('Request data:', JSON.stringify(requestData, null, 2));

      const response = await fetch(this.BHV_ENDPOINT, {
        method: 'POST',
        headers: this.getHeaders(cookie),
        body: JSON.stringify(requestData)
      });

      console.log('📡 Premium check response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ BHV premium check error:', errorText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
          rawResponse: { status: response.status, text: errorText }
        };
      }

      const responseData = await response.json();
      console.log('📋 BHV premium response keys:', Object.keys(responseData));

      // For premium check, BHV returns HTML in the "data" field
      if (responseData.status_code === 200 && responseData.data) {
        return {
          success: true,
          htmlData: responseData.data,
          rawResponse: responseData
        };
      }

      // Handle error responses
      if (responseData.status_code && responseData.status_code !== 200) {
        return {
          success: false,
          error: `BHV API error: Status ${responseData.status_code}`,
          rawResponse: responseData
        };
      }

      // Check for other error patterns
      if (responseData.error || responseData.message) {
        return {
          success: false,
          error: responseData.error || responseData.message,
          rawResponse: responseData
        };
      }

      // Unexpected response format
      return {
        success: false,
        error: 'Unexpected response format from BHV API',
        rawResponse: responseData
      };

    } catch (error) {
      console.error('💥 BHV premium check error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        rawResponse: { error: error }
      };
    }
  }

  /**
   * Validate PDF base64 data
   */
  isValidPdfBase64(base64Data: string): boolean {
    try {
      const cleanBase64 = base64Data.replace(/^data:application\/pdf;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');

      // Check PDF header (should start with %PDF)
      const pdfHeader = buffer.slice(0, 4).toString();
      return pdfHeader === '%PDF';

    } catch (error) {
      return false;
    }
  }
}

// Export default instance
export const bhvApiClient = new BhvApiClient();