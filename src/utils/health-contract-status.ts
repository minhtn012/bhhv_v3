/**
 * Health Contract Status Utility
 * Reuses vehicle contract status patterns
 */

import {
  type ContractStatus,
  CONTRACT_STATUSES,
  STATUS_COLORS,
  STATUS_CHART_COLORS,
} from './contract-status';

// Re-export base types for health contracts
export type HealthContractStatus = ContractStatus;

/**
 * Get Vietnamese text for a health contract status
 * @param status - Contract status key
 * @returns Vietnamese status text or original status if not found
 */
export function getHealthStatusText(status: string): string {
  return CONTRACT_STATUSES[status as ContractStatus] || status;
}

/**
 * Get CSS classes for health contract status styling
 * @param status - Contract status key
 * @returns CSS classes string for status badge
 */
export function getHealthStatusColor(status: string): string {
  return STATUS_COLORS[status as ContractStatus] || 'bg-gray-500/20 text-gray-300';
}

/**
 * Get hex color for health contract status (for charts)
 * @param status - Contract status key
 * @returns Hex color string
 */
export function getHealthStatusChartColor(status: string): string {
  return STATUS_CHART_COLORS[status as ContractStatus] || '#64748b';
}
