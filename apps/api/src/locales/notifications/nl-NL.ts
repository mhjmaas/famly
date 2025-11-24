export const notificationsNlNL = {
  notifications: {
    karma: {
      awarded: "Karma Beloond!",
      awardedDescription: "Je hebt {amount} karma verdiend{description}",
      awardedDescriptionWithReason:
        "Je hebt {amount} karma verdiend voor {reason}",
      deducted: "Karma Gebruikt",
      deductedDescription: "{amount} karma uitgegeven{description}",
    },
    task: {
      created: "Nieuwe Taak Toegewezen",
      createdDescription: "Taak:{name}",
      assigned: "Taak aan je Toegewezen",
      assignedDescription: "{name}",
      completed: "Je Taak is Voltooid",
      completedDescription: "{name} is voltooid gemarkeerd",
      completedWithKarmaDescription:
        "{name} is voltooid gemarkeerd en leverde {karma} karma op",
    },
    reward: {
      created: "Nieuwe Beloningsclaim",
      createdDescription:
        "{memberName} heeft een beloningsclaim ingediend voor {rewardName}",
      claimed: "Beloning Geclaimd!",
      claimedDescription: "Je hebt {rewardName} geclaimd",
      completed: "Beloning Voltooid",
      completedDescription:
        "Je beloningsclaim voor {rewardName} is ingewilligd",
      cancelled: "Claim Geannuleerd",
      cancelledDescription:
        "De beloningsclaim voor {rewardName} is geannuleerd",
      approvalTaskCreated: "Goedkeuring Nodig",
      approvalTaskCreatedDescription:
        "{memberName} wacht op goedkeuring voor {rewardName}",
      updated: "Beloning Bijgewerkt",
      updatedDescription: "Beloning {rewardName} is bijgewerkt",
      deleted: "Beloning Verwijderd",
      deletedDescription: "Beloning {rewardName} is verwijderd",
    },
    family: {
      memberAdded: "Nieuw Gezinslid",
      memberAddedDescription: "{memberName} is lid van het gezin geworden",
      memberRemoved: "Lid Verwijderd",
      memberRemovedDescription: "{memberName} is uit het gezin verwijderd",
      roleUpdated: "Rol Bijgewerkt",
      roleUpdatedDescription:
        "De rol van {memberName} is bijgewerkt naar {newRole}",
    },
    activity: {
      taskCompleted: "Taak Voltooid",
      taskCompletedDescription: "Taak voltooid door {memberName}",
    },
    contributionGoal: {
      awarded: "Gezinsbijdrage-doelvoortgang",
      awardedDescription:
        "{memberName} heeft {amount} karma verdiend naar hun doel",
      deducted: "Minpunt Toegepast",
      deductedDescription:
        "{memberName} had {amount} karma afgetrokken van hun doel",
      updated: "Doel Bijgewerkt",
      updatedDescription: "Gezinsbijdrage-doel is bijgewerkt",
      zeroKarma: "Wekelijks Doel Beëindigd",
      zeroKarmaDescription:
        'Je bijdrage-doel "{goalTitle}" eindigde zonder karma - alle potentieel is afgetrokken',
    },
    chat: {
      message: "Nieuw Bericht van {senderName}",
      messageDescription: "{messagePreview}",
    },
  },
} as const;
