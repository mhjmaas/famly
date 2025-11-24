export const activityNlNL = {
  activity: {
    task: {
      created: "Taak gemaakt: {taskName}",
      createdTitle: "Taak Gemaakt",
      completed: "{taskName} is voltooid",
      completedTitle: "Taak Voltooid",
    },
    contributionGoal: {
      deducted: '{amount} karma afgetrokken van "{goalTitle}"',
      deductedTitle: "Bijdrage Afgetrokken",
      awarded: '{amount} karma toegekend van "{goalTitle}"',
      awardedTitle: "Bijdrage Toegekend",
    },
    karma: {
      awarded: "Karma toegekend: {amount} {description}",
      awardedTitle: "Karma Toegekend",
      deducted: "Karma afgetrokken: {amount} {description}",
      deductedTitle: "Karma Afgetrokken",
    },
    reward: {
      claimed: "Beloning geclaimd: {rewardName}",
      claimedTitle: "Beloning Geclaimd",
    },
    shoppingList: {
      updated: "Boodschappenlijst bijgewerkt: {listName}",
      updatedTitle: "Boodschappenlijst Bijgewerkt",
    },
    diary: {
      entry: "Dagboekitem toegevoegd: {title}",
      entryTitle: "Dagboekitem",
      familyEntry: "Gezinsdagboekitem toegevoegd: {title}",
      familyEntryTitle: "Gezinsdagboekitem",
    },
    default: "Activiteit vastgelegd",
  },
} as const;
