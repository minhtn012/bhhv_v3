/**
 * Travel Family Plan Validation
 * Validates member composition and age requirements for Family plans
 */

import type { TravelInsuredPerson, FamilyMemberType } from '@/types/travel';

export interface FamilyValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Calculate age at a specific reference date
 * Used to validate age at trip start date
 */
export function calculateAgeAtDate(dob: string, referenceDate: Date): number {
  const birthDate = new Date(dob);
  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = referenceDate.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Validate Family plan member composition and ages
 * @param insuredPersons - List of insured persons with memberType
 * @param referenceDate - Trip start date for age calculation
 */
export function validateFamilyPlan(
  insuredPersons: Array<Partial<TravelInsuredPerson>>,
  referenceDate: Date
): FamilyValidationResult {
  const errors: string[] = [];

  // Count by member type
  const primary = insuredPersons.filter(p => p.memberType === 'MBR_TYPE_A');
  const spouse = insuredPersons.filter(p => p.memberType === 'MBR_TYPE_S');
  const children = insuredPersons.filter(p => p.memberType === 'MBR_TYPE_C');

  // Rule 1: Exactly 1 primary
  if (primary.length === 0) {
    errors.push('Phải có đúng 1 Người chính');
  } else if (primary.length > 1) {
    errors.push('Chỉ được có 1 Người chính');
  }

  // Rule 2: Max 1 spouse
  if (spouse.length > 1) {
    errors.push('Tối đa 1 Vợ/Chồng');
  }

  // Rule 3: Primary must be >= 18
  primary.forEach((p) => {
    if (p.dob) {
      const age = calculateAgeAtDate(p.dob, referenceDate);
      if (age < 18) {
        errors.push(`Người chính phải từ 18 tuổi trở lên (hiện tại: ${age} tuổi)`);
      }
    }
  });

  // Rule 4: Spouse must be >= 18
  spouse.forEach((p) => {
    if (p.dob) {
      const age = calculateAgeAtDate(p.dob, referenceDate);
      if (age < 18) {
        errors.push(`Vợ/Chồng phải từ 18 tuổi trở lên (hiện tại: ${age} tuổi)`);
      }
    }
  });

  // Rule 5: Children must be < 18
  children.forEach((p) => {
    if (p.dob) {
      const age = calculateAgeAtDate(p.dob, referenceDate);
      if (age >= 18) {
        errors.push(`Con "${p.name || 'Chưa có tên'}" phải dưới 18 tuổi (hiện tại: ${age} tuổi)`);
      }
    }
  });

  // Rule 6: Must have at least 2 members for family
  if (insuredPersons.length < 2) {
    errors.push('Gói Gia đình phải có ít nhất 2 người');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get default memberType based on age
 * Used when switching from Individual to Family plan
 */
export function getDefaultMemberType(age: number, existingPrimary: boolean): FamilyMemberType {
  if (age < 18) {
    return 'MBR_TYPE_C';
  }
  if (!existingPrimary) {
    return 'MBR_TYPE_A';
  }
  return 'MBR_TYPE_S';
}
