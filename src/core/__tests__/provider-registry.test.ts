/**
 * Provider Registry Unit Tests
 */

import { ProviderRegistry } from '../providers/registry';
import { InsuranceType, type InsuranceProvider, type FormSchema } from '../providers/types';

// Mock provider implementation
const createMockProvider = (
  id: string,
  name: string,
  productTypes: InsuranceType[] = [InsuranceType.VEHICLE]
): InsuranceProvider => ({
  id,
  name,
  products: productTypes.map((type) => ({
    id: type,
    type,
    name: `${name} ${type}`,
    description: `${name} ${type} product`,
    formSchemaPath: `./${type}/schema.json`,
  })),
  testCredentials: jest.fn().mockResolvedValue({ success: true }),
  createContract: jest.fn().mockResolvedValue({ success: true }),
  checkStatus: jest.fn().mockResolvedValue({ success: true }),
  checkPremium: jest.fn().mockResolvedValue({ success: true }),
  getFormSchema: jest.fn().mockResolvedValue({ version: '1.0', sections: [] } as FormSchema),
});

describe('ProviderRegistry', () => {
  let registry: ProviderRegistry;

  beforeEach(() => {
    registry = new ProviderRegistry();
  });

  describe('register', () => {
    it('should register a provider', () => {
      const provider = createMockProvider('test-provider', 'Test Provider');
      registry.register(provider);

      expect(registry.has('test-provider')).toBe(true);
      expect(registry.size).toBe(1);
    });

    it('should overwrite existing provider with same id', () => {
      const provider1 = createMockProvider('test', 'Test 1');
      const provider2 = createMockProvider('test', 'Test 2');

      registry.register(provider1);
      registry.register(provider2);

      expect(registry.size).toBe(1);
      expect(registry.get('test').name).toBe('Test 2');
    });
  });

  describe('get', () => {
    it('should return registered provider', () => {
      const provider = createMockProvider('bhv', 'BHV');
      registry.register(provider);

      const result = registry.get('bhv');
      expect(result).toBe(provider);
    });

    it('should throw error for non-existent provider', () => {
      expect(() => registry.get('non-existent')).toThrow('Provider "non-existent" not found');
    });
  });

  describe('has', () => {
    it('should return true for registered provider', () => {
      registry.register(createMockProvider('test', 'Test'));
      expect(registry.has('test')).toBe(true);
    });

    it('should return false for non-existent provider', () => {
      expect(registry.has('non-existent')).toBe(false);
    });
  });

  describe('unregister', () => {
    it('should remove registered provider', () => {
      registry.register(createMockProvider('test', 'Test'));
      expect(registry.has('test')).toBe(true);

      const result = registry.unregister('test');
      expect(result).toBe(true);
      expect(registry.has('test')).toBe(false);
    });

    it('should return false for non-existent provider', () => {
      const result = registry.unregister('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('getByProductType', () => {
    it('should return providers offering specific product type', () => {
      const vehicleProvider = createMockProvider('vehicle-only', 'Vehicle Only', [
        InsuranceType.VEHICLE,
      ]);
      const healthProvider = createMockProvider('health-only', 'Health Only', [
        InsuranceType.HEALTH,
      ]);
      const multiProvider = createMockProvider('multi', 'Multi', [
        InsuranceType.VEHICLE,
        InsuranceType.HEALTH,
      ]);

      registry.register(vehicleProvider);
      registry.register(healthProvider);
      registry.register(multiProvider);

      const vehicleProviders = registry.getByProductType(InsuranceType.VEHICLE);
      expect(vehicleProviders).toHaveLength(2);
      expect(vehicleProviders.map((p) => p.id)).toContain('vehicle-only');
      expect(vehicleProviders.map((p) => p.id)).toContain('multi');

      const healthProviders = registry.getByProductType(InsuranceType.HEALTH);
      expect(healthProviders).toHaveLength(2);
      expect(healthProviders.map((p) => p.id)).toContain('health-only');
      expect(healthProviders.map((p) => p.id)).toContain('multi');
    });

    it('should return empty array if no providers match', () => {
      registry.register(createMockProvider('vehicle', 'Vehicle', [InsuranceType.VEHICLE]));

      const travelProviders = registry.getByProductType(InsuranceType.TRAVEL);
      expect(travelProviders).toHaveLength(0);
    });
  });

  describe('listAll', () => {
    it('should return all registered providers', () => {
      registry.register(createMockProvider('a', 'A'));
      registry.register(createMockProvider('b', 'B'));
      registry.register(createMockProvider('c', 'C'));

      const all = registry.listAll();
      expect(all).toHaveLength(3);
    });

    it('should return empty array when no providers', () => {
      expect(registry.listAll()).toHaveLength(0);
    });
  });

  describe('getProviderIds', () => {
    it('should return all provider ids', () => {
      registry.register(createMockProvider('alpha', 'Alpha'));
      registry.register(createMockProvider('beta', 'Beta'));

      const ids = registry.getProviderIds();
      expect(ids).toContain('alpha');
      expect(ids).toContain('beta');
    });
  });

  describe('clear', () => {
    it('should remove all providers', () => {
      registry.register(createMockProvider('a', 'A'));
      registry.register(createMockProvider('b', 'B'));

      expect(registry.size).toBe(2);

      registry.clear();
      expect(registry.size).toBe(0);
      expect(registry.listAll()).toHaveLength(0);
    });
  });
});
