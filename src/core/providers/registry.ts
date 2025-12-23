/**
 * Provider Registry - Manages insurance provider registration and lookup
 */

import { InsuranceProvider, InsuranceType } from './types';

class ProviderRegistry {
  private providers = new Map<string, InsuranceProvider>();

  /**
   * Register an insurance provider
   */
  register(provider: InsuranceProvider): void {
    if (this.providers.has(provider.id)) {
      console.warn(`Provider ${provider.id} already registered, overwriting`);
    }
    this.providers.set(provider.id, provider);
  }

  /**
   * Unregister a provider
   */
  unregister(providerId: string): boolean {
    return this.providers.delete(providerId);
  }

  /**
   * Get a provider by ID
   */
  get(id: string): InsuranceProvider {
    const provider = this.providers.get(id);
    if (!provider) {
      throw new Error(`Provider "${id}" not found`);
    }
    return provider;
  }

  /**
   * Check if a provider exists
   */
  has(id: string): boolean {
    return this.providers.has(id);
  }

  /**
   * Get providers that offer a specific product type
   */
  getByProductType(type: InsuranceType): InsuranceProvider[] {
    return Array.from(this.providers.values()).filter((p) =>
      p.products.some((prod) => prod.type === type)
    );
  }

  /**
   * List all registered providers
   */
  listAll(): InsuranceProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get provider IDs
   */
  getProviderIds(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Clear all registered providers
   */
  clear(): void {
    this.providers.clear();
  }

  /**
   * Get count of registered providers
   */
  get size(): number {
    return this.providers.size;
  }
}

// Singleton instance
export const providerRegistry = new ProviderRegistry();

// Export class for testing
export { ProviderRegistry };
