import type {
  ContributionGoal,
  ContributionGoalDTO,
  Deduction,
  DeductionDTO,
} from "../domain/contribution-goal";

/**
 * Calculate the current karma for a contribution goal
 * currentKarma = maxKarma - sum of all deduction amounts
 */
export function calculateCurrentKarma(goal: ContributionGoal): number {
  const totalDeductions = goal.deductions.reduce(
    (sum, deduction) => sum + deduction.amount,
    0,
  );
  return Math.max(0, goal.maxKarma - totalDeductions);
}

/**
 * Convert a Deduction entity to a DeductionDTO for API responses
 */
export function toDeductionDTO(deduction: Deduction): DeductionDTO {
  return {
    _id: deduction._id.toString(),
    amount: deduction.amount,
    reason: deduction.reason,
    deductedBy: deduction.deductedBy.toString(),
    createdAt: deduction.createdAt.toISOString(),
  };
}

/**
 * Convert a ContributionGoal entity to a ContributionGoalDTO for API responses
 */
export function toContributionGoalDTO(
  goal: ContributionGoal,
): ContributionGoalDTO {
  return {
    _id: goal._id.toString(),
    familyId: goal.familyId.toString(),
    memberId: goal.memberId.toString(),
    weekStartDate: goal.weekStartDate.toISOString(),
    title: goal.title,
    description: goal.description,
    maxKarma: goal.maxKarma,
    recurring: goal.recurring,
    currentKarma: calculateCurrentKarma(goal),
    deductions: goal.deductions.map(toDeductionDTO),
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString(),
  };
}
