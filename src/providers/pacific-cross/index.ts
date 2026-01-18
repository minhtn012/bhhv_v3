/**
 * Pacific Cross Provider
 * Auto-registers with provider registry
 */

import { providerRegistry } from '@/core/providers/registry';
import type { InsuranceProvider, InsuranceType, ProductDefinition } from '@/core/providers/types';
import { PacificCrossApiClient } from './api-client';

const products: ProductDefinition[] = [
  {
    id: 'travel',
    name: 'Bao hiem Du lich',
    type: 'travel' as InsuranceType,
    description: 'Bao hiem du lich quoc te va noi dia',
    formSchemaPath: '/schemas/pacific-cross/travel.json',
  },
];

const pacificCrossProvider: InsuranceProvider = {
  id: 'pacific-cross',
  name: 'Pacific Cross',
  products,

  async testCredentials(credentials) {
    const client = new PacificCrossApiClient();
    const result = await client.authenticate(
      credentials.username,
      credentials.password
    );

    return {
      success: result.success,
      message: result.success
        ? 'Ket noi thanh cong'
        : result.error || 'Ket noi that bai',
    };
  },

  async getFormSchema(productId: string) {
    // Return travel form schema
    // Implementation details in phase 5
    return {
      version: '1.0',
      sections: [],
    };
  },

  async checkPremium(productId: string, data: unknown) {
    // Premium checking not implemented for Pacific Cross
    // Premium is calculated by Pacific Cross portal
    return {
      success: false,
      error: 'Premium check not available for Pacific Cross',
    };
  },

  async createContract(productId: string, data: unknown) {
    // Contract creation via API client
    // Implementation handled by API routes
    return {
      success: false,
      error: 'Use API routes for contract creation',
    };
  },

  async checkStatus(contractId: string) {
    // Status check not implemented for Pacific Cross
    return {
      success: false,
      error: 'Status check not available for Pacific Cross',
    };
  },
};

// Auto-register
providerRegistry.register(pacificCrossProvider);

export { pacificCrossProvider, PacificCrossApiClient };
