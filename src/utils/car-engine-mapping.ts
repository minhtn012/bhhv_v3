/**
 * Mapping từ car_type (từ database) sang engine type value (từ car_type_engine.json)
 */

export const ENGINE_TYPE_VALUES = {
  ICE: '31cd6b1d-39a6-42d5-9c5f-13f44ad1a8a9', // Động cơ đốt trong (Xăng, dầu)
  HYBRID: '2cdc787a-207b-4e8c-b56d-ae016f1c2c94', // Động cơ Hybrid (Xăng, điện)
  EV: '5d3e3af7-ab75-4e57-a952-c815e40adf31' // Động cơ điện
} as const;

/**
 * Convert car_type from database to engine type value for form
 */
export function getEngineTypeFromCarType(carType?: string): string {
  if (!carType) return '';
  
  switch (carType.toUpperCase()) {
    case 'EV':
      return ENGINE_TYPE_VALUES.EV;
    case 'HYBRID':
      return ENGINE_TYPE_VALUES.HYBRID;
    case 'ICE':
      return ENGINE_TYPE_VALUES.ICE;
    default:
      return '';
  }
}

/**
 * Check if a car type is electric or hybrid (requires battery value field)
 */
export function requiresBatteryValue(carType?: string): boolean {
  if (!carType) return false;
  
  const type = carType.toUpperCase();
  return type === 'EV' || type === 'HYBRID';
}