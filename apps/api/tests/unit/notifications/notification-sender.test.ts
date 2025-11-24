const sendNotificationMock = jest.fn();

jest.mock("@modules/notifications/services/notification.service", () => {
  return {
    NotificationService: jest.fn().mockImplementation(() => ({
      isVapidConfigured: () => true,
      sendNotification: sendNotificationMock,
    })),
  };
});

jest.mock("@lib/user-utils", () => {
  return {
    getUserLanguages: jest.fn().mockResolvedValue(
      new Map([
        ["user-en", "en-US"],
        ["user-nl", "nl-NL"],
      ]),
    ),
  };
});

describe("sendToMultipleUsers localization", () => {
  beforeEach(() => {
    sendNotificationMock.mockClear();
  });

  it("sends localized payload per recipient", async () => {
    process.env.MONGODB_URI = "mongodb://localhost:27017/test";
    process.env.BETTER_AUTH_SECRET = "12345678901234567890123456789012";
    process.env.BETTER_AUTH_URL = "http://localhost:3000";
    process.env.MINIO_ENDPOINT = "localhost";
    process.env.MINIO_ROOT_USER = "minio";
    process.env.MINIO_ROOT_PASSWORD = "miniopass";
    process.env.MINIO_BUCKET = "test";

    const { sendToMultipleUsers } = await import(
      "@modules/notifications/lib/notification-sender"
    );

    await sendToMultipleUsers(["user-en", "user-nl"], (locale, userId) => ({
      title: `title-${locale}`,
      body: `body-${userId}-${locale}`,
      data: { type: "test" },
    }));

    expect(sendNotificationMock).toHaveBeenCalledWith(
      "user-en",
      expect.objectContaining({
        title: "title-en-US",
        body: "body-user-en-en-US",
      }),
    );

    expect(sendNotificationMock).toHaveBeenCalledWith(
      "user-nl",
      expect.objectContaining({
        title: "title-nl-NL",
        body: "body-user-nl-nl-NL",
      }),
    );
  });

  it("sends notifications with actual karma translations to multiple users", async () => {
    process.env.MONGODB_URI = "mongodb://localhost:27017/test";
    process.env.BETTER_AUTH_SECRET = "12345678901234567890123456789012";
    process.env.BETTER_AUTH_URL = "http://localhost:3000";
    process.env.MINIO_ENDPOINT = "localhost";
    process.env.MINIO_ROOT_USER = "minio";
    process.env.MINIO_ROOT_PASSWORD = "miniopass";
    process.env.MINIO_BUCKET = "test";

    const { sendToMultipleUsers } = await import(
      "@modules/notifications/lib/notification-sender"
    );
    const { createKarmaGrantNotification } = await import(
      "@modules/notifications/lib/notification-templates"
    );

    await sendToMultipleUsers(["user-en", "user-nl"], (locale) =>
      createKarmaGrantNotification(locale, 50, "parent-user", "helping out"),
    );

    // Verify English-speaking user receives English translation
    expect(sendNotificationMock).toHaveBeenCalledWith(
      "user-en",
      expect.objectContaining({
        title: "Karma Awarded!",
        body: expect.stringContaining("50 karma"),
        data: expect.objectContaining({ type: "karma_grant" }),
      }),
    );

    // Verify Dutch-speaking user receives Dutch translation
    expect(sendNotificationMock).toHaveBeenCalledWith(
      "user-nl",
      expect.objectContaining({
        title: "Karma Beloond!",
        body: expect.stringContaining("50 karma"),
        data: expect.objectContaining({ type: "karma_grant" }),
      }),
    );
  });

  it("sends task completion notifications with actual translations to multiple users", async () => {
    process.env.MONGODB_URI = "mongodb://localhost:27017/test";
    process.env.BETTER_AUTH_SECRET = "12345678901234567890123456789012";
    process.env.BETTER_AUTH_URL = "http://localhost:3000";
    process.env.MINIO_ENDPOINT = "localhost";
    process.env.MINIO_ROOT_USER = "minio";
    process.env.MINIO_ROOT_PASSWORD = "miniopass";
    process.env.MINIO_BUCKET = "test";

    const { sendToMultipleUsers } = await import(
      "@modules/notifications/lib/notification-sender"
    );
    const { createTaskCompletionNotification } = await import(
      "@modules/notifications/lib/notification-templates"
    );

    await sendToMultipleUsers(["user-en", "user-nl"], (locale) =>
      createTaskCompletionNotification(
        locale,
        "Clean kitchen",
        "parent-user",
        25,
      ),
    );

    // Verify English-speaking user receives English translation
    expect(sendNotificationMock).toHaveBeenCalledWith(
      "user-en",
      expect.objectContaining({
        title: "Your Task Was Completed",
        body: expect.stringContaining("earned 25 karma"),
        data: expect.objectContaining({ type: "task_completion" }),
      }),
    );

    // Verify Dutch-speaking user receives Dutch translation
    expect(sendNotificationMock).toHaveBeenCalledWith(
      "user-nl",
      expect.objectContaining({
        title: "Je Taak is Voltooid",
        body: expect.stringContaining("leverde 25 karma op"),
        data: expect.objectContaining({ type: "task_completion" }),
      }),
    );
  });
});
