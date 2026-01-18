/**
 * Travel Contract Status Utilities
 */

import {
  TRAVEL_STATUS_LABELS,
  TRAVEL_STATUS_COLORS,
  TRAVEL_STATUS_TRANSITIONS
} from '@/providers/pacific-cross/products/travel/constants';

/**
 * Get Vietnamese text for status
 */
export function getTravelStatusText(status: string): string {
  return TRAVEL_STATUS_LABELS[status] || status;
}

/**
 * Get color for status badge
 */
export function getTravelStatusColor(status: string): string {
  return TRAVEL_STATUS_COLORS[status] || 'gray';
}

/**
 * Check if status transition is allowed
 * @param currentStatus Current contract status
 * @param newStatus Target status
 * @param userRole User's role (user/admin)
 * @returns true if transition is allowed
 */
export function canTransitionStatus(
  currentStatus: string,
  newStatus: string,
  userRole: string
): boolean {
  const allowed = TRAVEL_STATUS_TRANSITIONS[currentStatus] || [];

  // Admin required for khach_duyet -> ra_hop_dong
  if (currentStatus === 'khach_duyet' && newStatus === 'ra_hop_dong') {
    return userRole === 'admin';
  }

  return allowed.includes(newStatus);
}

/**
 * Get allowed next statuses for a given status
 */
export function getAllowedNextStatuses(currentStatus: string, userRole: string): string[] {
  const transitions = TRAVEL_STATUS_TRANSITIONS[currentStatus] || [];

  // Filter out ra_hop_dong for non-admin users
  if (currentStatus === 'khach_duyet' && userRole !== 'admin') {
    return transitions.filter(s => s !== 'ra_hop_dong');
  }

  return transitions;
}
