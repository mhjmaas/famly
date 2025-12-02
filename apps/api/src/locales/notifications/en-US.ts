export const notificationsEnUS = {
  notifications: {
    karma: {
      awarded: "Karma Awarded!",
      awardedDescription: "You earned {amount} karma{description}",
      awardedDescriptionWithReason: "You earned {amount} karma for {reason}",
      deducted: "Karma Used",
      deductedDescription: "{amount} karma spent{description}",
    },
    task: {
      created: "New Task Assigned",
      createdDescription: "You've been assigned: {name}",
      assigned: "Task Assigned to You",
      assignedDescription: "{name}",
      completed: "Your Task Was Completed",
      completedDescription: "{name} was marked complete",
      completedWithKarmaDescription:
        "{name} was marked complete and earned {karma} karma",
    },
    reward: {
      created: "New Reward Claim",
      createdDescription:
        "{memberName} has submitted a reward claim for {rewardName}",
      claimed: "Reward Claimed!",
      claimedDescription: "You claimed {rewardName}",
      completed: "Reward Completed",
      completedDescription:
        "Your reward claim for {rewardName} has been fulfilled",
      cancelled: "Claim Cancelled",
      cancelledDescription:
        "The reward claim for {rewardName} has been cancelled",
      approvalTaskCreated: "Approval Needed",
      approvalTaskCreatedDescription:
        "{memberName} is awaiting approval for {rewardName}",
      updated: "Reward Updated",
      updatedDescription: "Reward {rewardName} has been updated",
      deleted: "Reward Deleted",
      deletedDescription: "Reward {rewardName} has been deleted",
    },
    family: {
      memberAdded: "New Family Member",
      memberAddedDescription: "{memberName} has joined the family",
      memberRemoved: "Member Removed",
      memberRemovedDescription: "{memberName} has been removed from the family",
      roleUpdated: "Role Updated",
      roleUpdatedDescription:
        "{memberName}'s role has been updated to {newRole}",
    },
    activity: {
      taskCompleted: "Task Completed",
      taskCompletedDescription: "Task completed by {memberName}",
    },
    contributionGoal: {
      awarded: "Contribution Goal Progress",
      awardedDescription:
        "{memberName} earned {amount} karma toward their goal",
      deducted: "Deduction Applied",
      deductedDescription:
        "{memberName} had {amount} karma deducted from their goal",
      deductedWithReasonTitle: "Deduction: {amount} point(s)",
      deductedWithReasonDescription: "{reason}",
      updated: "Goal Updated",
      updatedDescription: "Contribution goal has been updated",
      zeroKarma: "Weekly Goal Ended",
      zeroKarmaDescription:
        'Your contribution goal "{goalTitle}" ended with no karma - all potential karma was deducted',
    },
    chat: {
      message: "Message from: {senderName}",
      messageDescription: "{messagePreview}",
    },
  },
} as const;

export type NotificationDictionary = typeof notificationsEnUS;
