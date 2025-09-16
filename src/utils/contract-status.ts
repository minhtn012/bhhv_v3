/**
 * Centralized contract status management utility
 * Single source of truth for all contract status-related data
 */

// Contract status type definition
export type ContractStatus = 'nhap' | 'cho_duyet' | 'khach_duyet' | 'ra_hop_dong' | 'huy';

// Contract status mappings to Vietnamese text
export const CONTRACT_STATUSES: Record<ContractStatus, string> = {
  'nhap': 'Nháp',
  'cho_duyet': 'Chờ duyệt',
  'khach_duyet': 'Khách duyệt',
  'ra_hop_dong': 'Ra hợp đồng',
  'huy': 'Đã hủy'
};

// Contract status color mappings for UI
export const STATUS_COLORS: Record<ContractStatus, string> = {
  'nhap': 'bg-gray-500/20 text-gray-300',
  'cho_duyet': 'bg-yellow-500/20 text-yellow-300',
  'khach_duyet': 'bg-green-500/20 text-green-300',
  'ra_hop_dong': 'bg-blue-500/20 text-blue-300',
  'huy': 'bg-red-500/20 text-red-300'
};

// Status colors for charts/analytics (hex values)
export const STATUS_CHART_COLORS: Record<ContractStatus, string> = {
  'nhap': '#64748b',
  'cho_duyet': '#eab308',
  'khach_duyet': '#22c55e',
  'ra_hop_dong': '#3b82f6',
  'huy': '#ef4444'
};

/**
 * Get Vietnamese text for a contract status
 * @param status - Contract status key
 * @returns Vietnamese status text or original status if not found
 */
export function getStatusText(status: string): string {
  return CONTRACT_STATUSES[status as ContractStatus] || status;
}

/**
 * Get CSS classes for contract status styling
 * @param status - Contract status key
 * @returns CSS classes string for status badge
 */
export function getStatusColor(status: string): string {
  return STATUS_COLORS[status as ContractStatus] || 'bg-gray-500/20 text-gray-300';
}

/**
 * Get hex color for contract status (for charts)
 * @param status - Contract status key
 * @returns Hex color string
 */
export function getStatusChartColor(status: string): string {
  return STATUS_CHART_COLORS[status as ContractStatus] || '#64748b';
}

/**
 * Check if a status is valid
 * @param status - Status to validate
 * @returns True if status is valid
 */
export function isValidStatus(status: string): status is ContractStatus {
  return status in CONTRACT_STATUSES;
}

/**
 * Get all available statuses
 * @returns Array of all contract status keys
 */
export function getAllStatuses(): ContractStatus[] {
  return Object.keys(CONTRACT_STATUSES) as ContractStatus[];
}