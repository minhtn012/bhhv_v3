/**
 * BHV Online Insurance Provider
 * Implements the InsuranceProvider interface for BHV integration
 */

import {
  InsuranceType,
  type InsuranceProvider,
  type ProviderCredentials,
  type TestCredentialsResult,
  type ContractResponse,
  type StatusResponse,
  type PremiumCheckResponse,
  type ProductDefinition,
  type FormSchema,
} from '@/core/providers/types';
import { BhvApiClient } from './api-client';
import { transformContractToBhvFormat, transformContractToPremiumCheckFormat } from './products/vehicle/mapper';

// Re-export API client for direct usage if needed
export { BhvApiClient, bhvApiClient } from './api-client';

/**
 * BHV Online Insurance Provider Implementation
 */
export class BhvProvider implements InsuranceProvider {
  readonly id = 'bhv-online';
  readonly name = 'BHV Online';

  readonly products: ProductDefinition[] = [
    {
      id: 'vehicle',
      type: InsuranceType.VEHICLE,
      name: 'Bảo hiểm xe cơ giới',
      description: 'Bảo hiểm vật chất xe ô tô và TNDS',
      formSchemaPath: './products/vehicle/schema.json',
    },
  ];

  private apiClient: BhvApiClient;
  private sessionCookies: string | null = null;

  constructor() {
    this.apiClient = new BhvApiClient();
  }

  /**
   * Test provider credentials
   */
  async testCredentials(creds: ProviderCredentials): Promise<TestCredentialsResult> {
    const result = await this.apiClient.authenticate(creds.username, creds.password);

    if (result.success && result.data?.cookies) {
      this.sessionCookies = result.data.cookies;
      return {
        success: true,
        message: 'Đăng nhập BHV thành công',
        sessionData: { cookies: result.data.cookies },
      };
    }

    return {
      success: false,
      message: result.error || 'Đăng nhập BHV thất bại',
    };
  }

  /**
   * Create insurance contract
   */
  async createContract(productId: string, data: unknown): Promise<ContractResponse> {
    if (productId !== 'vehicle') {
      return {
        success: false,
        error: `Product ${productId} not supported`,
      };
    }

    // Transform contract data to BHV format
    const bhvData = transformContractToBhvFormat(data);

    const result = await this.apiClient.submitContract(bhvData, this.sessionCookies || undefined);

    return {
      success: result.success,
      pdfBase64: result.pdfBase64,
      error: result.error,
      rawResponse: result.rawResponse,
    };
  }

  /**
   * Check contract status
   */
  async checkStatus(contractId: string): Promise<StatusResponse> {
    // BHV doesn't have a dedicated status check endpoint
    // Status is tracked internally in our system
    return {
      success: true,
      status: 'unknown',
      details: { contractId, message: 'Status check via internal system' },
    };
  }

  /**
   * Check premium for contract data
   */
  async checkPremium(productId: string, data: unknown): Promise<PremiumCheckResponse> {
    if (productId !== 'vehicle') {
      return {
        success: false,
        error: `Product ${productId} not supported`,
      };
    }

    // Transform contract data to premium check format
    const bhvData = transformContractToPremiumCheckFormat(data);

    const result = await this.apiClient.checkPremium(bhvData, this.sessionCookies || undefined);

    if (result.success && result.htmlData) {
      return {
        success: true,
        htmlData: result.htmlData,
      };
    }

    return {
      success: false,
      error: result.error,
    };
  }

  /**
   * Get form schema for a product
   */
  async getFormSchema(productId: string): Promise<FormSchema> {
    if (productId !== 'vehicle') {
      throw new Error(`Product ${productId} not found`);
    }

    // Dynamic import of schema
    const schema = await import('./products/vehicle/schema.json');
    return schema.default as FormSchema;
  }

  /**
   * Set session cookies (for authenticated operations)
   */
  setSessionCookies(cookies: string): void {
    this.sessionCookies = cookies;
    this.apiClient.setSessionCookies(cookies);
  }

  /**
   * Clear session
   */
  clearSession(): void {
    this.sessionCookies = null;
    this.apiClient.clearSession();
  }
}

// Singleton instance
export const bhvProvider = new BhvProvider();

// Auto-register with provider registry
import { providerRegistry } from '@/core/providers/registry';
providerRegistry.register(bhvProvider);
