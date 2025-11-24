import { ObjectId } from "mongodb";
import { ContributionGoalProcessorService } from "../services/contribution-goal-processor.service";

jest.mock("../events/contribution-goal-events", () => ({
  emitContributionGoalAwarded: jest.fn(),
}));

jest.mock("@modules/notifications", () => ({
  createContributionGoalAwardedNotification: jest.fn(() => ({
    key: "awarded",
  })),
  createContributionGoalZeroKarmaNotification: jest.fn(() => ({ key: "zero" })),
  sendToUser: jest.fn(async () => {}),
}));

jest.mock("@lib/user-utils", () => ({
  getUserLanguage: jest.fn(async () => "en-US"),
}));

const mockAwardKarma = jest.fn(async () => {});
const mockRecordEvent = jest.fn(async () => {});

const makeGoal = (overrides: Partial<any> = {}) => ({
  _id: new ObjectId(),
  familyId: new ObjectId(),
  memberId: new ObjectId(),
  weekStartDate: new Date("2025-11-16T18:00:00.000Z"),
  title: "Test Goal",
  description: "Desc",
  maxKarma: 100,
  deductions: [],
  recurring: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("ContributionGoalProcessorService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("recreates next week's goal when recurring and deletes current first", async () => {
    const currentGoal = makeGoal();

    const findActiveGoalsForWeek = jest.fn(async () => [currentGoal]);
    const deleteById = jest.fn(async () => true);
    const createForWeek = jest.fn(async () =>
      makeGoal({ weekStartDate: new Date("2025-11-23T18:00:00.000Z") }),
    );

    const processor = new ContributionGoalProcessorService(
      { findActiveGoalsForWeek, deleteById, createForWeek } as any,
      { awardKarma: mockAwardKarma } as any,
      { recordEvent: mockRecordEvent } as any,
    );

    await processor.processWeeklyGoals(new Date("2025-11-16T18:00:00.000Z"));

    expect(findActiveGoalsForWeek).toHaveBeenCalledTimes(1);
    expect(mockAwardKarma).toHaveBeenCalledTimes(1);
    expect(deleteById).toHaveBeenCalledTimes(1);
    expect(createForWeek).toHaveBeenCalledTimes(1);
    expect(deleteById.mock.invocationCallOrder[0]).toBeLessThan(
      createForWeek.mock.invocationCallOrder[0],
    );
  });

  it("does not recreate when goal is not recurring", async () => {
    const currentGoal = makeGoal({ recurring: false });

    const findActiveGoalsForWeek = jest.fn(async () => [currentGoal]);
    const deleteById = jest.fn(async () => true);
    const createForWeek = jest.fn();

    const processor = new ContributionGoalProcessorService(
      { findActiveGoalsForWeek, deleteById, createForWeek } as any,
      { awardKarma: mockAwardKarma } as any,
      { recordEvent: mockRecordEvent } as any,
    );

    await processor.processWeeklyGoals(new Date("2025-11-16T18:00:00.000Z"));

    expect(deleteById).toHaveBeenCalledTimes(1);
    expect(createForWeek).not.toHaveBeenCalled();
  });
});
