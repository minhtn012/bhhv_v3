/**
 * Insurance Providers - Barrel export
 * Import this file to auto-register all providers with the registry
 */

// Import providers to trigger auto-registration
export { bhvProvider, BhvProvider } from './bhv-online';

// Re-export provider registry for convenience
export { providerRegistry } from '@/core/providers/registry';
