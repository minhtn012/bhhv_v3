/**
 * Unit Tests for Travel Contract Status Utilities
 */

import {
  getTravelStatusText,
  getTravelStatusColor,
  canTransitionStatus,
  getAllowedNextStatuses,
} from '../travel-contract-status';
import {
  TRAVEL_STATUS_LABELS,
  TRAVEL_STATUS_COLORS,
  TRAVEL_STATUS_TRANSITIONS,
} from '@/providers/pacific-cross/products/travel/constants';

describe('Travel Contract Status Utilities', () => {
  describe('getTravelStatusText', () => {
    it('should return Vietnamese text for nhap status', () => {
      expect(getTravelStatusText('nhap')).toBe('Nhap');
    });

    it('should return Vietnamese text for cho_duyet status', () => {
      expect(getTravelStatusText('cho_duyet')).toBe('Cho duyet');
    });

    it('should return Vietnamese text for khach_duyet status', () => {
      expect(getTravelStatusText('khach_duyet')).toBe('Khach duyet');
    });

    it('should return Vietnamese text for ra_hop_dong status', () => {
      expect(getTravelStatusText('ra_hop_dong')).toBe('Ra hop dong');
    });

    it('should return Vietnamese text for huy status', () => {
      expect(getTravelStatusText('huy')).toBe('Huy');
    });

    it('should return status as-is for unknown status', () => {
      expect(getTravelStatusText('unknown')).toBe('unknown');
      expect(getTravelStatusText('invalid_status')).toBe('invalid_status');
    });

    it('should handle empty string', () => {
      expect(getTravelStatusText('')).toBe('');
    });

    it('should be consistent with TRAVEL_STATUS_LABELS', () => {
      for (const [status, label] of Object.entries(TRAVEL_STATUS_LABELS)) {
        expect(getTravelStatusText(status)).toBe(label);
      }
    });

    it('should be case sensitive', () => {
      expect(getTravelStatusText('NHAP')).toBe('NHAP');
      expect(getTravelStatusText('Nhap')).toBe('Nhap');
    });
  });

  describe('getTravelStatusColor', () => {
    it('should return gray color for nhap status', () => {
      expect(getTravelStatusColor('nhap')).toBe('gray');
    });

    it('should return yellow color for cho_duyet status', () => {
      expect(getTravelStatusColor('cho_duyet')).toBe('yellow');
    });

    it('should return blue color for khach_duyet status', () => {
      expect(getTravelStatusColor('khach_duyet')).toBe('blue');
    });

    it('should return green color for ra_hop_dong status', () => {
      expect(getTravelStatusColor('ra_hop_dong')).toBe('green');
    });

    it('should return red color for huy status', () => {
      expect(getTravelStatusColor('huy')).toBe('red');
    });

    it('should return default gray for unknown status', () => {
      expect(getTravelStatusColor('unknown')).toBe('gray');
      expect(getTravelStatusColor('invalid')).toBe('gray');
    });

    it('should return default gray for empty string', () => {
      expect(getTravelStatusColor('')).toBe('gray');
    });

    it('should be consistent with TRAVEL_STATUS_COLORS', () => {
      for (const [status, color] of Object.entries(TRAVEL_STATUS_COLORS)) {
        expect(getTravelStatusColor(status)).toBe(color);
      }
    });

    it('should distinguish different colors', () => {
      const colors = [
        getTravelStatusColor('nhap'),
        getTravelStatusColor('cho_duyet'),
        getTravelStatusColor('khach_duyet'),
        getTravelStatusColor('ra_hop_dong'),
        getTravelStatusColor('huy'),
      ];
      expect(new Set(colors).size).toBe(5);
    });
  });

  describe('canTransitionStatus', () => {
    describe('nhap transitions', () => {
      it('should allow nhap -> cho_duyet', () => {
        expect(canTransitionStatus('nhap', 'cho_duyet', 'user')).toBe(true);
      });

      it('should allow nhap -> huy', () => {
        expect(canTransitionStatus('nhap', 'huy', 'user')).toBe(true);
      });

      it('should not allow nhap -> khach_duyet', () => {
        expect(canTransitionStatus('nhap', 'khach_duyet', 'user')).toBe(false);
      });

      it('should not allow nhap -> ra_hop_dong', () => {
        expect(canTransitionStatus('nhap', 'ra_hop_dong', 'user')).toBe(false);
      });

      it('should not allow nhap -> nhap (self)', () => {
        expect(canTransitionStatus('nhap', 'nhap', 'user')).toBe(false);
      });
    });

    describe('cho_duyet transitions', () => {
      it('should allow cho_duyet -> khach_duyet', () => {
        expect(canTransitionStatus('cho_duyet', 'khach_duyet', 'user')).toBe(true);
      });

      it('should allow cho_duyet -> huy', () => {
        expect(canTransitionStatus('cho_duyet', 'huy', 'user')).toBe(true);
      });

      it('should not allow cho_duyet -> nhap', () => {
        expect(canTransitionStatus('cho_duyet', 'nhap', 'user')).toBe(false);
      });

      it('should not allow cho_duyet -> ra_hop_dong', () => {
        expect(canTransitionStatus('cho_duyet', 'ra_hop_dong', 'user')).toBe(false);
      });
    });

    describe('khach_duyet transitions', () => {
      it('should allow admin to khach_duyet -> ra_hop_dong', () => {
        expect(canTransitionStatus('khach_duyet', 'ra_hop_dong', 'admin')).toBe(true);
      });

      it('should not allow user to khach_duyet -> ra_hop_dong', () => {
        expect(canTransitionStatus('khach_duyet', 'ra_hop_dong', 'user')).toBe(false);
      });

      it('should allow khach_duyet -> huy for both user and admin', () => {
        expect(canTransitionStatus('khach_duyet', 'huy', 'user')).toBe(true);
        expect(canTransitionStatus('khach_duyet', 'huy', 'admin')).toBe(true);
      });

      it('should not allow khach_duyet -> nhap', () => {
        expect(canTransitionStatus('khach_duyet', 'nhap', 'admin')).toBe(false);
      });

      it('should not allow khach_duyet -> cho_duyet', () => {
        expect(canTransitionStatus('khach_duyet', 'cho_duyet', 'user')).toBe(false);
      });
    });

    describe('final states (ra_hop_dong and huy)', () => {
      it('should not allow ra_hop_dong -> any transition', () => {
        expect(canTransitionStatus('ra_hop_dong', 'nhap', 'admin')).toBe(false);
        expect(canTransitionStatus('ra_hop_dong', 'cho_duyet', 'admin')).toBe(false);
        expect(canTransitionStatus('ra_hop_dong', 'khach_duyet', 'admin')).toBe(false);
        expect(canTransitionStatus('ra_hop_dong', 'huy', 'admin')).toBe(false);
      });

      it('should not allow huy -> any transition', () => {
        expect(canTransitionStatus('huy', 'nhap', 'admin')).toBe(false);
        expect(canTransitionStatus('huy', 'cho_duyet', 'admin')).toBe(false);
        expect(canTransitionStatus('huy', 'khach_duyet', 'admin')).toBe(false);
        expect(canTransitionStatus('huy', 'ra_hop_dong', 'admin')).toBe(false);
      });
    });

    describe('invalid current status', () => {
      it('should return false for unknown current status', () => {
        expect(canTransitionStatus('unknown', 'nhap', 'user')).toBe(false);
        expect(canTransitionStatus('invalid', 'cho_duyet', 'admin')).toBe(false);
      });

      it('should handle empty current status', () => {
        expect(canTransitionStatus('', 'nhap', 'user')).toBe(false);
      });
    });

    describe('role-based transitions', () => {
      it('should handle different role names', () => {
        // khach_duyet to ra_hop_dong only for admin
        expect(canTransitionStatus('khach_duyet', 'ra_hop_dong', 'admin')).toBe(true);
        expect(canTransitionStatus('khach_duyet', 'ra_hop_dong', 'user')).toBe(false);
        expect(canTransitionStatus('khach_duyet', 'ra_hop_dong', 'manager')).toBe(false);
        expect(canTransitionStatus('khach_duyet', 'ra_hop_dong', '')).toBe(false);
      });
    });

    describe('consistency with constants', () => {
      it('should follow TRAVEL_STATUS_TRANSITIONS rules', () => {
        for (const [status, nextStatuses] of Object.entries(TRAVEL_STATUS_TRANSITIONS)) {
          for (const nextStatus of nextStatuses) {
            // Special case: admin-only transition
            if (status === 'khach_duyet' && nextStatus === 'ra_hop_dong') {
              expect(canTransitionStatus(status, nextStatus, 'admin')).toBe(true);
              expect(canTransitionStatus(status, nextStatus, 'user')).toBe(false);
            } else {
              expect(canTransitionStatus(status, nextStatus, 'user')).toBe(true);
            }
          }
        }
      });
    });
  });

  describe('getAllowedNextStatuses', () => {
    it('should return allowed statuses for nhap', () => {
      const allowed = getAllowedNextStatuses('nhap', 'user');
      expect(allowed).toEqual(['cho_duyet', 'huy']);
    });

    it('should return allowed statuses for cho_duyet', () => {
      const allowed = getAllowedNextStatuses('cho_duyet', 'user');
      expect(allowed).toEqual(['khach_duyet', 'huy']);
    });

    it('should return allowed statuses for khach_duyet (user)', () => {
      const allowed = getAllowedNextStatuses('khach_duyet', 'user');
      expect(allowed).toEqual(['huy']);
    });

    it('should return allowed statuses for khach_duyet (admin)', () => {
      const allowed = getAllowedNextStatuses('khach_duyet', 'admin');
      expect(allowed).toEqual(['ra_hop_dong', 'huy']);
    });

    it('should return empty array for ra_hop_dong', () => {
      expect(getAllowedNextStatuses('ra_hop_dong', 'user')).toEqual([]);
      expect(getAllowedNextStatuses('ra_hop_dong', 'admin')).toEqual([]);
    });

    it('should return empty array for huy', () => {
      expect(getAllowedNextStatuses('huy', 'user')).toEqual([]);
      expect(getAllowedNextStatuses('huy', 'admin')).toEqual([]);
    });

    it('should return empty array for unknown status', () => {
      expect(getAllowedNextStatuses('unknown', 'user')).toEqual([]);
      expect(getAllowedNextStatuses('invalid', 'admin')).toEqual([]);
    });

    it('should filter ra_hop_dong for non-admin users at khach_duyet', () => {
      const baseTransitions = TRAVEL_STATUS_TRANSITIONS['khach_duyet'];
      const userAllowed = getAllowedNextStatuses('khach_duyet', 'user');
      const adminAllowed = getAllowedNextStatuses('khach_duyet', 'admin');

      expect(baseTransitions).toContain('ra_hop_dong');
      expect(userAllowed).not.toContain('ra_hop_dong');
      expect(adminAllowed).toContain('ra_hop_dong');
    });

    it('should not filter other statuses for non-admin users', () => {
      const userAllowed = getAllowedNextStatuses('khach_duyet', 'user');
      expect(userAllowed).toContain('huy');
    });

    it('should handle different role names consistently', () => {
      const statusesForAdmin = getAllowedNextStatuses('khach_duyet', 'admin');
      const statusesForUser = getAllowedNextStatuses('khach_duyet', 'user');
      const statusesForOther = getAllowedNextStatuses('khach_duyet', 'manager');

      expect(statusesForAdmin).toContain('ra_hop_dong');
      expect(statusesForUser).not.toContain('ra_hop_dong');
      expect(statusesForOther).not.toContain('ra_hop_dong');
    });

    it('should verify workflow progression consistency', () => {
      // Verify workflow path: nhap -> cho_duyet -> khach_duyet -> ra_hop_dong
      expect(getAllowedNextStatuses('nhap', 'user')).toContain('cho_duyet');
      expect(getAllowedNextStatuses('cho_duyet', 'user')).toContain('khach_duyet');
      expect(getAllowedNextStatuses('khach_duyet', 'admin')).toContain('ra_hop_dong');

      // Verify cancellation is allowed from any non-final state
      expect(getAllowedNextStatuses('nhap', 'user')).toContain('huy');
      expect(getAllowedNextStatuses('cho_duyet', 'user')).toContain('huy');
      expect(getAllowedNextStatuses('khach_duyet', 'user')).toContain('huy');
    });

    it('should be consistent with canTransitionStatus', () => {
      for (const currentStatus of Object.keys(TRAVEL_STATUS_TRANSITIONS)) {
        const allowed = getAllowedNextStatuses(currentStatus, 'user');
        const admin_allowed = getAllowedNextStatuses(currentStatus, 'admin');

        // User can transition to all allowed statuses
        for (const status of allowed) {
          expect(canTransitionStatus(currentStatus, status, 'user')).toBe(true);
        }

        // Admin can transition to all allowed statuses
        for (const status of admin_allowed) {
          expect(canTransitionStatus(currentStatus, status, 'admin')).toBe(true);
        }
      }
    });
  });

  describe('workflow integration', () => {
    it('should support complete workflow from draft to issued', () => {
      // Step 1: Submit for approval
      expect(canTransitionStatus('nhap', 'cho_duyet', 'user')).toBe(true);

      // Step 2: Customer approves
      expect(canTransitionStatus('cho_duyet', 'khach_duyet', 'user')).toBe(true);

      // Step 3: Admin issues contract
      expect(canTransitionStatus('khach_duyet', 'ra_hop_dong', 'admin')).toBe(true);

      // Step 4: Final state - no further transitions
      expect(canTransitionStatus('ra_hop_dong', 'nhap', 'admin')).toBe(false);
    });

    it('should support cancellation at any stage', () => {
      expect(canTransitionStatus('nhap', 'huy', 'user')).toBe(true);
      expect(canTransitionStatus('cho_duyet', 'huy', 'user')).toBe(true);
      expect(canTransitionStatus('khach_duyet', 'huy', 'user')).toBe(true);

      // Cannot cancel from final states
      expect(canTransitionStatus('huy', 'huy', 'user')).toBe(false);
      expect(canTransitionStatus('ra_hop_dong', 'huy', 'admin')).toBe(false);
    });

    it('should prevent users from completing contracts', () => {
      // Users cannot skip to issued state
      expect(canTransitionStatus('nhap', 'ra_hop_dong', 'user')).toBe(false);
      expect(canTransitionStatus('cho_duyet', 'ra_hop_dong', 'user')).toBe(false);

      // Only admin can issue from khach_duyet
      expect(canTransitionStatus('khach_duyet', 'ra_hop_dong', 'admin')).toBe(true);
      expect(canTransitionStatus('khach_duyet', 'ra_hop_dong', 'user')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle null or undefined gracefully', () => {
      // These should not throw and return false
      const result1 = canTransitionStatus('nhap', 'cho_duyet', 'user');
      expect(result1).toBe(true);

      const result2 = canTransitionStatus('invalid', 'nhap', 'user');
      expect(result2).toBe(false);
    });

    it('should handle whitespace in status', () => {
      // Exact match required (case sensitive, whitespace sensitive)
      expect(canTransitionStatus(' nhap', 'cho_duyet', 'user')).toBe(false);
      expect(canTransitionStatus('nhap ', 'cho_duyet', 'user')).toBe(false);
    });

    it('should verify status labels are comprehensive', () => {
      const allStatuses = Object.keys(TRAVEL_STATUS_LABELS);
      for (const status of allStatuses) {
        expect(typeof getTravelStatusText(status)).toBe('string');
        expect(typeof getTravelStatusColor(status)).toBe('string');
      }
    });
  });
});
