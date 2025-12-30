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
import { mapHealthToBhvFormat } from './products/health/mapper';
import type { HealthBhvCreateResponse, HealthBhvConfirmResponse } from './products/health/types';

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
    {
      id: 'health',
      type: InsuranceType.HEALTH,
      name: 'Bảo hiểm sức khỏe',
      description: 'Bảo hiểm chăm sóc sức khỏe cá nhân',
      formSchemaPath: './products/health/schema.json',
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
    if (productId === 'vehicle') {
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

    if (productId === 'health') {
      // Health uses 2-step flow: create (saleCode="") then confirm (saleCode="{UUID}")
      const bhvData = mapHealthToBhvFormat(data as Parameters<typeof mapHealthToBhvFormat>[0], '');
      const result = await this.apiClient.submitHealthContract(bhvData, this.sessionCookies || undefined);

      return {
        success: result.success,
        error: result.error,
        rawResponse: result.rawResponse,
      };
    }

    return {
      success: false,
      error: `Product ${productId} not supported`,
    };
  }

  /**
   * Create health contract (Step 1 - get saleCode and preview)
   */
  async createHealthContract(data: unknown): Promise<HealthBhvCreateResponse> {
    const bhvData = mapHealthToBhvFormat(data as Parameters<typeof mapHealthToBhvFormat>[0], '');
    return await this.apiClient.submitHealthContract(bhvData, this.sessionCookies || undefined);
  }

  /**
   * Confirm health contract (Step 2 - with saleCode)
   */
  async confirmHealthContract(data: unknown, saleCode: string): Promise<HealthBhvConfirmResponse> {
    const bhvData = mapHealthToBhvFormat(data as Parameters<typeof mapHealthToBhvFormat>[0], saleCode);
    return await this.apiClient.confirmHealthContract(bhvData, this.sessionCookies || undefined);
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
    if (productId === 'vehicle') {
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

    if (productId === 'health') {
      // Health product: premium is input by user, not calculated by BHV
      // Return success with no premium data (user provides total_premium)
      return {
        success: true,
        premiumData: undefined,
      };
    }

    return {
      success: false,
      error: `Product ${productId} not supported`,
    };
  }

  /**
   * Get form schema for a product
   */
  async getFormSchema(productId: string): Promise<FormSchema> {
    if (productId === 'vehicle') {
      const schema = await import('./products/vehicle/schema.json');
      return schema.default as FormSchema;
    }

    if (productId === 'health') {
      const schema = await import('./products/health/schema.json');
      return schema.default as FormSchema;
    }

    throw new Error(`Product ${productId} not found`);
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
