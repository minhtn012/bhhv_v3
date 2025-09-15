/**
 * BHV API Client - Handle requests to BHV insurance system
 */

export interface BhvApiResponse {
  success: boolean;
  contractNumber?: string;
  pdfBase64?: string;
  error?: string;
  rawResponse?: any;
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

  // Headers from captured requests
  private getHeaders(cookie?: string): HeadersInit {
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
      'cookie': cookie || '4c5234cd-80ac-4deb-ae8e-a79b531f901e=CfDJ8O51rrl%2FT6hIiLxg3JwU5426BMK1as7%2BeHYo%2F607Z9IOpLr7aSRRhewApmJ0Ugiya7K0MqNNKin8%2FTbWlDGEpNRVUcAC3KthZJvf7pD4Bh8NKLYMjpq7cA0ppNVothT1iAPVe%2BVR9YvEyWJui9M0gpTOQ%2BpOYUWVrx1bzCsaysB8',
      'Referer': 'https://my.bhv.com.vn/bao-hiem-xe-co-gioi'
    };
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
        const fs = require('fs');
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

    } catch (error) {
      console.error('❌ Error saving PDF:', error);
      throw new Error('Failed to save PDF file');
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