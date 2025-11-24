export const activityEnUS = {
  activity: {
    task: {
      created: "Task created: {taskName}",
      createdTitle: "Task Created",
      completed: "{taskName} was completed",
      completedTitle: "Task Completed",
    },
    contributionGoal: {
      deducted: '{amount} karma deducted from "{goalTitle}"',
      deductedTitle: "Contribution Deducted",
      awarded: '{amount} karma awarded from "{goalTitle}"',
      awardedTitle: "Contribution Awarded",
    },
    karma: {
      awarded: "{amount} Karma points: {description}",
      awardedTitle: "Karma Awarded",
      deducted: "Karma deducted: {amount} {description}",
      deductedTitle: "Karma Deducted",
    },
    reward: {
      claimed: "Reward claimed: {rewardName}",
      claimedTitle: "Reward Claimed",
    },
    shoppingList: {
      updated: "Shopping list updated: {listName}",
      updatedTitle: "Shopping List Updated",
    },
    diary: {
      entry: "Diary entry added: {title}",
      entryTitle: "Diary Entry",
      familyEntry: "Family diary entry added: {title}",
      familyEntryTitle: "Family Diary Entry",
    },
    default: "Activity recorded",
  },
} as const;

export type ActivityDictionary = typeof activityEnUS;
