export const activityNlNL = {
  activity: {
    task: {
      created: "Taak: {taskName}",
      createdTitle: "Taak Gemaakt",
      completed: "{taskName} is voltooid",
      completedTitle: "Taak Voltooid",
    },
    contributionGoal: {
      deducted: '{amount} minpunten van "{goalTitle}"',
      deductedTitle: "Minpunten",
      awarded: '{amount} pluspunten toegekend van "{goalTitle}"',
      awardedTitle: "Pluspunten",
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
