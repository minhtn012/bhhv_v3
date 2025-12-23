/**
 * Field Registry - Maps field types to React components
 */

import type { ComponentType } from 'react';
import type { FieldType, FieldComponentProps } from './types';

type FieldComponent = ComponentType<FieldComponentProps<unknown>>;

/**
 * Registry for field type to component mapping
 */
class FieldRegistry {
  private components = new Map<FieldType, FieldComponent>();

  /**
   * Register a component for a field type
   */
  register(type: FieldType, component: FieldComponent): void {
    this.components.set(type, component);
  }

  /**
   * Get component for a field type
   */
  get(type: FieldType): FieldComponent | undefined {
    return this.components.get(type);
  }

  /**
   * Check if a field type has a registered component
   */
  has(type: FieldType): boolean {
    return this.components.has(type);
  }

  /**
   * Get all registered field types
   */
  getRegisteredTypes(): FieldType[] {
    return Array.from(this.components.keys());
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.components.clear();
  }
}

// Singleton instance
export const fieldRegistry = new FieldRegistry();

// Export class for testing
export { FieldRegistry };
