/**
 * Field Registry Unit Tests
 */

import { FieldRegistry } from '../forms/field-registry';
import type { FieldComponentProps } from '../forms/types';

// Mock component
const MockTextComponent = (props: FieldComponentProps) => null;
const MockSelectComponent = (props: FieldComponentProps) => null;
const MockCustomComponent = (props: FieldComponentProps) => null;

describe('FieldRegistry', () => {
  let registry: FieldRegistry;

  beforeEach(() => {
    registry = new FieldRegistry();
  });

  describe('register', () => {
    it('should register a component for a field type', () => {
      registry.register('text', MockTextComponent as any);

      expect(registry.has('text')).toBe(true);
    });

    it('should overwrite existing component for same type', () => {
      registry.register('text', MockTextComponent as any);
      registry.register('text', MockSelectComponent as any);

      expect(registry.get('text')).toBe(MockSelectComponent);
    });
  });

  describe('get', () => {
    it('should return registered component', () => {
      registry.register('text', MockTextComponent as any);

      const component = registry.get('text');
      expect(component).toBe(MockTextComponent);
    });

    it('should return undefined for unregistered type', () => {
      const component = registry.get('text');
      expect(component).toBeUndefined();
    });
  });

  describe('has', () => {
    it('should return true for registered type', () => {
      registry.register('select', MockSelectComponent as any);
      expect(registry.has('select')).toBe(true);
    });

    it('should return false for unregistered type', () => {
      expect(registry.has('select')).toBe(false);
    });
  });

  describe('getRegisteredTypes', () => {
    it('should return all registered field types', () => {
      registry.register('text', MockTextComponent as any);
      registry.register('select', MockSelectComponent as any);
      registry.register('custom', MockCustomComponent as any);

      const types = registry.getRegisteredTypes();
      expect(types).toContain('text');
      expect(types).toContain('select');
      expect(types).toContain('custom');
      expect(types).toHaveLength(3);
    });

    it('should return empty array when no components registered', () => {
      expect(registry.getRegisteredTypes()).toHaveLength(0);
    });
  });

  describe('clear', () => {
    it('should remove all registered components', () => {
      registry.register('text', MockTextComponent as any);
      registry.register('select', MockSelectComponent as any);

      expect(registry.getRegisteredTypes()).toHaveLength(2);

      registry.clear();

      expect(registry.getRegisteredTypes()).toHaveLength(0);
      expect(registry.has('text')).toBe(false);
      expect(registry.has('select')).toBe(false);
    });
  });
});
