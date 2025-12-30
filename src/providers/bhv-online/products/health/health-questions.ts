/**
 * BHV Health Insurance Questions Definitions
 * 5 health questions with Vietnamese labels and conditional text fields
 */

import { HEALTH_QUESTIONS } from './constants';

export interface HealthQuestionDefinition {
  id: string;
  code: string;
  label: string;
  description: string;
  yesOption: string;
  noOption: string;
  textField: string;
  textPlaceholder: string;
}

/**
 * Health Questions Array
 * Each question requires yes/no answer with conditional text input
 */
export const HEALTH_QUESTION_DEFINITIONS: HealthQuestionDefinition[] = [
  {
    id: HEALTH_QUESTIONS.Q1_HOSPITALIZATION.id,
    code: 'Q1_HOSPITALIZATION',
    label: 'Tình trạng nhập viện hiện tại',
    description: 'Người được bảo hiểm hiện đang điều trị nội trú hoặc đang chờ nhập viện?',
    yesOption: HEALTH_QUESTIONS.Q1_HOSPITALIZATION.yesOption,
    noOption: HEALTH_QUESTIONS.Q1_HOSPITALIZATION.noOption,
    textField: HEALTH_QUESTIONS.Q1_HOSPITALIZATION.textField,
    textPlaceholder: 'Vui lòng mô tả tình trạng điều trị hiện tại...',
  },
  {
    id: HEALTH_QUESTIONS.Q2_ONGOING_TREATMENT.id,
    code: 'Q2_ONGOING_TREATMENT',
    label: 'Điều trị/bệnh trong 12 tháng',
    description: 'Trong 12 tháng qua, người được bảo hiểm có đang điều trị bệnh hoặc có bất kỳ triệu chứng/tình trạng sức khỏe nào cần thăm khám?',
    yesOption: HEALTH_QUESTIONS.Q2_ONGOING_TREATMENT.yesOption,
    noOption: HEALTH_QUESTIONS.Q2_ONGOING_TREATMENT.noOption,
    textField: HEALTH_QUESTIONS.Q2_ONGOING_TREATMENT.textField,
    textPlaceholder: 'Vui lòng mô tả triệu chứng hoặc tình trạng sức khỏe...',
  },
  {
    id: HEALTH_QUESTIONS.Q3_CHRONIC_CONDITIONS.id,
    code: 'Q3_CHRONIC_CONDITIONS',
    label: 'Bệnh mãn tính trong 3 năm',
    description: 'Trong 3 năm qua, người được bảo hiểm có được chẩn đoán hoặc điều trị các bệnh: ung thư, tăng huyết áp, bệnh tim mạch, loét dạ dày/tá tràng, viêm khớp, lao phổi, tiểu đường, thoát vị đĩa đệm, hoặc các bệnh mãn tính khác?',
    yesOption: HEALTH_QUESTIONS.Q3_CHRONIC_CONDITIONS.yesOption,
    noOption: HEALTH_QUESTIONS.Q3_CHRONIC_CONDITIONS.noOption,
    textField: HEALTH_QUESTIONS.Q3_CHRONIC_CONDITIONS.textField,
    textPlaceholder: 'Vui lòng liệt kê các bệnh đã được chẩn đoán/điều trị...',
  },
  {
    id: HEALTH_QUESTIONS.Q4_PREVIOUS_CLAIMS.id,
    code: 'Q4_PREVIOUS_CLAIMS',
    label: 'Yêu cầu bồi thường tại BHV',
    description: 'Người được bảo hiểm đã từng yêu cầu bồi thường tại BHV hoặc bất kỳ công ty bảo hiểm nào khác?',
    yesOption: HEALTH_QUESTIONS.Q4_PREVIOUS_CLAIMS.yesOption,
    noOption: HEALTH_QUESTIONS.Q4_PREVIOUS_CLAIMS.noOption,
    textField: HEALTH_QUESTIONS.Q4_PREVIOUS_CLAIMS.textField,
    textPlaceholder: 'Vui lòng mô tả lịch sử yêu cầu bồi thường...',
  },
  {
    id: HEALTH_QUESTIONS.Q5_PREVIOUS_REJECTION.id,
    code: 'Q5_PREVIOUS_REJECTION',
    label: 'Từ chối/điều kiện đặc biệt',
    description: 'Người được bảo hiểm đã từng bị từ chối bảo hiểm, áp dụng điều kiện đặc biệt, hoặc tăng phí bảo hiểm?',
    yesOption: HEALTH_QUESTIONS.Q5_PREVIOUS_REJECTION.yesOption,
    noOption: HEALTH_QUESTIONS.Q5_PREVIOUS_REJECTION.noOption,
    textField: HEALTH_QUESTIONS.Q5_PREVIOUS_REJECTION.textField,
    textPlaceholder: 'Vui lòng mô tả chi tiết...',
  },
];

/**
 * Get question definition by ID
 */
export function getHealthQuestionById(id: string): HealthQuestionDefinition | undefined {
  return HEALTH_QUESTION_DEFINITIONS.find(q => q.id === id);
}

/**
 * Get question definition by code
 */
export function getHealthQuestionByCode(code: string): HealthQuestionDefinition | undefined {
  return HEALTH_QUESTION_DEFINITIONS.find(q => q.code === code);
}

/**
 * Get all question IDs
 */
export function getAllHealthQuestionIds(): string[] {
  return HEALTH_QUESTION_DEFINITIONS.map(q => q.id);
}
